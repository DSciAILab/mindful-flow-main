import { supabase, APP_ID } from "@/integrations/supabase/client";
import { subDays } from 'date-fns';

export const addMoodLog = async (userId: string, mood: string, notes: string): Promise<boolean> => {
  const { error } = await supabase.from('mood_logs').insert({
    user_id: userId,
    app_id: APP_ID, // Adiciona o app_id
    mood,
    notes: notes || null,
  });
  if (error) {
    console.error("Error adding mood log:", error);
    return false;
  }
  return true;
};

export const getMoodLogsLastWeek = async (userId: string): Promise<{ mood: string; count: number }[]> => {
  const sevenDaysAgo = subDays(new Date(), 7).toISOString();
  const { data, error } = await supabase
    .from('mood_logs')
    .select('mood')
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo);

  if (error) {
    console.error("Error fetching mood logs:", error);
    return [];
  }

  const moodCounts = data.reduce((acc, { mood }) => {
    acc[mood] = (acc[mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(moodCounts).map(([mood, count]) => ({ mood, count }));
};

export const getTodaysMoodLog = async (userId: string): Promise<{ mood: string; notes: string | null; created_at: string } | null> => {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  const { data, error } = await supabase
    .from('mood_logs')
    .select('mood, notes, created_at')
    .eq('user_id', userId)
    .gte('created_at', startOfToday)
    .lt('created_at', endOfToday)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // Ignore "0 rows" error
    console.error("Error fetching today's mood log:", error);
    return null;
  }
  return data;
};

export const getTodaysMoodLogs = async (userId: string): Promise<{ mood: string; created_at: string }[]> => {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  const { data, error } = await supabase
    .from('mood_logs')
    .select('mood, created_at')
    .eq('user_id', userId)
    .gte('created_at', startOfToday)
    .lt('created_at', endOfToday)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching today's mood logs:", error);
    return [];
  }
  return data;
};