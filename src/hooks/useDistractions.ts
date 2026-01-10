import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { Distraction, DistractionFilter } from '@/types/distractions';

export const useDistractions = () => {
  const [distractions, setDistractions] = useState<Distraction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Map raw DB data to Distraction type
  const mapDistraction = (item: any): Distraction => ({
    id: item.id,
    userId: item.user_id,
    content: item.content,
    capturedDuringTaskId: item.captured_during_task_id,
    focusSessionId: item.focus_session_id,
    processed: item.processed,
    processedAt: item.processed_at ? new Date(item.processed_at) : undefined,
    convertedToTaskId: item.converted_to_task_id,
    createdAt: new Date(item.created_at),
  });

  // Fetch distractions with optional filters
  const fetchDistractions = useCallback(async (filter?: DistractionFilter) => {
    if (!user) {
      setDistractions([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('mf_distractions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filter?.processed !== undefined) {
        query = query.eq('processed', filter.processed);
      }
      if (filter?.focusSessionId) {
        query = query.eq('focus_session_id', filter.focusSessionId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setDistractions((data || []).map(mapDistraction));
    } catch (error) {
      console.error('Error fetching distractions:', error);
      toast({
        title: 'Erro ao carregar distrações',
        description: 'Não foi possível carregar suas anotações.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchDistractions();
  }, [fetchDistractions]);

  // Capture a new distraction
  const captureDistraction = useCallback(async (
    content: string,
    taskId?: string,
    sessionId?: string
  ): Promise<Distraction | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('mf_distractions')
        .insert({
          user_id: user.id,
          content,
          captured_during_task_id: taskId,
          focus_session_id: sessionId,
          processed: false,
        })
        .select()
        .single();

      if (error) throw error;

      const newDistraction = mapDistraction(data);
      setDistractions(prev => [newDistraction, ...prev]);
      
      toast({
        title: 'Anotado!',
        description: 'Continue focado. Você pode revisar depois.',
      });

      return newDistraction;
    } catch (error) {
      console.error('Error capturing distraction:', error);
      toast({
        title: 'Erro ao anotar',
        description: 'Não foi possível salvar a anotação.',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, toast]);

  // Convert distraction to task
  const convertToTask = useCallback(async (
    distractionId: string,
    createTaskFn: (title: string) => Promise<{ id: string } | null>
  ): Promise<boolean> => {
    if (!user) return false;

    const distraction = distractions.find(d => d.id === distractionId);
    if (!distraction) return false;

    try {
      // Create the task using the provided function
      const task = await createTaskFn(distraction.content);
      if (!task) throw new Error('Failed to create task');

      // Update distraction as processed and converted
      const { error } = await supabase
        .from('mf_distractions')
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
          converted_to_task_id: task.id,
        })
        .eq('id', distractionId)
        .eq('user_id', user.id);

      if (error) throw error;

      setDistractions(prev => prev.map(d =>
        d.id === distractionId
          ? { ...d, processed: true, processedAt: new Date(), convertedToTaskId: task.id }
          : d
      ));

      toast({
        title: 'Tarefa criada!',
        description: 'A distração foi convertida em tarefa.',
      });

      return true;
    } catch (error) {
      console.error('Error converting to task:', error);
      toast({
        title: 'Erro ao converter',
        description: 'Não foi possível criar a tarefa.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, distractions, toast]);

  // Move distraction to inbox (capture items)
  const moveToInbox = useCallback(async (
    distractionId: string,
    addCaptureItemFn: (type: 'text', content: string) => Promise<any>
  ): Promise<boolean> => {
    if (!user) return false;

    const distraction = distractions.find(d => d.id === distractionId);
    if (!distraction) return false;

    try {
      // Add to capture items using provided function
      await addCaptureItemFn('text', distraction.content);

      // Mark as processed
      const { error } = await supabase
        .from('mf_distractions')
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
        })
        .eq('id', distractionId)
        .eq('user_id', user.id);

      if (error) throw error;

      setDistractions(prev => prev.map(d =>
        d.id === distractionId
          ? { ...d, processed: true, processedAt: new Date() }
          : d
      ));

      toast({
        title: 'Movido para Inbox!',
        description: 'A distração foi movida para o inbox.',
      });

      return true;
    } catch (error) {
      console.error('Error moving to inbox:', error);
      toast({
        title: 'Erro ao mover',
        description: 'Não foi possível mover para o inbox.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, distractions, toast]);

  // Mark distraction as processed
  const markAsProcessed = useCallback(async (distractionId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('mf_distractions')
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
        })
        .eq('id', distractionId)
        .eq('user_id', user.id);

      if (error) throw error;

      setDistractions(prev => prev.map(d =>
        d.id === distractionId
          ? { ...d, processed: true, processedAt: new Date() }
          : d
      ));

      return true;
    } catch (error) {
      console.error('Error marking as processed:', error);
      toast({
        title: 'Erro ao processar',
        description: 'Não foi possível marcar como processado.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  // Delete distraction
  const deleteDistraction = useCallback(async (distractionId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('mf_distractions')
        .delete()
        .eq('id', distractionId)
        .eq('user_id', user.id);

      if (error) throw error;

      setDistractions(prev => prev.filter(d => d.id !== distractionId));
      return true;
    } catch (error) {
      console.error('Error deleting distraction:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a distração.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  // Get distractions for a specific session
  const getSessionDistractions = useCallback((sessionId: string): Distraction[] => {
    return distractions.filter(d => d.focusSessionId === sessionId);
  }, [distractions]);

  // Get unprocessed count
  const getUnprocessedCount = useCallback((): number => {
    return distractions.filter(d => !d.processed).length;
  }, [distractions]);

  return {
    distractions,
    loading,
    captureDistraction,
    convertToTask,
    moveToInbox,
    markAsProcessed,
    deleteDistraction,
    getSessionDistractions,
    getUnprocessedCount,
    refetch: fetchDistractions,
  };
};
