import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type {
  Achievement,
  UserAchievement,
  Level,
  UserProgress,
  PendingLevelUp,
  GamificationContextType,
  AchievementStats,
  AchievementRow,
  UserAchievementRow,
  LevelRow,
} from '@/types/gamification';

// =====================================================
// Helper Functions
// =====================================================

function mapAchievementRow(row: AchievementRow): Achievement {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    icon: row.icon,
    color: row.color,
    category: row.category as Achievement['category'],
    requirementType: row.requirement_type as Achievement['requirementType'],
    requirementValue: row.requirement_value,
    pointsReward: row.points_reward,
    isSecret: row.is_secret,
    createdAt: new Date(row.created_at),
  };
}

function mapLevelRow(row: LevelRow): Level {
  return {
    level: row.level,
    title: row.title,
    minPoints: row.min_points,
    icon: row.icon,
    color: row.color,
  };
}

function mapUserAchievementRow(row: UserAchievementRow): UserAchievement {
  return {
    id: row.id,
    oderId: row.user_id,
    achievementId: row.achievement_id,
    unlockedAt: new Date(row.unlocked_at),
    achievement: row.achievements ? mapAchievementRow(row.achievements) : {} as Achievement,
  };
}

// =====================================================
// Context
// =====================================================

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

interface GamificationProviderProps {
  children: ReactNode;
}

