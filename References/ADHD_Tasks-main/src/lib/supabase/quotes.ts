import { supabase, APP_ID } from "@/integrations/supabase/client";

export const getQuotes = async (userId: string): Promise<{ id: string; text: string; author: string | null }[]> => {
  const { data, error } = await supabase.from('quotes').select('id, text, author').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) {
    console.error("Error fetching quotes:", error);
    return [];
  }
  return data;
};

export const addQuote = async (userId: string, quote: { text: string; author: string | null }): Promise<boolean> => {
  const { error } = await supabase.from('quotes').insert({ user_id: userId, app_id: APP_ID, ...quote });
  if (error) {
    console.error("Error adding quote:", error);
    return false;
  }
  return true;
};

export const addMultipleQuotes = async (userId: string, quotes: { text: string; author: string | null }[]): Promise<boolean> => {
  const quotesWithUserId = quotes.map(q => ({ ...q, user_id: userId, app_id: APP_ID }));
  const { error } = await supabase.from('quotes').insert(quotesWithUserId);
  if (error) {
    console.error("Error adding multiple quotes:", error);
    return false;
  }
  return true;
};

export const updateQuote = async (userId: string, quoteId: string, updates: { text: string; author: string | null }): Promise<boolean> => {
  const { error } = await supabase.from('quotes').update(updates).eq('id', quoteId).eq('user_id', userId);
  if (error) {
    console.error("Error updating quote:", error);
    return false;
  }
  return true;
};

export const deleteQuote = async (userId: string, quoteId: string): Promise<boolean> => {
  const { error } = await supabase.from('quotes').delete().eq('id', quoteId).eq('user_id', userId);
  if (error) {
    console.error("Error deleting quote:", error);
    return false;
  }
  return true;
};