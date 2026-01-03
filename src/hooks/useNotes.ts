import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  audio_url?: string | null; // For audio notes
  goal_id?: string | null;
  project_id?: string | null;
  habit_id?: string | null;
  area_id: string;
  is_pinned: boolean;
  is_favorite: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface NoteInput {
  title: string;
  content?: string;
  audio_url?: string;
  goal_id?: string;
  project_id?: string;
  habit_id?: string;
  area_id: string;
  tags?: string[];
}

export function useNotes(areaId?: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotes();
  }, [areaId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('mf_notes')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      if (areaId) {
        query = query.eq('area_id', areaId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: 'Erro ao carregar notas',
        description: 'Não foi possível carregar suas notas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addNote = async (note: NoteInput) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('mf_notes')
        .insert([{ ...note, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setNotes([data, ...notes]);
      toast({
        title: 'Nota criada',
        description: 'Sua nota foi salva com sucesso.',
      });
      return data;
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: 'Erro ao criar nota',
        description: 'Ocorreu um erro ao salvar sua nota.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateNote = async (id: string, updates: Partial<NoteInput>) => {
    try {
      const { data, error } = await supabase
        .from('mf_notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setNotes(notes.map(n => n.id === id ? data : n));
      return data;
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar a nota.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('mf_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotes(notes.filter(n => n.id !== id));
      toast({
        title: 'Nota excluída',
        description: 'A nota foi removida com sucesso.',
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a nota.',
        variant: 'destructive',
      });
    }
  };

  const togglePin = async (id: string, currentStatus: boolean) => {
    return updateNote(id, { is_pinned: !currentStatus } as any);
  };

  return {
    notes,
    loading,
    addNote,
    updateNote,
    deleteNote,
    togglePin,
    refreshNotes: fetchNotes
  };
}
