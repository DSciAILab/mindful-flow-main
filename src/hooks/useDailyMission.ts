import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useTasks } from './useTasks';
import { useHabits } from './useHabits';
import type { Task, HabitWithStats } from '@/types';
import type { 
  DailyMissionConfig, 
  MorningCheckin, 
  DailyMission,
  EnergyLevel 
} from '@/types/dailyMission';
import { 
  getMotivationalByEnergy, 
  getSuggestedFocusTime 
} from '@/types/dailyMission';
import { format } from 'date-fns';

// Default config for new users
const DEFAULT_CONFIG: Omit<DailyMissionConfig, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  maxTasks: 3,
  showOnStartup: true,
  includeHabits: true,
  morningCheckinEnabled: true,
};

export const useDailyMission = () => {
  const [config, setConfig] = useState<DailyMissionConfig | null>(null);
  const [todayCheckin, setTodayCheckin] = useState<MorningCheckin | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkinLoading, setCheckinLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { tasks, big3Tasks } = useTasks();
  const { habits } = useHabits();

  // Get today's date string
  const getTodayString = () => format(new Date(), 'yyyy-MM-dd');

  // Map DB config to TypeScript type
  const mapConfig = (data: any): DailyMissionConfig => ({
    id: data.id,
    userId: data.user_id,
    maxTasks: data.max_tasks,
    showOnStartup: data.show_on_startup,
    includeHabits: data.include_habits,
    morningCheckinEnabled: data.morning_checkin_enabled,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  });

  // Map DB checkin to TypeScript type
  const mapCheckin = (data: any): MorningCheckin => ({
    id: data.id,
    userId: data.user_id,
    checkinDate: new Date(data.checkin_date),
    energyLevel: data.energy_level as EnergyLevel,
    moodLevel: data.mood_level as EnergyLevel,
    sleepQuality: data.sleep_quality as EnergyLevel,
    notes: data.notes || undefined,
    createdAt: new Date(data.created_at),
  });

  // Fetch user config
  const fetchConfig = useCallback(async () => {
    if (!user) {
      setConfig(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('mf_daily_mission_config')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No config exists, create default
          const { data: newData, error: insertError } = await supabase
            .from('mf_daily_mission_config')
            .insert({
              user_id: user.id,
              max_tasks: DEFAULT_CONFIG.maxTasks,
              show_on_startup: DEFAULT_CONFIG.showOnStartup,
              include_habits: DEFAULT_CONFIG.includeHabits,
              morning_checkin_enabled: DEFAULT_CONFIG.morningCheckinEnabled,
            })
            .select()
            .single();

          if (insertError) throw insertError;
          setConfig(mapConfig(newData));
        } else {
          throw error;
        }
      } else {
        setConfig(mapConfig(data));
      }
    } catch (error) {
      console.error('Error fetching daily mission config:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch today's checkin
  const fetchTodayCheckin = useCallback(async () => {
    if (!user) {
      setTodayCheckin(null);
      setCheckinLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('mf_morning_checkins')
        .select('*')
        .eq('user_id', user.id)
        .eq('checkin_date', getTodayString())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No checkin today
          setTodayCheckin(null);
        } else {
          throw error;
        }
      } else {
        setTodayCheckin(mapCheckin(data));
      }
    } catch (error) {
      console.error('Error fetching today checkin:', error);
    } finally {
      setCheckinLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchConfig();
    fetchTodayCheckin();
  }, [fetchConfig, fetchTodayCheckin]);

  // Update config
  const updateConfig = useCallback(async (updates: Partial<DailyMissionConfig>): Promise<boolean> => {
    if (!user || !config) return false;

    try {
      const dbUpdates: Record<string, unknown> = {};
      
      if (updates.maxTasks !== undefined) dbUpdates.max_tasks = updates.maxTasks;
      if (updates.showOnStartup !== undefined) dbUpdates.show_on_startup = updates.showOnStartup;
      if (updates.includeHabits !== undefined) dbUpdates.include_habits = updates.includeHabits;
      if (updates.morningCheckinEnabled !== undefined) dbUpdates.morning_checkin_enabled = updates.morningCheckinEnabled;

      const { error } = await supabase
        .from('mf_daily_mission_config')
        .update(dbUpdates)
        .eq('id', config.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setConfig((prev) => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
      
      toast({
        title: 'Configurações salvas',
        description: 'Suas preferências de missão diária foram atualizadas.',
      });

      return true;
    } catch (error) {
      console.error('Error updating config:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, config, toast]);

  // Save morning checkin
  const saveMorningCheckin = useCallback(async (
    energyLevel: EnergyLevel,
    moodLevel: EnergyLevel,
    sleepQuality: EnergyLevel,
    notes?: string
  ): Promise<MorningCheckin | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('mf_morning_checkins')
        .upsert({
          user_id: user.id,
          checkin_date: getTodayString(),
          energy_level: energyLevel,
          mood_level: moodLevel,
          sleep_quality: sleepQuality,
          notes: notes || null,
        }, {
          onConflict: 'user_id,checkin_date',
        })
        .select()
        .single();

      if (error) throw error;

      const checkin = mapCheckin(data);
      setTodayCheckin(checkin);

      toast({
        title: 'Check-in salvo! ✨',
        description: 'Bom dia! Sua missão do dia foi preparada.',
      });

      return checkin;
    } catch (error) {
      console.error('Error saving checkin:', error);
      toast({
        title: 'Erro ao salvar check-in',
        description: 'Não foi possível salvar o check-in.',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, toast]);

  // Calculate suggested tasks based on energy level
  const calculateSuggestedTasks = useCallback((
    allTasks: Task[],
    maxTasks: number,
    energyLevel?: EnergyLevel
  ): Task[] => {
    // Filter active tasks (not completed)
    const activeTasks = allTasks.filter((t) => !t.completedAt);

    // Sort by priority logic
    const priorityOrder: Record<string, number> = {
      urgent: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    // Get today's date for due date comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort tasks by:
    // 1. Due today (highest priority)
    // 2. Big 3 tasks
    // 3. Priority level
    // 4. If low energy, prefer shorter estimated time
    const sortedTasks = [...activeTasks].sort((a, b) => {
      // Due today tasks first
      const aIsDueToday = a.dueDate && new Date(a.dueDate).setHours(0, 0, 0, 0) === today.getTime();
      const bIsDueToday = b.dueDate && new Date(b.dueDate).setHours(0, 0, 0, 0) === today.getTime();
      
      if (aIsDueToday && !bIsDueToday) return -1;
      if (!aIsDueToday && bIsDueToday) return 1;

      // Big 3 tasks second
      if (a.isBig3 && !b.isBig3) return -1;
      if (!a.isBig3 && b.isBig3) return 1;

      // Then by priority
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // If low energy, prefer shorter tasks
      if (energyLevel && energyLevel <= 2) {
        const aTime = a.estimatedMinutes || 30;
        const bTime = b.estimatedMinutes || 30;
        return aTime - bTime;
      }

      // If high energy, prefer longer/complex tasks
      if (energyLevel && energyLevel >= 4) {
        const aTime = a.estimatedMinutes || 30;
        const bTime = b.estimatedMinutes || 30;
        return bTime - aTime;
      }

      return 0;
    });

    return sortedTasks.slice(0, maxTasks);
  }, []);

  // Get today's habits that need to be completed
  const getTodayHabits = useCallback((allHabits: HabitWithStats[]): HabitWithStats[] => {
    const today = new Date().getDay(); // 0 = Sunday

    return allHabits.filter((habit) => {
      if (!habit.isActive) return false;

      if (habit.frequency === 'daily') return true;

      if (habit.frequency === 'specific_days' && habit.specificDays) {
        return habit.specificDays.includes(today);
      }

      // Weekly habits - show on any day
      if (habit.frequency === 'weekly') return true;

      return false;
    });
  }, []);

  // Compute daily mission
  const dailyMission = useMemo((): DailyMission => {
    const maxTasks = config?.maxTasks || 3;
    const energyLevel = todayCheckin?.energyLevel;
    
    // Get suggested tasks
    const missionTasks = calculateSuggestedTasks(tasks, maxTasks, energyLevel);

    // Get today's habits if enabled
    const missionHabits = config?.includeHabits 
      ? getTodayHabits(habits as HabitWithStats[])
      : [];

    // Get motivational message
    const message = energyLevel 
      ? getMotivationalByEnergy(energyLevel)
      : "Vamos começar o dia! Complete o check-in para uma missão personalizada.";

    // Get suggested focus time
    const focusTime = energyLevel 
      ? getSuggestedFocusTime(energyLevel)
      : 25;

    return {
      tasks: missionTasks,
      habits: missionHabits,
      checkin: todayCheckin || undefined,
      suggestedFocusTime: focusTime,
      motivationalMessage: message,
    };
  }, [config, todayCheckin, tasks, habits, calculateSuggestedTasks, getTodayHabits]);

  // Check if should show checkin modal
  const shouldShowCheckinModal = useMemo(() => {
    if (!config) return false;
    if (!config.morningCheckinEnabled) return false;
    if (checkinLoading) return false;
    return !todayCheckin;
  }, [config, todayCheckin, checkinLoading]);

  return {
    config,
    todayCheckin,
    dailyMission,
    loading,
    checkinLoading,
    shouldShowCheckinModal,
    updateConfig,
    saveMorningCheckin,
    refetchConfig: fetchConfig,
    refetchCheckin: fetchTodayCheckin,
  };
};
