import { supabase } from "@/integrations/supabase/client";

export const getProfile = async (userId: string): Promise<{ first_name: string | null; last_name: string | null; avatar_url: string | null; quote_duration_seconds: number | null; pomodoro_duration: number | null; short_break_duration: number | null; long_break_duration: number | null; enable_sound_notifications: boolean | null; xp_points: number | null; } | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('first_name, last_name, avatar_url, quote_duration_seconds, pomodoro_duration, short_break_duration, long_break_duration, enable_sound_notifications, xp_points')
    .eq('id', userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
  return data;
};

export const updateProfile = async (userId: string, updates: Partial<{ first_name: string; last_name: string; avatar_url: string | null; quote_duration_seconds: number; pomodoro_duration: number; short_break_duration: number; long_break_duration: number; enable_sound_notifications: boolean; xp_points: number; }>): Promise<boolean> => {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) {
    console.error("Error updating profile:", error);
    return false;
  }
  return true;
};

export const signOut = async (): Promise<boolean> => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error signing out:", error);
    return false;
  }
  return true;
};

export const getStats = async (userId: string): Promise<{ completedTasks: number; totalHabits: number }> => {
  const { count: completedTasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'completed');

  const { count: totalHabits, error: habitsError } = await supabase
    .from('habits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (tasksError || habitsError) {
    console.error("Error fetching stats:", tasksError || habitsError);
    return { completedTasks: 0, totalHabits: 0 };
  }

  return {
    completedTasks: completedTasks || 0,
    totalHabits: totalHabits || 0,
  };
};