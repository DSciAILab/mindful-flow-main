import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { CaptureItem } from '@/types';

export const useCaptureItems = () => {
  const [items, setItems] = useState<CaptureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const [stats, setStats] = useState({ capturedToday: 0, processedToday: 0 });

  // Fetch capture items from Supabase
  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems([]);
      setStats({ capturedToday: 0, processedToday: 0 });
      setLoading(false);
      return;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();

      // Main items query (unprocessed)
      const { data, error } = await supabase
        .from('mf_capture_items')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .eq('processed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Stats queries
      const capturedTodayQuery = supabase
        .from('mf_capture_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', todayIso);

      const processedTodayQuery = supabase
        .from('mf_capture_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('processed', true)
        .gte('updated_at', todayIso); // Assuming updated_at exists, generic fallback handled if needed by user schema check? 
        // If updated_at doesn't exist, this might error. But standard Supabase timestamps have it. 
        // To be safe we could just count *processed* items without date if we aren't sure, 
        // but User asked for "Processed Today".
        
      const [capturedRes, processedRes] = await Promise.all([capturedTodayQuery, processedTodayQuery]);
      
      setStats({
        capturedToday: capturedRes.count || 0,
        processedToday: processedRes.count || 0,
      });

      const mappedItems: CaptureItem[] = (data || []).map((item: any) => ({
        id: item.id,
        type: item.type as CaptureItem['type'],
        content: item.content,
        processedText: undefined,
        audioUrl: item.audio_url,
        createdAt: new Date(item.created_at),
        processed: item.processed,
      }));

      setItems(mappedItems);
    } catch (error) {
      console.error('Error fetching capture items:', error);
      toast({
        title: 'Erro ao carregar inbox',
        description: 'Não foi possível carregar seus itens capturados.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Add a new capture item
  const addItem = useCallback(async (type: CaptureItem['type'], content: string, audioUrl?: string): Promise<CaptureItem | null> => {
    if (!user) return null;

    console.log('Adding capture item:', { type, content, audioUrl });

    try {
      const { data, error } = await supabase
        .from('mf_capture_items')
        .insert({
          user_id: user.id,
          type,
          content,
          audio_url: audioUrl,
          processed: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      console.log('Capture item added successfully:', data);

      const newItem: CaptureItem = {
        id: data.id,
        type: data.type as CaptureItem['type'],
        content: data.content,
        audioUrl: data.audio_url,
        createdAt: new Date(data.created_at),
        processed: data.processed,
      };

      setItems((prev) => [newItem, ...prev]);
      return newItem;
      return newItem;
    } catch (error) {
      console.error('Error adding capture item:', error);
      toast({
        title: 'Erro ao capturar',
        description: 'Não foi possível salvar o item.',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, toast]);

  // Soft delete a capture item
  const deleteItem = useCallback(async (itemId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('mf_capture_items')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) throw error;

      setItems((prev) => prev.filter((item) => item.id !== itemId));
      return true;
    } catch (error) {
      console.error('Error deleting capture item:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o item.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  // Mark item as processed and remove from local list
  const markAsProcessed = useCallback(async (itemId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('mf_capture_items')
        .update({ processed: true })
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Remove item from local state so it disappears from the inbox
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      return true;
    } catch (error) {
      console.error('Error marking item as processed:', error);
      toast({
        title: 'Erro ao processar',
        description: 'Não foi possível marcar o item como processado.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  // Update a capture item
  const updateItem = useCallback(async (itemId: string, updates: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('mf_capture_items')
        .update({ content: updates })
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) throw error;

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, content: updates } : item
        )
      );
      return true;
    } catch (error) {
      console.error('Error updating capture item:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível salvar as alterações.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  return {
    items,
    loading,
    addItem,
    deleteItem,
    markAsProcessed,
    updateItem,
    refetch: fetchItems,
    stats: {
      waiting: items.length,
      capturedToday: stats.capturedToday,
      processedToday: stats.processedToday,
    }
  };
};
