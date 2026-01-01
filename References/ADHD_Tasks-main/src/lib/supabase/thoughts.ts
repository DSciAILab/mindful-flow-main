import { supabase, APP_ID } from "@/integrations/supabase/client";

export interface Thought {
  id: string;
  content: string;
  mood?: string;
  created_at: string;
}

export const getThoughts = async (userId: string): Promise<Thought[]> => {
  const { data, error } = await supabase
    .from('thoughts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching thoughts:", error);
    return [];
  }
  return data as Thought[];
};

export const addThought = async (userId: string, content: string, mood?: string): Promise<Thought | null> => {
  const { data, error } = await supabase
    .from('thoughts')
    .insert({
      user_id: userId,
      content,
      mood,
      app_id: APP_ID, // Mantendo consistência com outras tabelas se necessário futuramente
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding thought:", error);
    return null;
  }
  return data as Thought;
};

export const deleteThought = async (userId: string, thoughtId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('thoughts')
    .delete()
    .eq('id', thoughtId)
    .eq('user_id', userId);

  if (error) {
    console.error("Error deleting thought:", error);
    return false;
  }
  return true;
};