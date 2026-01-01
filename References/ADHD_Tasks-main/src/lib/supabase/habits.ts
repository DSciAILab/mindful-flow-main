import { supabase, APP_ID } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { NewHabit } from "@/components/habits/types"; // Importar NewHabit

// Definindo a interface para o tipo de dado retornado pelo join de projetos
interface ProjectNameOnly {
  name: string;
}

export const getHabits = async (userId: string): Promise<any[]> => {
  const { data, error } = await supabase.from('habits').select('*, projects(name)').eq('user_id', userId).order('created_at', { ascending: true });
  if (error) {
    console.error("Error fetching habits:", error);
    return [];
  }
  return data.map((habit: NewHabit & { id: string; created_at: string; projects: ProjectNameOnly[] | null }) => ({
    ...habit,
    project: habit.projects?.[0]?.name || null,
  }));
};

export const addHabit = async (userId: string, habit: NewHabit): Promise<any | null> => {
  const { data, error } = await supabase.from('habits').insert({
    ...habit,
    user_id: userId,
    app_id: APP_ID, // Adiciona o app_id
  }).select('*, projects(name)').single();
  if (error) {
    console.error("Error adding habit:", error);
    return null;
  }
  return { ...data, project: (data as NewHabit & { id: string; created_at: string; projects: ProjectNameOnly[] | null }).projects?.[0]?.name || null };
};

export const updateHabit = async (userId: string, habitId: string, updates: Partial<NewHabit>): Promise<any | null> => {
  const updatesToSend: Partial<any> = { ...updates };
  if ('project' in updatesToSend) {
    delete updatesToSend.project; // Remove a propriedade 'project' textual
  }
  const { data, error } = await supabase.from('habits').update(updatesToSend).eq('id', habitId).eq('user_id', userId).select('*, projects(name)').single();
  if (error) {
    console.error("Error updating habit:", error);
    return null;
  }
  return { ...data, project: (data as NewHabit & { id: string; created_at: string; projects: ProjectNameOnly[] | null }).projects?.[0]?.name || null };
};

export const deleteHabit = async (userId: string, habitId: string): Promise<boolean> => {
  const { error } = await supabase.from('habits').delete().eq('id', habitId).eq('user_id', userId);
  if (error) {
    console.error("Error deleting habit:", error);
    return false;
  }
  return true;
};

export const loadBooleanHabitChecks = async (userId: string): Promise<Record<string, boolean>> => {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('boolean_habit_checks')
    .select('habit_id, is_checked')
    .eq('user_id', userId)
    .eq('check_date', today);

  if (error) {
    console.error("Error loading boolean habit checks:", error);
    return {};
  }

  return data.reduce((acc, item) => {
    acc[item.habit_id] = item.is_checked;
    return acc;
  }, {} as Record<string, boolean>);
};

export const saveBooleanHabitCheck = async (userId: string, habitId: string, isChecked: boolean) => {
  const today = new Date().toISOString().split('T')[0];
  const { error } = await supabase
    .from('boolean_habit_checks')
    .upsert(
      { user_id: userId, habit_id: habitId, check_date: today, is_checked: isChecked },
      { onConflict: 'user_id, habit_id, check_date' }
    );

  if (error) {
    console.error("Error saving boolean habit check:", error);
    return false;
  }
  return true;
};

export const setBooleanHabitCheckForDate = async (userId: string, habitId: string, date: string, isChecked: boolean): Promise<boolean> => {
  const { error } = await supabase
    .from('boolean_habit_checks')
    .upsert(
      { user_id: userId, habit_id: habitId, check_date: date, is_checked: isChecked },
      { onConflict: 'user_id, habit_id, check_date' }
    );

  if (error) {
    console.error("Error setting boolean habit check for date:", error);
    return false;
  }
  return true;
};

export const getBooleanHabitChecksForWeek = async (userId: string, dateInWeek: Date): Promise<{ habit_id: string; check_date: string }[]> => {
  const startDate = format(startOfWeek(dateInWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const endDate = format(endOfWeek(dateInWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const { data, error } = await supabase
    .from('boolean_habit_checks')
    .select('habit_id, check_date')
    .eq('user_id', userId)
    .eq('is_checked', true)
    .gte('check_date', startDate)
    .lte('check_date', endDate);

  if (error) {
    console.error("Error fetching week's boolean habit checks:", error);
    return [];
  }
  return data as { habit_id: string; check_date: string }[];
};

export const getAllBooleanHabitChecks = async (userId: string): Promise<{ habit_id: string; check_date: string }[]> => {
  const { data, error } = await supabase
    .from('boolean_habit_checks')
    .select('habit_id, check_date')
    .eq('user_id', userId)
    .eq('is_checked', true)
    .order('check_date', { ascending: false });

  if (error) {
    console.error("Error fetching all boolean habit checks:", error);
    return [];
  }
  return data as { habit_id: string; check_date: string }[];
};

export const addQuantifiableEntry = async (userId: string, habitId: string, value: number, date: Date): Promise<boolean> => {
  const dateString = format(date, 'yyyy-MM-dd');
  const { error } = await supabase
    .from('quantifiable_habit_entries')
    .insert({ user_id: userId, habit_id: habitId, value: value, entry_date: dateString });
  
  if (error) {
    console.error("Error adding quantifiable entry:", error);
    return false;
  }
  return true;
};

export const deleteLastQuantifiableEntry = async (userId: string, habitId: string, date: Date): Promise<boolean> => {
  const dateString = format(date, 'yyyy-MM-dd');
  const { data, error: fetchError } = await supabase
    .from('quantifiable_habit_entries')
    .select('id')
    .eq('user_id', userId)
    .eq('habit_id', habitId)
    .eq('entry_date', dateString)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (fetchError || !data) {
    console.error("Error finding last entry to delete:", fetchError);
    return false;
  }

  const { error: deleteError } = await supabase
    .from('quantifiable_habit_entries')
    .delete()
    .eq('id', data.id);

  if (deleteError) {
    console.error("Error deleting last entry:", deleteError);
    return false;
  }
  return true;
};

export const getQuantifiableEntriesForWeek = async (userId: string, dateInWeek: Date): Promise<{ habit_id: string; entry_date: string; value: number }[]> => {
  const startDate = format(startOfWeek(dateInWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const endDate = format(endOfWeek(dateInWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const { data, error } = await supabase
    .from('quantifiable_habit_entries')
    .select('habit_id, entry_date, value')
    .eq('user_id', userId)
    .gte('entry_date', startDate)
    .lte('entry_date', endDate);

  if (error) {
    console.error("Error fetching week's quantifiable entries:", error);
    return [];
  }
  return data;
};

export const getAllQuantifiableEntries = async (userId: string): Promise<{ habit_id: string; entry_date: string; value: number }[]> => {
  const { data, error } = await supabase
    .from('quantifiable_habit_entries')
    .select('habit_id, entry_date, value')
    .eq('user_id', userId)
    .order('entry_date', { ascending: false });

  if (error) {
    console.error("Error fetching all quantifiable entries:", error);
    return [];
  }
  return data;
};