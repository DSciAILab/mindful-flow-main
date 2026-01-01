import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { JournalEntry } from '@/types';

export const useJournal = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch journal entries from Supabase
  const fetchEntries = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('mf_journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // Don't show error toast if table doesn't exist yet (PGRST205)
        if (error.code === 'PGRST205' || error.message?.includes('mf_journal_entries')) {
          console.log('Journal table not yet created - this is expected if migration hasn\'t been applied');
          setEntries([]);
          setLoading(false);
          return;
        }
        throw error;
      }

      const mappedEntries: JournalEntry[] = (data || []).map((entry) => ({
        id: entry.id,
        title: entry.title || undefined,
        content: entry.content,
        mood: entry.mood as JournalEntry['mood'],
        tags: entry.tags || [],
        createdAt: new Date(entry.created_at),
        updatedAt: new Date(entry.updated_at),
      }));

      setEntries(mappedEntries);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      // Only show toast for unexpected errors
      toast({
        title: 'Erro ao carregar entradas',
        description: 'Não foi possível carregar suas entradas do diário.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Add a new journal entry
  const addEntry = useCallback(async (entryData: Partial<JournalEntry>): Promise<JournalEntry | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('mf_journal_entries')
        .insert({
          user_id: user.id,
          title: entryData.title || null,
          content: entryData.content || '',
          mood: entryData.mood || null,
          tags: entryData.tags || [],
        })
        .select()
        .single();

      if (error) throw error;

      const newEntry: JournalEntry = {
        id: data.id,
        title: data.title || undefined,
        content: data.content,
        mood: data.mood as JournalEntry['mood'],
        tags: data.tags || [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setEntries((prev) => [newEntry, ...prev]);
      return newEntry;
    } catch (error) {
      console.error('Error adding journal entry:', error);
      toast({
        title: 'Erro ao criar entrada',
        description: 'Não foi possível salvar sua entrada.',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, toast]);

  // Update a journal entry
  const updateEntry = useCallback(async (entryId: string, updates: Partial<JournalEntry>): Promise<boolean> => {
    if (!user) return false;

    try {
      const dbUpdates: Record<string, unknown> = {};
      
      if (updates.title !== undefined) dbUpdates.title = updates.title || null;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.mood !== undefined) dbUpdates.mood = updates.mood || null;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;

      const { error } = await supabase
        .from('mf_journal_entries')
        .update(dbUpdates)
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;

      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === entryId ? { ...entry, ...updates, updatedAt: new Date() } : entry
        )
      );

      return true;
    } catch (error) {
      console.error('Error updating journal entry:', error);
      toast({
        title: 'Erro ao atualizar entrada',
        description: 'Não foi possível atualizar sua entrada.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  // Delete a journal entry
  const deleteEntry = useCallback(async (entryId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('mf_journal_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;

      setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
      return true;
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      toast({
        title: 'Erro ao excluir entrada',
        description: 'Não foi possível excluir sua entrada.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  return {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    refetch: fetchEntries,
  };
};
