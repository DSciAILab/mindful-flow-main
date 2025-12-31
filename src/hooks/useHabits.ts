import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { Habit } from '@/types';
import { format } from 'date-fns';

export const useHabits = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchHabits = useCallback(async () => {
    if (!user) {
      setHabits([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (habitsError) throw habitsError;

      // Fetch logs for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: logsData, error: logsError } = await supabase
        .from('habit_logs')
        .select('habit_id, log_date, completed')
        .eq('user_id', user.id)
        .gte('log_date', format(thirtyDaysAgo, 'yyyy-MM-dd'));

      if (logsError) throw logsError;

      const mappedHabits: Habit[] = (habitsData || []).map((habit) => {
        const habitLogs = (logsData || []).filter(log => log.habit_id === habit.id);
        const completedDays: Record<string, boolean> = {};
        habitLogs.forEach(log => {
          completedDays[log.log_date] = log.completed;
        });

        return {
          id: habit.id,
          title: habit.title,
          description: habit.description || undefined,
          frequency: habit.frequency as Habit['frequency'],
          daysOfWeek: habit.days_of_week || [0, 1, 2, 3, 4, 5, 6],
          color: habit.color || '#3b82f6',
          createdAt: new Date(habit.created_at),
          completedDays,
        };
      });

      setHabits(mappedHabits);
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

  const addHabit = async (habitData: Partial<Habit>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          title: habitData.title || 'Novo Hábito',
          description: habitData.description || null,
          frequency: habitData.frequency || 'daily',
          color: habitData.color || '#3b82f6',
        })
        .select()
        .single();

      if (error) throw error;

      const newHabit: Habit = {
        id: data.id,
        title: data.title,
        description: data.description || undefined,
        frequency: data.frequency as Habit['frequency'],
        color: data.color,
        createdAt: new Date(data.created_at),
        completedDays: {},
      };

      setHabits(prev => [...prev, newHabit]);
      return newHabit;
    } catch (error) {
      console.error('Error adding habit:', error);
      toast({
        title: 'Erro ao criar hábito',
        description: error.message || 'Não foi possível criar o hábito.',
        variant: 'destructive',
      });
      return null;
    }
  };

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
          .from('habit_logs')
          .delete()
          .eq('habit_id', habitId)
          .eq('log_date', dateStr)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Add log
        const { error } = await supabase
          .from('habit_logs')
          .insert({
            user_id: user.id,
            habit_id: habitId,
            log_date: dateStr,
            completed: true
          });

        if (error) throw error;
      }

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

      return true;
    } catch (error) {
      console.error('Error toggling habit:', error);
      return false;
    }
  };

  return {
    habits,
    loading,
    addHabit,
    toggleHabit,
    refetch: fetchHabits,
  };
};
