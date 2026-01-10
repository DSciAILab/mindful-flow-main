import { useMemo, useCallback } from 'react';
import type { Task, EnergyLevel, TaskContext } from '@/types';

interface TaskFilters {
  energy?: EnergyLevel;
  contexts?: TaskContext[];
  availableTime?: number;
}

interface SuggestedTask {
  task: Task;
  reason: string;
  score: number;
}

// Energy level priority (for filtering - lower or equal energy is ok)
const energyPriority: Record<EnergyLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

export const useSmartTaskSuggestion = (tasks: Task[]) => {
  // Filter tasks by energy level (tasks requiring <= user's energy)
  const filterTasksByEnergy = useCallback((taskList: Task[], userEnergy: EnergyLevel): Task[] => {
    const userEnergyLevel = energyPriority[userEnergy];
    return taskList.filter((task) => {
      const taskEnergyLevel = energyPriority[task.energyRequired || 'medium'];
      return taskEnergyLevel <= userEnergyLevel;
    });
  }, []);

  // Filter tasks by context (task must have at least one matching context, or be @anywhere)
  const filterTasksByContext = useCallback((taskList: Task[], userContexts: TaskContext[]): Task[] => {
    if (userContexts.length === 0) return taskList;
    
    return taskList.filter((task) => {
      const taskContexts = task.contexts || [];
      // If task has no contexts, it can be done anywhere
      if (taskContexts.length === 0) return true;
      // If task includes @anywhere, it can be done in any context
      if (taskContexts.includes('@anywhere')) return true;
      // Check if any user context matches task contexts
      return taskContexts.some((c) => userContexts.includes(c));
    });
  }, []);

  // Filter tasks by available time
  const filterTasksByTime = useCallback((taskList: Task[], maxMinutes: number): Task[] => {
    return taskList.filter((task) => {
      // If task has no time requirement, include it
      if (!task.timeRequiredMinutes) return true;
      return task.timeRequiredMinutes <= maxMinutes;
    });
  }, []);

  // Calculate task score for ranking
  const calculateTaskScore = useCallback((task: Task): number => {
    let score = 0;

    // Priority score (urgent = 100, high = 75, medium = 50, low = 25)
    const priorityScores: Record<string, number> = {
      urgent: 100,
      high: 75,
      medium: 50,
      low: 25,
    };
    score += priorityScores[task.priority] || 50;

    // Due date score (closer = higher score)
    if (task.dueDate) {
      const now = new Date();
      const dueDate = new Date(task.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue < 0) {
        // Overdue - highest priority
        score += 150;
      } else if (daysUntilDue === 0) {
        // Due today
        score += 100;
      } else if (daysUntilDue <= 3) {
        // Due within 3 days
        score += 75;
      } else if (daysUntilDue <= 7) {
        // Due within a week
        score += 50;
      }
    }

    // Points bonus (gamification)
    score += Math.min(task.points || 0, 50);

    // Big 3 bonus
    if (task.isBig3) {
      score += 50;
    }

    return score;
  }, []);

  // Rank tasks by relevance
  const rankTasks = useCallback((taskList: Task[]): Task[] => {
    return [...taskList].sort((a, b) => {
      const scoreA = calculateTaskScore(a);
      const scoreB = calculateTaskScore(b);
      return scoreB - scoreA;
    });
  }, [calculateTaskScore]);

  // Get reason why task was suggested
  const getTaskReason = useCallback((task: Task): string => {
    const reasons: string[] = [];

    // Check due date
    if (task.dueDate) {
      const now = new Date();
      const dueDate = new Date(task.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue < 0) {
        reasons.push('⚠️ Atrasada');
      } else if (daysUntilDue === 0) {
        reasons.push('📅 Vence hoje');
      } else if (daysUntilDue <= 3) {
        reasons.push('📅 Vence em breve');
      }
    }

    // Check priority
    if (task.priority === 'urgent') {
      reasons.push('🔴 Urgente');
    } else if (task.priority === 'high') {
      reasons.push('🟠 Alta prioridade');
    }

    // Check energy
    if (task.energyRequired === 'low') {
      reasons.push('⚡ Baixa energia');
    }

    // Check time
    if (task.timeRequiredMinutes && task.timeRequiredMinutes <= 15) {
      reasons.push('⏱️ Rápida');
    }

    // Check Big 3
    if (task.isBig3) {
      reasons.push('⭐ Big 3');
    }

    // Check points
    if (task.points && task.points >= 30) {
      reasons.push(`🏆 ${task.points} pontos`);
    }

    return reasons.length > 0 ? reasons.join(' • ') : '✨ Boa opção para agora';
  }, []);

  // Get suggested task based on filters
  const getSuggestedTask = useCallback((
    energy: EnergyLevel,
    contexts: TaskContext[],
    availableTime?: number
  ): SuggestedTask | null => {
    let filtered = tasks.filter((t) => !t.completedAt && t.status !== 'done');
    
    // Apply filters
    filtered = filterTasksByEnergy(filtered, energy);
    filtered = filterTasksByContext(filtered, contexts);
    
    if (availableTime) {
      filtered = filterTasksByTime(filtered, availableTime);
    }

    // Rank and get top task
    const ranked = rankTasks(filtered);
    
    if (ranked.length === 0) return null;

    const topTask = ranked[0];
    return {
      task: topTask,
      reason: getTaskReason(topTask),
      score: calculateTaskScore(topTask),
    };
  }, [tasks, filterTasksByEnergy, filterTasksByContext, filterTasksByTime, rankTasks, getTaskReason, calculateTaskScore]);

  // Apply all filters and return filtered tasks
  const applyFilters = useCallback((filters: TaskFilters): Task[] => {
    let filtered = tasks.filter((t) => !t.completedAt && t.status !== 'done');

    if (filters.energy) {
      filtered = filterTasksByEnergy(filtered, filters.energy);
    }

    if (filters.contexts && filters.contexts.length > 0) {
      filtered = filterTasksByContext(filtered, filters.contexts);
    }

    if (filters.availableTime) {
      filtered = filterTasksByTime(filtered, filters.availableTime);
    }

    return rankTasks(filtered);
  }, [tasks, filterTasksByEnergy, filterTasksByContext, filterTasksByTime, rankTasks]);

  return {
    getSuggestedTask,
    filterTasksByEnergy,
    filterTasksByContext,
    filterTasksByTime,
    rankTasks,
    applyFilters,
    getTaskReason,
  };
};

export type { TaskFilters, SuggestedTask };
