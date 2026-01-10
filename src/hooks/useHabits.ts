import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { Habit, HabitStreak, HabitWithStats, HabitArchiveStatus } from '@/types';
import { format, subDays, isAfter, isSameDay, differenceInDays } from 'date-fns';

const MAX_HABITS = 5;

export const useHabits = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [archivedHabits, setArchivedHabits] = useState<Habit[]>([]);
  const [streaks, setStreaks] = useState<Record<string, HabitStreak>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch habits and their streaks
  const fetchHabits = useCallback(async () => {
    if (!user) {
      setHabits([]);
      setStreaks({});
      setLoading(false);
      return;
    }

    try {
      // Fetch habits - filter using deleted_at if column exists
      const { data: habitsData, error: habitsError } = await supabase
        .from('mf_habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (habitsError) throw habitsError;

      // Filter out deleted habits client-side (backward compatible)
      const activeHabits = (habitsData || []).filter(h => !h.deleted_at);

      // Fetch logs for the last 90 days (for contribution graph)
      // Use only columns that are guaranteed to exist
      const ninetyDaysAgo = subDays(new Date(), 90);
      
      const { data: logsData, error: logsError } = await supabase
        .from('mf_habit_logs')
        .select('habit_id, log_date, completed')
        .eq('user_id', user.id)
        .gte('log_date', format(ninetyDaysAgo, 'yyyy-MM-dd'));

      if (logsError) throw logsError;

      // Try to fetch streaks (may fail if table doesn't exist)
      let streaksMap: Record<string, HabitStreak> = {};
      try {
        const { data: streaksData, error: streaksError } = await supabase
          .from('mf_habit_streaks')
          .select('*')
          .eq('user_id', user.id);

        if (!streaksError && streaksData) {
          streaksData.forEach((streak) => {
            streaksMap[streak.habit_id] = {
              id: streak.id,
              habitId: streak.habit_id,
              userId: streak.user_id,
              currentStreak: streak.current_streak || 0,
              longestStreak: streak.longest_streak || 0,
              lastCompletedAt: streak.last_completed_at ? new Date(streak.last_completed_at) : undefined,
              updatedAt: new Date(streak.updated_at),
            };
          });
        }
      } catch (err) {
        console.warn('Streaks table may not exist yet:', err);
      }
      setStreaks(streaksMap);

      // Map habits - handle missing columns gracefully
      const mappedHabits: Habit[] = activeHabits.map((habit) => {
        const habitLogs = (logsData || []).filter(log => log.habit_id === habit.id);
        const completedDays: Record<string, boolean> = {};
        habitLogs.forEach(log => {
          if (log.completed) {
            completedDays[log.log_date] = true;
          }
        });

        return {
          id: habit.id,
          title: habit.title,
          description: habit.description || undefined,
          icon: habit.icon || 'check', // Default if column doesn't exist
          frequency: (habit.frequency || 'daily') as Habit['frequency'],
          specificDays: habit.specific_days || undefined,
          daysOfWeek: habit.days_of_week || [0, 1, 2, 3, 4, 5, 6],
          color: habit.color || '#8B5CF6',
          reminderTime: habit.reminder_time || undefined,
          isActive: habit.is_active !== false, // Default to true
          projectId: habit.project_id || undefined,
          createdAt: new Date(habit.created_at),
          completedDays,
          // Archive fields
          archivedAt: habit.archived_at ? new Date(habit.archived_at) : undefined,
          archiveReason: habit.archive_reason || undefined,
          archiveStatus: habit.archive_status as HabitArchiveStatus || undefined,
        };
      });

      // Separate active and archived habits
      const active = mappedHabits.filter(h => !h.archivedAt);
      const archived = mappedHabits.filter(h => h.archivedAt);

      setHabits(active);
      setArchivedHabits(archived);
    } catch (error) {
      console.error('Error fetching habits:', error);
      toast({
        title: 'Erro ao carregar hábitos',
        description: 'Não foi possível carregar seus hábitos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  // Calculate in-memory streak (fallback if DB trigger hasn't run)
  const calculateStreak = useCallback((habit: Habit): number => {
    let streak = 0;
    let checkDate = new Date();
    
    while (true) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      if (habit.completedDays[dateStr]) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        // If today isn't completed yet, check from yesterday
        if (isSameDay(checkDate, new Date())) {
          checkDate = subDays(checkDate, 1);
          continue;
        }
        break;
      }
    }
    return streak;
  }, []);

  // Calculate completion rate for last 30 days
  const calculateCompletionRate = useCallback((habit: Habit): number => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    let expectedDays = 0;
    let completedDays = 0;

    for (let i = 0; i < 30; i++) {
      const checkDate = subDays(new Date(), i);
      const dayOfWeek = checkDate.getDay();
      const dateStr = format(checkDate, 'yyyy-MM-dd');

      // Check if this day should count based on frequency
      let shouldCount = false;
      if (habit.frequency === 'daily') {
        shouldCount = true;
      } else if (habit.frequency === 'weekly') {
        // Weekly habits count all days (or use daysOfWeek)
        shouldCount = habit.daysOfWeek?.includes(dayOfWeek) ?? true;
      } else if (habit.frequency === 'specific_days') {
        shouldCount = habit.specificDays?.includes(dayOfWeek) ?? false;
      }

      if (shouldCount && isAfter(checkDate, habit.createdAt)) {
        expectedDays++;
        if (habit.completedDays[dateStr]) {
          completedDays++;
        }
      }
    }

    return expectedDays > 0 ? Math.round((completedDays / expectedDays) * 100) : 0;
  }, []);

  // Computed habits with stats
  const habitsWithStats = useMemo((): HabitWithStats[] => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const dayOfWeek = today.getDay();
    
    return habits
      .filter(h => h.isActive)
      .map(habit => {
        const dbStreak = streaks[habit.id];
        const calculatedStreak = calculateStreak(habit);

        // Calculate if habit is due today
        let isDueToday = true;
        if (habit.frequency === 'weekly') {
          // If weekly, check if today is one of the allowed days
          // Assuming daysOfWeek is [0-6] where 0 is Sunday
          // If daysOfWeek is present, respect it. If not (legacy/default), it might mean 'every day' or logic needs check.
          // The fetchHabits sets default to [0..6] so this logic needs care.
          // BUT, if frequency is weekly, it SHOULD have a constrained set.
          // If it's effectively "daily", it's daily.
          // We rely on 'specificDays' for 'specific_days' frequency.
          // For 'weekly', it is often used synonymously with specific days in some apps, 
          // but here we check habit.daysOfWeek which comes from days_of_week col.
          isDueToday = habit.daysOfWeek?.includes(dayOfWeek) ?? true;
        } else if (habit.frequency === 'specific_days') {
          isDueToday = habit.specificDays?.includes(dayOfWeek) ?? false;
        }
        
        return {
          ...habit,
          streak: dbStreak || {
            id: '',
            habitId: habit.id,
            userId: user?.id || '',
            currentStreak: calculatedStreak,
            longestStreak: calculatedStreak,
            lastCompletedAt: undefined,
            updatedAt: new Date(),
          },
          completedToday: !!habit.completedDays[todayStr],
          completionRate: calculateCompletionRate(habit),
          isDueToday,
        };
      });
  }, [habits, streaks, user, calculateStreak, calculateCompletionRate]);

  // Add new habit
  const addHabit = async (habitData: Partial<Habit>) => {
    if (!user) return null;

    // Check habit limit
    const activeHabits = habits.filter(h => h.isActive);
    if (activeHabits.length >= MAX_HABITS) {
      toast({
        title: 'Limite atingido',
        description: 'Foco é poder! 🎯 Mantenha no máximo 5 hábitos para não se sobrecarregar.',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('mf_habits')
        .insert({
          user_id: user.id,
          title: habitData.title || 'Novo Hábito',
          description: habitData.description || null,
          icon: habitData.icon || 'check',
          frequency: habitData.frequency || 'daily',
          specific_days: habitData.specificDays || null,
          color: habitData.color || '#8B5CF6',
          reminder_time: habitData.reminderTime || null,
          is_active: true,
          project_id: habitData.projectId || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newHabit: Habit = {
        id: data.id,
        title: data.title,
        description: data.description || undefined,
        icon: data.icon || 'check',
        frequency: data.frequency as Habit['frequency'],
        specificDays: data.specific_days || undefined,
        color: data.color,
        reminderTime: data.reminder_time || undefined,
        isActive: data.is_active,
        projectId: data.project_id || undefined,
        createdAt: new Date(data.created_at),
        completedDays: {},
      };

      setHabits(prev => [...prev, newHabit]);
      
      toast({
        title: 'Hábito criado! 🎉',
        description: `"${newHabit.title}" foi adicionado aos seus hábitos.`,
      });
      
      return newHabit;
    } catch (error: any) {
      console.error('Error adding habit:', error);
      toast({
        title: 'Erro ao criar hábito',
        description: error.message || 'Não foi possível criar o hábito.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Update existing habit
  const updateHabit = async (habitId: string, updates: Partial<Habit>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('mf_habits')
        .update({
          title: updates.title,
          description: updates.description,
          icon: updates.icon,
          frequency: updates.frequency,
          specific_days: updates.specificDays,
          color: updates.color,
          reminder_time: updates.reminderTime,
          is_active: updates.isActive,
          project_id: updates.projectId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', habitId)
        .eq('user_id', user.id);

      if (error) throw error;

      setHabits(prev => prev.map(h => 
        h.id === habitId ? { ...h, ...updates } : h
      ));

      toast({
        title: 'Hábito atualizado!',
        description: 'Suas alterações foram salvas.',
      });

      return true;
    } catch (error: any) {
      console.error('Error updating habit:', error);
      toast({
        title: 'Erro ao atualizar hábito',
        description: error.message || 'Não foi possível atualizar o hábito.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Toggle habit completion for a date
  const toggleHabit = async (habitId: string, date: Date) => {
    if (!user) return false;

    const habit = habits.find(h => h.id === habitId);
    if (!habit) return false;

    const dateStr = format(date, 'yyyy-MM-dd');
    const isCompleted = habit.completedDays[dateStr];

    try {
      if (isCompleted) {
        // Remove log
        const { error } = await supabase
          .from('mf_habit_logs')
          .delete()
          .eq('habit_id', habitId)
          .eq('log_date', dateStr)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Add log
        const { error } = await supabase
          .from('mf_habit_logs')
          .insert({
            user_id: user.id,
            habit_id: habitId,
            log_date: dateStr,
            completed: true
          });

        if (error) throw error;
      }

      // Update local state
      setHabits(prev => prev.map(h => {
        if (h.id === habitId) {
          const newCompletedDays = { ...h.completedDays };
          if (isCompleted) {
            delete newCompletedDays[dateStr];
          } else {
            newCompletedDays[dateStr] = true;
          }
          return { ...h, completedDays: newCompletedDays };
        }
        return h;
      }));

      // Refetch streaks after toggle
      const { data: streakData } = await supabase
        .from('mf_habit_streaks')
        .select('*')
        .eq('habit_id', habitId)
        .single();

      if (streakData) {
        setStreaks(prev => ({
          ...prev,
          [habitId]: {
            id: streakData.id,
            habitId: streakData.habit_id,
            userId: streakData.user_id,
            currentStreak: streakData.current_streak || 0,
            longestStreak: streakData.longest_streak || 0,
            lastCompletedAt: streakData.last_completed_at ? new Date(streakData.last_completed_at) : undefined,
            updatedAt: new Date(streakData.updated_at),
          }
        }));
      }

      return true;
    } catch (error) {
      console.error('Error toggling habit:', error);
      return false;
    }
  };

  // Soft delete habit
  const deleteHabit = async (habitId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('mf_habits')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', habitId)
        .eq('user_id', user.id);

      if (error) throw error;

      setHabits(prev => prev.filter(h => h.id !== habitId));
      
      toast({
        title: 'Hábito arquivado',
        description: 'O hábito foi movido para o arquivo. O histórico foi preservado.',
      });

      return true;
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast({
        title: 'Erro ao excluir hábito',
        description: 'Não foi possível excluir o hábito.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Archive habit with status and reason (preserves all data for insights)
  const archiveHabit = async (
    habitId: string, 
    status: HabitArchiveStatus, 
    reason?: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('mf_habits')
        .update({ 
          archived_at: new Date().toISOString(),
          archive_status: status,
          archive_reason: reason || null,
          is_active: false,
        })
        .eq('id', habitId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Move habit from active to archived list
      const habit = habits.find(h => h.id === habitId);
      if (habit) {
        const archivedHabit = {
          ...habit,
          archivedAt: new Date(),
          archiveStatus: status,
          archiveReason: reason,
          isActive: false,
        };
        setHabits(prev => prev.filter(h => h.id !== habitId));
        setArchivedHabits(prev => [...prev, archivedHabit]);
      }

      const statusMessages: Record<HabitArchiveStatus, { title: string; description: string }> = {
        completed: {
          title: 'Parabéns! 🎉',
          description: 'Objetivo alcançado! O hábito foi arquivado com sucesso.',
        },
        paused: {
          title: 'Hábito pausado',
          description: 'O hábito foi pausado. Você pode reativar quando quiser.',
        },
        cancelled: {
          title: 'Hábito encerrado',
          description: 'O hábito foi encerrado. O histórico permanece disponível.',
        },
      };

      toast(statusMessages[status]);
      return true;
    } catch (error) {
      console.error('Error archiving habit:', error);
      toast({
        title: 'Erro ao arquivar hábito',
        description: 'Não foi possível arquivar o hábito.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Restore an archived habit
  const restoreHabit = async (habitId: string): Promise<boolean> => {
    if (!user) return false;

    // Check habit limit
    const activeHabits = habits.filter(h => h.isActive);
    if (activeHabits.length >= MAX_HABITS) {
      toast({
        title: 'Limite atingido',
        description: 'Remova um hábito ativo antes de restaurar este.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('mf_habits')
        .update({ 
          archived_at: null,
          archive_status: null,
          archive_reason: null,
          is_active: true,
        })
        .eq('id', habitId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Move habit from archived to active list
      const habit = archivedHabits.find(h => h.id === habitId);
      if (habit) {
        const restoredHabit = {
          ...habit,
          archivedAt: undefined,
          archiveStatus: undefined,
          archiveReason: undefined,
          isActive: true,
        };
        setArchivedHabits(prev => prev.filter(h => h.id !== habitId));
        setHabits(prev => [...prev, restoredHabit]);
      }

      toast({
        title: 'Hábito restaurado! 🔄',
        description: 'O hábito está ativo novamente.',
      });

      return true;
    } catch (error) {
      console.error('Error restoring habit:', error);
      toast({
        title: 'Erro ao restaurar hábito',
        description: 'Não foi possível restaurar o hábito.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Get archived habit stats for insights
  const getArchivedHabitStats = useCallback((habit: Habit) => {
    const completedDates = Object.keys(habit.completedDays).sort();
    const totalCompleted = completedDates.length;
    
    if (totalCompleted === 0) {
      return {
        totalDays: 0,
        totalCompleted: 0,
        completionRate: 0,
        longestStreak: 0,
        startDate: habit.createdAt,
        endDate: habit.archivedAt || new Date(),
        activeDays: 0,
      };
    }

    const startDate = habit.createdAt;
    const endDate = habit.archivedAt || new Date();
    const activeDays = differenceInDays(endDate, startDate);

    // Calculate longest streak from completed days
    let longestStreak = 0;
    let currentStreak = 0;
    let lastDate: Date | null = null;

    completedDates.forEach(dateStr => {
      const currentDate = new Date(dateStr);
      if (lastDate && differenceInDays(currentDate, lastDate) === 1) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
      longestStreak = Math.max(longestStreak, currentStreak);
      lastDate = currentDate;
    });

    const completionRate = activeDays > 0 ? Math.round((totalCompleted / activeDays) * 100) : 0;

    return {
      totalDays: activeDays,
      totalCompleted,
      completionRate: Math.min(completionRate, 100),
      longestStreak,
      startDate,
      endDate,
      activeDays,
    };
  }, []);

  // Get aggregated stats
  const getHabitStats = useCallback(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const activeHabits = habitsWithStats;
    
    if (activeHabits.length === 0) {
      return {
        totalHabits: 0,
        completedToday: 0,
        averageCompletionRate: 0,
        longestCurrentStreak: 0,
        longestOverallStreak: 0,
        perfectDays: 0,
        mostConsistentHabit: null as HabitWithStats | null,
      };
    }

    const completedToday = activeHabits.filter(h => h.completedToday).length;
    const averageCompletionRate = Math.round(
      activeHabits.reduce((sum, h) => sum + h.completionRate, 0) / activeHabits.length
    );
    
    const longestCurrentStreak = Math.max(...activeHabits.map(h => h.streak.currentStreak));
    const longestOverallStreak = Math.max(...activeHabits.map(h => h.streak.longestStreak));
    
    const sortedByRate = [...activeHabits].sort((a, b) => b.completionRate - a.completionRate);
    const mostConsistentHabit = sortedByRate[0] || null;

    // Count perfect days (all habits completed) in last 30 days
    let perfectDays = 0;
    for (let i = 0; i < 30; i++) {
      const checkDate = subDays(new Date(), i);
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      const allCompleted = activeHabits.every(h => h.completedDays[dateStr]);
      if (allCompleted && activeHabits.length > 0) {
        perfectDays++;
      }
    }

    return {
      totalHabits: activeHabits.length,
      completedToday,
      averageCompletionRate,
      longestCurrentStreak,
      longestOverallStreak,
      perfectDays,
      mostConsistentHabit,
    };
  }, [habitsWithStats]);

  // Check if can add more habits
  const canAddHabit = habits.filter(h => h.isActive).length < MAX_HABITS;
  const remainingHabits = MAX_HABITS - habits.filter(h => h.isActive).length;

  return {
    habits,
    archivedHabits,
    habitsWithStats,
    streaks,
    loading,
    addHabit,
    updateHabit,
    toggleHabit,
    deleteHabit,
    archiveHabit,
    restoreHabit,
    refetch: fetchHabits,
    getHabitStats,
    getArchivedHabitStats,
    canAddHabit,
    remainingHabits,
    MAX_HABITS,
  };
};