export function GamificationProvider({ children }: GamificationProviderProps) {
  const { user } = useAuth();
  
  // State
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [allLevels, setAllLevels] = useState<Level[]>([]);
  const [pendingAchievements, setPendingAchievements] = useState<Achievement[]>([]);
  const [pendingLevelUp, setPendingLevelUp] = useState<PendingLevelUp | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate level from points
  const calculateLevel = useCallback((points: number): Level => {
    const sortedLevels = [...allLevels].sort((a, b) => b.minPoints - a.minPoints);
    return sortedLevels.find(level => points >= level.minPoints) || allLevels[0] || {
      level: 1,
      title: 'Iniciante',
      minPoints: 0,
      icon: 'Sprout',
      color: '#A3E635',
    };
  }, [allLevels]);

  // Get next level
  const getNextLevel = useCallback((currentLevel: Level): Level | null => {
    const nextLevelNum = currentLevel.level + 1;
    return allLevels.find(l => l.level === nextLevelNum) || null;
  }, [allLevels]);

  // Load all achievements and levels
  const loadBaseData = useCallback(async () => {
    try {
      // Load achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('category', { ascending: true });

      if (achievementsError) throw achievementsError;
      setAllAchievements((achievementsData || []).map(mapAchievementRow));

      // Load levels
      const { data: levelsData, error: levelsError } = await supabase
        .from('levels')
        .select('*')
        .order('level', { ascending: true });

      if (levelsError) throw levelsError;
      setAllLevels((levelsData || []).map(mapLevelRow));
    } catch (error) {
      console.error('Error loading gamification base data:', error);
    }
  }, []);

  // Load user progress
  const loadProgress = useCallback(async () => {
    if (!user) {
      setUserProgress(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Load user achievements with achievement details
      const { data: userAchievementsData, error: uaError } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements (*)
        `)
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });

      if (uaError) throw uaError;

      const userAchievements = (userAchievementsData || []).map(mapUserAchievementRow);
      const recentAchievements = userAchievements.slice(0, 5);

      // Get total points from user stats (or calculate from achievements)
      // For now, calculate from achievement rewards
      const totalPoints = userAchievements.reduce(
        (sum, ua) => sum + (ua.achievement?.pointsReward || 0),
        245 // Base points
      );

      const currentLevel = calculateLevel(totalPoints);
      const nextLevel = getNextLevel(currentLevel);
      const pointsToNextLevel = nextLevel ? nextLevel.minPoints - totalPoints : 0;
      const progressPercent = nextLevel
        ? ((totalPoints - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
        : 100;

      setUserProgress({
        currentLevel,
        nextLevel,
        totalPoints,
        pointsToNextLevel,
        progressPercent: Math.min(100, Math.max(0, progressPercent)),
        achievements: userAchievements,
        recentAchievements,
      });
    } catch (error) {
      console.error('Error loading user progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, calculateLevel, getNextLevel]);

  // Add points and check for level up
  const addPoints = useCallback(async (amount: number, source: string) => {
    if (!userProgress) return;

    const newTotal = userProgress.totalPoints + amount;
    const previousLevel = userProgress.currentLevel;
    const newLevel = calculateLevel(newTotal);

    // Check for level up
    if (newLevel.level > previousLevel.level) {
      setPendingLevelUp({ previousLevel, newLevel });
      setShowLevelUpModal(true);
    }

    // Update progress
    const nextLevel = getNextLevel(newLevel);
    const pointsToNextLevel = nextLevel ? nextLevel.minPoints - newTotal : 0;
    const progressPercent = nextLevel
      ? ((newTotal - newLevel.minPoints) / (nextLevel.minPoints - newLevel.minPoints)) * 100
      : 100;

    setUserProgress({
      ...userProgress,
      totalPoints: newTotal,
      currentLevel: newLevel,
      nextLevel,
      pointsToNextLevel,
      progressPercent: Math.min(100, Math.max(0, progressPercent)),
    });

    console.log(`[Gamification] Added ${amount} points from ${source}. Total: ${newTotal}`);
  }, [userProgress, calculateLevel, getNextLevel]);

  // Unlock an achievement
  const unlockAchievement = useCallback(async (code: string) => {
    if (!user) return;

    const achievement = allAchievements.find(a => a.code === code);
    if (!achievement) {
      console.warn(`Achievement with code "${code}" not found`);
      return;
    }

    // Check if already unlocked
    const alreadyUnlocked = userProgress?.achievements.some(
      ua => ua.achievement.code === code
    );
    if (alreadyUnlocked) return;

    try {
      // Insert into database
      const { error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          achievement_id: achievement.id,
        });

      if (error) {
        if (error.code === '23505') {
          // Duplicate - already unlocked
          return;
        }
        throw error;
      }

      // Add to pending queue and show modal
      setPendingAchievements(prev => [...prev, achievement]);
      setShowAchievementModal(true);

      // Add points reward
      if (achievement.pointsReward > 0) {
        await addPoints(achievement.pointsReward, `achievement:${code}`);
      }

      // Reload progress to update achievements list
      await loadProgress();

      console.log(`[Gamification] Unlocked achievement: ${achievement.title}`);
    } catch (error) {
      console.error('Error unlocking achievement:', error);
    }
  }, [user, allAchievements, userProgress, addPoints, loadProgress]);

  // Check achievements based on stats
  const checkAchievements = useCallback(async (stats: AchievementStats) => {
    if (!user || !userProgress) return;

    const unlockedCodes = new Set(
      userProgress.achievements.map(ua => ua.achievement.code)
    );

    for (const achievement of allAchievements) {
      if (unlockedCodes.has(achievement.code)) continue;

      let shouldUnlock = false;

      switch (achievement.code) {
        // Task achievements
        case 'first_task':
          shouldUnlock = stats.tasksCompleted >= 1;
          break;
        case 'tasks_10':
          shouldUnlock = stats.tasksCompleted >= 10;
          break;
        case 'tasks_50':
          shouldUnlock = stats.tasksCompleted >= 50;
          break;
        case 'tasks_100':
          shouldUnlock = stats.tasksCompleted >= 100;
          break;

        // Focus achievements
        case 'focus_1h':
          shouldUnlock = stats.focusMinutesTotal >= 60;
          break;
        case 'focus_10h':
          shouldUnlock = stats.focusMinutesTotal >= 600;
          break;

        // Streak achievements
        case 'streak_3':
          shouldUnlock = stats.currentStreak >= 3;
          break;
        case 'streak_7':
          shouldUnlock = stats.currentStreak >= 7;
          break;
        case 'streak_30':
          shouldUnlock = stats.currentStreak >= 30;
          break;

        // Habit achievements
        case 'habit_master':
          shouldUnlock = stats.habitsCompletedStreak >= 7;
          break;

        // Special achievements
        case 'early_bird':
          shouldUnlock = stats.hasEarlyBirdTask;
          break;
        case 'night_owl':
          shouldUnlock = stats.hasNightOwlTask;
          break;
        case 'panic_survivor':
          shouldUnlock = stats.hasPanicModeSurvived;
          break;
      }

      if (shouldUnlock) {
        await unlockAchievement(achievement.code);
      }
    }
  }, [user, userProgress, allAchievements, unlockAchievement]);

  // Get next achievements to unlock
  const getNextAchievements = useCallback((limit = 3): Achievement[] => {
    if (!userProgress) return [];

    const unlockedCodes = new Set(
      userProgress.achievements.map(ua => ua.achievement.code)
    );

    return allAchievements
      .filter(a => !unlockedCodes.has(a.code) && !a.isSecret)
      .slice(0, limit);
  }, [userProgress, allAchievements]);

  // Get progress for a specific achievement
  const getAchievementProgress = useCallback(
    (achievement: Achievement, stats: AchievementStats): number => {
      let current = 0;
      const target = achievement.requirementValue;

      switch (achievement.category) {
        case 'tasks':
          current = stats.tasksCompleted;
          break;
        case 'focus':
          current = stats.focusMinutesTotal;
          break;
        case 'streaks':
          current = stats.currentStreak;
          break;
        case 'habits':
          current = stats.habitsCompletedStreak;
          break;
        case 'special':
          // Special achievements are binary
          return 0;
      }

      return Math.min(100, (current / target) * 100);
    },
    []
  );

  // Modal dismiss functions
  const dismissAchievementModal = useCallback(() => {
    setShowAchievementModal(false);
    // Remove the first achievement from pending queue
    setPendingAchievements(prev => prev.slice(1));
    
    // If there are more pending, show the next one
    setTimeout(() => {
      if (pendingAchievements.length > 1) {
        setShowAchievementModal(true);
      }
    }, 300);
  }, [pendingAchievements]);

  const dismissLevelUpModal = useCallback(() => {
    setShowLevelUpModal(false);
    setPendingLevelUp(null);
  }, []);

  // Load base data on mount
  useEffect(() => {
    loadBaseData();
  }, [loadBaseData]);

  // Load user progress when user changes or base data loads
  useEffect(() => {
    if (allAchievements.length > 0 && allLevels.length > 0) {
      loadProgress();
    }
  }, [user, allAchievements.length, allLevels.length, loadProgress]);

  const value: GamificationContextType = {
    userProgress,
    pendingAchievements,
    pendingLevelUp,
    showAchievementModal,
    showLevelUpModal,
    isLoading,
    loadProgress,
    addPoints,
    checkAchievements,
    unlockAchievement,
    dismissAchievementModal,
    dismissLevelUpModal,
    getNextAchievements,
    getAchievementProgress,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
}

// =====================================================
// Hook
// =====================================================

export function useGamification(): GamificationContextType {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}
