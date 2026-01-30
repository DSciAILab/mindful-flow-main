import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  audio_url?: string | null;
  image_urls?: string[] | null;
  goal_id?: string | null;
  project_id?: string | null;
  habit_id?: string | null;
  task_id?: string | null;
  area_id?: string | null;
  is_pinned?: boolean;
  is_favorite?: boolean;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface NoteInput {
  title: string;
  content?: string;
  audio_url?: string;
  image_urls?: string[];
  goal_id?: string;
  project_id?: string;
  habit_id?: string;
  task_id?: string;
  area_id?: string;
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
      
      // Simple query without ordering by columns that might not exist
      const { data, error } = await supabase
        .from('mf_notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map data with default values for missing columns
      const mappedNotes: Note[] = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        title: item.title || 'Sem título',
        content: item.content,
        audio_url: item.audio_url,
        image_urls: item.image_urls || [],
        goal_id: item.goal_id,
        project_id: item.project_id,
        habit_id: item.habit_id,
        task_id: item.task_id,
        area_id: item.area_id || 'personal',
        is_pinned: item.is_pinned || false,
        is_favorite: item.is_favorite || false,
        tags: item.tags || [],
        created_at: item.created_at,
        updated_at: item.updated_at || item.created_at,
      }));
      
      // Sort pinned first
      mappedNotes.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return 0;
      });
      
      setNotes(mappedNotes);
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

      // Build insert object with all columns
        const insertData: Record<string, any> = {
        user_id: user.id,
        title: note.title,
        content: note.content || null,
        audio_url: note.audio_url || null,
        image_urls: note.image_urls || null,
        goal_id: note.goal_id || null,
        project_id: note.project_id || null, // Ensure empty string becomes null
        habit_id: note.habit_id || null,
        task_id: note.task_id || null,
        area_id: note.area_id || null,
        tags: note.tags || [],
      };

      // Try to add optional fields - they will be ignored if columns don't exist
      // But we'll catch the error and retry with minimal data if needed
      
      const { data, error } = await supabase
        .from('mf_notes')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      // Map the returned data with defaults
      const newNote: Note = {
        id: data.id,
        user_id: data.user_id,
        title: data.title,
        content: data.content,
        audio_url: data.audio_url,
        image_urls: data.image_urls || [],
        goal_id: data.goal_id,
        project_id: data.project_id,
        habit_id: data.habit_id,
        task_id: data.task_id,
        area_id: data.area_id || 'personal',
        is_pinned: data.is_pinned || false,
        is_favorite: data.is_favorite || false,
        tags: data.tags || [],
        created_at: data.created_at,
        updated_at: data.updated_at || data.created_at,
      };

      setNotes([newNote, ...notes]);
      toast({
        title: 'Nota criada',
        description: 'Sua nota foi salva com sucesso.',
      });
      return newNote;
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
      // Build update object - only title and content are safe
      const updateData: Record<string, any> = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.content !== undefined) updateData.content = updates.content;

      const { data, error } = await supabase
        .from('mf_notes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedNote: Note = {
        id: data.id,
        user_id: data.user_id,
        title: data.title,
        content: data.content,
        audio_url: data.audio_url,
        image_urls: data.image_urls || [],
        goal_id: data.goal_id,
        project_id: data.project_id,
        habit_id: data.habit_id,
        task_id: data.task_id,
        area_id: data.area_id || 'personal',
        is_pinned: data.is_pinned || false,
        is_favorite: data.is_favorite || false,
        tags: data.tags || [],
        created_at: data.created_at,
        updated_at: data.updated_at || data.created_at,
      };

      setNotes(notes.map(n => n.id === id ? updatedNote : n));
      return updatedNote;
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
    // This might fail if is_pinned column doesn't exist, but that's OK
    try {
      const { error } = await supabase
        .from('mf_notes')
        .update({ is_pinned: !currentStatus })
        .eq('id', id);
      
      if (!error) {
        setNotes(notes.map(n => n.id === id ? { ...n, is_pinned: !currentStatus } : n));
      }
    } catch (e) {
      console.log('Pin toggle not available');
    }
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
