import { supabase, APP_ID } from "@/integrations/supabase/client";

export const addTimeLog = async (userId: string, taskId: string, durationSeconds: number): Promise<boolean> => {
  const { error } = await supabase.from('time_logs').insert({
    user_id: userId,
    app_id: APP_ID, // Adiciona o app_id
    task_id: taskId,
    duration_seconds: durationSeconds,
  });
  if (error) {
    console.error("Error adding time log:", error);
    return false;
  }
  return true;
};

export const getTimeLogsForTask = async (userId: string, taskId: string): Promise<{ duration_seconds: number; logged_at: string }[]> => {
  const { data, error } = await supabase
    .from('time_logs')
    .select('duration_seconds, logged_at')
    .eq('user_id', userId)
    .eq('task_id', taskId)
    .order('logged_at', { ascending: false });

  if (error) {
    console.error("Error fetching time logs for task:", error);
    return [];
  }
  return data;
};

export const getTimeLogsForTasks = async (userId: string, taskIds: string[]): Promise<{ task_id: string; duration_seconds: number }[]> => {
  if (taskIds.length === 0) return [];
  const { data, error } = await supabase
    .from('time_logs')
    .select('task_id, duration_seconds')
    .eq('user_id', userId)
    .in('task_id', taskIds);

  if (error) {
    console.error("Error fetching time logs for tasks:", error);
    return [];
  }
  return data;
};

export const addInterruptionLog = async (userId: string, taskId: string, durationSeconds: number): Promise<boolean> => {
  const { error } = await supabase.from('task_interruptions').insert({
    user_id: userId,
    app_id: APP_ID, // Adiciona o app_id
    task_id: taskId,
    duration_seconds: durationSeconds,
  });
  if (error) {
    console.error("Error adding interruption log:", error);
    return false;
  }
  return true;
};

export const getInterruptionLogsForTask = async (userId: string, taskId: string): Promise<{ interrupted_at: string }[]> => {
  const { data, error } = await supabase
    .from('task_interruptions')
    .select('id, interrupted_at')
    .eq('user_id', userId)
    .eq('task_id', taskId);

  if (error) {
    console.error("Error fetching interruption logs:", error);
    return [];
  }
  return data;
};

export const getInterruptionLogsForTasks = async (userId: string, taskIds: string[]): Promise<{ task_id: string }[]> => {
  if (taskIds.length === 0) return [];
  const { data, error } = await supabase
    .from('task_interruptions')
    .select('task_id')
    .eq('user_id', userId)
    .in('task_id', taskIds);

  if (error) {
    console.error("Error fetching interruption logs for tasks:", error);
    return [];
  }
  return data;
};

// NEW: Função para adicionar um log de pausa
export const addBreakLog = async (userId: string, taskId: string, durationSeconds: number): Promise<boolean> => {
  const { error } = await supabase.from('break_logs').insert({
    user_id: userId,
    app_id: APP_ID,
    task_id: taskId,
    duration_seconds: durationSeconds,
  });
  if (error) {
    console.error("Error adding break log:", error);
    return false;
  }
  return true;
};

// NEW: Função para buscar logs de pausas para múltiplas tarefas
export const getBreakLogsForTasks = async (userId: string, taskIds: string[]): Promise<{ task_id: string; duration_seconds: number; created_at: string }[]> => {
  if (taskIds.length === 0) return [];
  const { data, error } = await supabase
    .from('break_logs')
    .select('task_id, duration_seconds, created_at') // Adicionado created_at
    .eq('user_id', userId)
    .in('task_id', taskIds);

  if (error) {
    console.error("Error fetching break logs for tasks:", error);
    return [];
  }
  return data;
};