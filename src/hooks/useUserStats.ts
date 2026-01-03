import { useState, useCallback } from 'react';
import type { UserStats } from '@/types';

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000];

interface ExtendedStats extends UserStats {
  focusSessionsToday: number;
}

export function useUserStats() {
  const [stats, setStats] = useState<ExtendedStats>({
    totalPoints: 245,
    currentStreak: 5,
    longestStreak: 12,
    tasksCompletedToday: 3,
    focusMinutesToday: 75,
    focusSessionsToday: 0,
    level: 3,
  });

  const addPoints = useCallback((points: number) => {
    setStats(prev => {
      const newTotal = prev.totalPoints + points;
      const newLevel = LEVEL_THRESHOLDS.findIndex(threshold => newTotal < threshold);
      return {
        ...prev,
        totalPoints: newTotal,
        level: newLevel > 0 ? newLevel : prev.level,
      };
    });
  }, []);

  const completeTask = useCallback((taskPoints: number) => {
    setStats(prev => ({
      ...prev,
      tasksCompletedToday: prev.tasksCompletedToday + 1,
      totalPoints: prev.totalPoints + taskPoints,
    }));
  }, []);

  const addFocusTime = useCallback((minutes: number) => {
    setStats(prev => ({
      ...prev,
      focusMinutesToday: prev.focusMinutesToday + minutes,
      totalPoints: prev.totalPoints + Math.floor(minutes / 5),
    }));
  }, []);

  const addFocusSession = useCallback(() => {
    setStats(prev => ({
      ...prev,
      focusSessionsToday: prev.focusSessionsToday + 1,
      totalPoints: prev.totalPoints + 10, // Bonus for completing a session
    }));
  }, []);

  const getPointsToNextLevel = useCallback(() => {
    const nextThreshold = LEVEL_THRESHOLDS[stats.level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    const currentThreshold = LEVEL_THRESHOLDS[stats.level - 1] || 0;
    return {
      current: stats.totalPoints - currentThreshold,
      needed: nextThreshold - currentThreshold,
      progress: (stats.totalPoints - currentThreshold) / (nextThreshold - currentThreshold),
    };
  }, [stats.totalPoints, stats.level]);

  return {
    stats,
    addPoints,
    completeTask,
    addFocusTime,
    addFocusSession,
    getPointsToNextLevel,
  };
}

