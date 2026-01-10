// =====================================================
// Module 6: Gamification Types
// =====================================================

export type AchievementCategory = 'tasks' | 'focus' | 'habits' | 'streaks' | 'special';
export type RequirementType = 'count' | 'streak' | 'total' | 'special';

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: AchievementCategory;
  requirementType: RequirementType;
  requirementValue: number;
  pointsReward: number;
  isSecret: boolean;
  createdAt?: Date;
}

export interface UserAchievement {
  id: string;
  oderId: string;
  achievementId: string;
  unlockedAt: Date;
  achievement: Achievement;
}

export interface Level {
  level: number;
  title: string;
  minPoints: number;
  icon: string;
  color: string;
}

export interface UserProgress {
  currentLevel: Level;
  nextLevel: Level | null;
  totalPoints: number;
  pointsToNextLevel: number;
  progressPercent: number;
  achievements: UserAchievement[];
  recentAchievements: UserAchievement[];
}

// Stats for achievement checking
export interface AchievementStats {
  tasksCompleted: number;
  focusMinutesTotal: number;
  currentStreak: number;
  longestStreak: number;
  habitsCompletedStreak: number;
  hasPanicModeSurvived: boolean;
  hasEarlyBirdTask: boolean;
  hasNightOwlTask: boolean;
}

// Context types
export interface PendingLevelUp {
  previousLevel: Level;
  newLevel: Level;
}

export interface GamificationContextType {
  // State
  userProgress: UserProgress | null;
  pendingAchievements: Achievement[];
  pendingLevelUp: PendingLevelUp | null;
  showAchievementModal: boolean;
  showLevelUpModal: boolean;
  isLoading: boolean;
  
  // Actions
  loadProgress: () => Promise<void>;
  addPoints: (amount: number, source: string) => Promise<void>;
  checkAchievements: (stats: AchievementStats) => Promise<void>;
  unlockAchievement: (code: string) => Promise<void>;
  dismissAchievementModal: () => void;
  dismissLevelUpModal: () => void;
  getNextAchievements: (limit?: number) => Achievement[];
  getAchievementProgress: (achievement: Achievement, stats: AchievementStats) => number;
}

// Database row types (snake_case for Supabase)
export interface AchievementRow {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  points_reward: number;
  is_secret: boolean;
  created_at: string;
}

export interface UserAchievementRow {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievements?: AchievementRow;
}

export interface LevelRow {
  level: number;
  title: string;
  min_points: number;
  icon: string;
  color: string;
}
