"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabaseDb } from '@/lib/supabase/index';
import { useSession } from '@/integrations/supabase/auth';

interface TimerDurations {
  pomodoro: number;
  shortBreak: number;
  longBreak: number;
}

interface TimerSettings {
  durations: TimerDurations;
  soundEnabled: boolean;
  refreshSettings: () => Promise<void>;
}

export const useTimerSettings = (): TimerSettings => {
  const { user } = useSession();
  const [durations, setDurations] = useState<TimerDurations>({
    pomodoro: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  });
  const [soundEnabled, setSoundEnabled] = useState(true);

  const fetchSettings = useCallback(async () => {
    console.log("useTimerSettings: fetchSettings called.");
    if (user?.id) {
      const profile = await supabaseDb.getProfile(user.id);
      const newDurations = {
        pomodoro: (profile?.pomodoro_duration || 25) * 60,
        shortBreak: (profile?.short_break_duration || 5) * 60,
        longBreak: (profile?.long_break_duration || 15) * 60,
      };
      setDurations(newDurations);
      setSoundEnabled(profile?.enable_sound_notifications ?? true);
      console.log("useTimerSettings: Settings fetched:", { newDurations, soundEnabled: profile?.enable_sound_notifications });
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { durations, soundEnabled, refreshSettings: fetchSettings };
};