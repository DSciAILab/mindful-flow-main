import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type {
  ReminderType,
  WellnessConfig,
  WellnessReminder,
  WellnessLog,
} from '@/types/wellness';
import {
  REMINDER_MESSAGES,
  DEFAULT_WELLNESS_CONFIG,
} from '@/types/wellness';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

interface UseWellnessRemindersOptions {
  isFocusRunning?: boolean;
}

export const useWellnessReminders = (options: UseWellnessRemindersOptions = {}) => {
  const { isFocusRunning = false } = options;
  const [config, setConfig] = useState<WellnessConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayLogs, setTodayLogs] = useState<WellnessLog[]>([]);
  const [activeReminder, setActiveReminder] = useState<WellnessReminder | null>(null);
  const [lastReminderTimes, setLastReminderTimes] = useState<Record<ReminderType, Date>>({} as Record<ReminderType, Date>);
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Refs for timers
  const reminderTimersRef = useRef<Record<ReminderType, NodeJS.Timeout | null>>({
    water: null,
    stretch: null,
    eyes: null,
    posture: null,
    breathe: null,
    walk: null,
  });
  
  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Map DB data to TypeScript type
  const mapConfig = useCallback((data: any): WellnessConfig => ({
    id: data.id,
    userId: data.user_id,
    waterEnabled: data.water_enabled,
    waterIntervalMinutes: data.water_interval_minutes,
    stretchEnabled: data.stretch_enabled,
    stretchIntervalMinutes: data.stretch_interval_minutes,
    eyesEnabled: data.eyes_enabled,
    eyesIntervalMinutes: data.eyes_interval_minutes,
    postureEnabled: data.posture_enabled,
    postureIntervalMinutes: data.posture_interval_minutes,
    quietHoursStart: data.quiet_hours_start,
    quietHoursEnd: data.quiet_hours_end,
    showDuringFocus: data.show_during_focus,
    createdAt: data.created_at ? new Date(data.created_at) : undefined,
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
  }), []);

  const mapLog = useCallback((data: any): WellnessLog => ({
    id: data.id,
    userId: data.user_id,
    reminderType: data.reminder_type as ReminderType,
    action: data.action as 'completed' | 'snoozed' | 'dismissed',
    loggedAt: new Date(data.logged_at),
  }), []);

  // Check if current time is within quiet hours
  const isQuietHours = useCallback((): boolean => {
    if (!config) return false;
    
    const now = new Date();
    const currentTime = format(now, 'HH:mm');
    const start = config.quietHoursStart;
    const end = config.quietHoursEnd;
    
    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (start > end) {
      return currentTime >= start || currentTime < end;
    }
    
    return currentTime >= start && currentTime < end;
  }, [config]);

  // Fetch user config
  const fetchConfig = useCallback(async () => {
    if (!user) {
      setConfig(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('mf_wellness_config')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No config exists, create default
          const { data: newData, error: insertError } = await supabase
            .from('mf_wellness_config')
            .insert({
              user_id: user.id,
              water_enabled: DEFAULT_WELLNESS_CONFIG.waterEnabled,
              water_interval_minutes: DEFAULT_WELLNESS_CONFIG.waterIntervalMinutes,
              stretch_enabled: DEFAULT_WELLNESS_CONFIG.stretchEnabled,
              stretch_interval_minutes: DEFAULT_WELLNESS_CONFIG.stretchIntervalMinutes,
              eyes_enabled: DEFAULT_WELLNESS_CONFIG.eyesEnabled,
              eyes_interval_minutes: DEFAULT_WELLNESS_CONFIG.eyesIntervalMinutes,
              posture_enabled: DEFAULT_WELLNESS_CONFIG.postureEnabled,
              posture_interval_minutes: DEFAULT_WELLNESS_CONFIG.postureIntervalMinutes,
              quiet_hours_start: DEFAULT_WELLNESS_CONFIG.quietHoursStart,
              quiet_hours_end: DEFAULT_WELLNESS_CONFIG.quietHoursEnd,
              show_during_focus: DEFAULT_WELLNESS_CONFIG.showDuringFocus,
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
      console.error('Error fetching wellness config:', error);
    } finally {
      setLoading(false);
    }
  }, [user, mapConfig]);

  // Fetch today's logs
  const fetchTodayLogs = useCallback(async () => {
    if (!user) {
      setTodayLogs([]);
      return;
    }

    try {
      const today = new Date();
      const startOfToday = startOfDay(today).toISOString();
      const endOfToday = endOfDay(today).toISOString();

      const { data, error } = await supabase
        .from('mf_wellness_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', startOfToday)
        .lte('logged_at', endOfToday)
        .order('logged_at', { ascending: false });

      if (error) throw error;
      setTodayLogs((data || []).map(mapLog));
    } catch (error) {
      console.error('Error fetching wellness logs:', error);
    }
  }, [user, mapLog]);

  // Initial fetch
  useEffect(() => {
    fetchConfig();
    fetchTodayLogs();
  }, [fetchConfig, fetchTodayLogs]);

  // Update config
  const updateConfig = useCallback(async (updates: Partial<WellnessConfig>): Promise<boolean> => {
    if (!user || !config) return false;

    try {
      const dbUpdates: Record<string, unknown> = {};
      
      if (updates.waterEnabled !== undefined) dbUpdates.water_enabled = updates.waterEnabled;
      if (updates.waterIntervalMinutes !== undefined) dbUpdates.water_interval_minutes = updates.waterIntervalMinutes;
      if (updates.stretchEnabled !== undefined) dbUpdates.stretch_enabled = updates.stretchEnabled;
      if (updates.stretchIntervalMinutes !== undefined) dbUpdates.stretch_interval_minutes = updates.stretchIntervalMinutes;
      if (updates.eyesEnabled !== undefined) dbUpdates.eyes_enabled = updates.eyesEnabled;
      if (updates.eyesIntervalMinutes !== undefined) dbUpdates.eyes_interval_minutes = updates.eyesIntervalMinutes;
      if (updates.postureEnabled !== undefined) dbUpdates.posture_enabled = updates.postureEnabled;
      if (updates.postureIntervalMinutes !== undefined) dbUpdates.posture_interval_minutes = updates.postureIntervalMinutes;
      if (updates.quietHoursStart !== undefined) dbUpdates.quiet_hours_start = updates.quietHoursStart;
      if (updates.quietHoursEnd !== undefined) dbUpdates.quiet_hours_end = updates.quietHoursEnd;
      if (updates.showDuringFocus !== undefined) dbUpdates.show_during_focus = updates.showDuringFocus;

      const { error } = await supabase
        .from('mf_wellness_config')
        .update(dbUpdates)
        .eq('id', config.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setConfig((prev) => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
      
      toast({
        title: 'Configurações salvas',
        description: 'Suas preferências de bem-estar foram atualizadas.',
      });

      return true;
    } catch (error) {
      console.error('Error updating wellness config:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, config, toast]);

  // Log a wellness action
  const logAction = useCallback(async (
    reminderType: ReminderType,
    action: 'completed' | 'snoozed' | 'dismissed'
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('mf_wellness_logs')
        .insert({
          user_id: user.id,
          reminder_type: reminderType,
          action: action,
        })
        .select()
        .single();

      if (error) throw error;

      const newLog = mapLog(data);
      setTodayLogs((prev) => [newLog, ...prev]);
      
      // Update last reminder time
      setLastReminderTimes((prev) => ({
        ...prev,
        [reminderType]: new Date(),
      }));

      return true;
    } catch (error) {
      console.error('Error logging wellness action:', error);
      return false;
    }
  }, [user, mapLog]);

  // Show a reminder
  const showReminder = useCallback((type: ReminderType) => {
    // Skip if in quiet hours
    if (isQuietHours()) return;
    
    // Skip if in focus mode and config says not to show
    if (isFocusRunning && !config?.showDuringFocus) return;
    
    // Skip if there's already an active reminder
    if (activeReminder) return;
    
    const reminder = REMINDER_MESSAGES[type];
    setActiveReminder(reminder);
    
    // Auto-dismiss after 30 seconds
    autoDismissTimerRef.current = setTimeout(() => {
      handleDismiss();
    }, 30000);
  }, [isQuietHours, isFocusRunning, config, activeReminder]);

  // Handle reminder completion
  const handleComplete = useCallback(async () => {
    if (!activeReminder) return;
    
    await logAction(activeReminder.type, 'completed');
    
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
    }
    
    setActiveReminder(null);
    
    toast({
      title: 'Ótimo trabalho! ✨',
      description: `${activeReminder.title} concluído.`,
    });
  }, [activeReminder, logAction, toast]);

  // Handle reminder snooze
  const handleSnooze = useCallback(async (minutes: number = 10) => {
    if (!activeReminder) return;
    
    await logAction(activeReminder.type, 'snoozed');
    
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
    }
    
    const type = activeReminder.type;
    setActiveReminder(null);
    
    // Schedule reminder again after snooze period
    setTimeout(() => {
      showReminder(type);
    }, minutes * 60 * 1000);
  }, [activeReminder, logAction, showReminder]);

  // Handle reminder dismiss
  const handleDismiss = useCallback(async () => {
    if (!activeReminder) return;
    
    await logAction(activeReminder.type, 'dismissed');
    
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
    }
    
    setActiveReminder(null);
  }, [activeReminder, logAction]);

  // Quick log action (for quick actions widget)
  const quickLogAction = useCallback(async (type: ReminderType): Promise<boolean> => {
    const success = await logAction(type, 'completed');
    if (success) {
      toast({
        title: `${REMINDER_MESSAGES[type].title} registrado!`,
        description: 'Continue assim! 💪',
      });
    }
    return success;
  }, [logAction, toast]);

  // Get count of completed actions by type for today
  const getTodayCount = useCallback((type: ReminderType): number => {
    return todayLogs.filter(
      (log) => log.reminderType === type && log.action === 'completed'
    ).length;
  }, [todayLogs]);

  // Get last action time for a type
  const getLastActionTime = useCallback((type: ReminderType): Date | null => {
    const lastLog = todayLogs.find(
      (log) => log.reminderType === type && log.action === 'completed'
    );
    return lastLog ? lastLog.loggedAt : null;
  }, [todayLogs]);

  // Setup reminder timers
  useEffect(() => {
    if (!config || loading) return;

    const setupTimer = (type: ReminderType, enabled: boolean, intervalMinutes: number) => {
      // Clear existing timer
      if (reminderTimersRef.current[type]) {
        clearInterval(reminderTimersRef.current[type]!);
        reminderTimersRef.current[type] = null;
      }

      if (enabled) {
        // Start timer
        reminderTimersRef.current[type] = setInterval(() => {
          showReminder(type);
        }, intervalMinutes * 60 * 1000);
      }
    };

    setupTimer('water', config.waterEnabled, config.waterIntervalMinutes);
    setupTimer('stretch', config.stretchEnabled, config.stretchIntervalMinutes);
    setupTimer('eyes', config.eyesEnabled, config.eyesIntervalMinutes);
    setupTimer('posture', config.postureEnabled, config.postureIntervalMinutes);

    // Cleanup on unmount
    return () => {
      Object.values(reminderTimersRef.current).forEach((timer) => {
        if (timer) clearInterval(timer);
      });
    };
  }, [config, loading, showReminder]);

  // Calculate next reminder time
  const getNextReminder = useMemo(() => {
    if (!config) return null;

    const reminderConfigs = [
      { type: 'water' as ReminderType, enabled: config.waterEnabled, interval: config.waterIntervalMinutes },
      { type: 'stretch' as ReminderType, enabled: config.stretchEnabled, interval: config.stretchIntervalMinutes },
      { type: 'eyes' as ReminderType, enabled: config.eyesEnabled, interval: config.eyesIntervalMinutes },
      { type: 'posture' as ReminderType, enabled: config.postureEnabled, interval: config.postureIntervalMinutes },
    ];

    const enabledReminders = reminderConfigs.filter((r) => r.enabled);
    if (enabledReminders.length === 0) return null;

    // Find the earliest next reminder
    let earliestNext: { type: ReminderType; time: Date } | null = null;
    const now = new Date();

    for (const reminder of enabledReminders) {
      const lastTime = lastReminderTimes[reminder.type] || now;
      const nextTime = new Date(lastTime.getTime() + reminder.interval * 60 * 1000);

      if (!earliestNext || nextTime < earliestNext.time) {
        earliestNext = { type: reminder.type, time: nextTime };
      }
    }

    return earliestNext;
  }, [config, lastReminderTimes]);

  // Get logs for last 7 days (for dashboard)
  const getWeekLogs = useCallback(async (): Promise<WellnessLog[]> => {
    if (!user) return [];

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('mf_wellness_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', sevenDaysAgo.toISOString())
        .order('logged_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapLog);
    } catch (error) {
      console.error('Error fetching week logs:', error);
      return [];
    }
  }, [user, mapLog]);

  return {
    config,
    loading,
    todayLogs,
    activeReminder,
    isQuietHours: isQuietHours(),
    nextReminder: getNextReminder,
    updateConfig,
    handleComplete,
    handleSnooze,
    handleDismiss,
    quickLogAction,
    getTodayCount,
    getLastActionTime,
    getWeekLogs,
    refetchConfig: fetchConfig,
    refetchLogs: fetchTodayLogs,
  };
};
