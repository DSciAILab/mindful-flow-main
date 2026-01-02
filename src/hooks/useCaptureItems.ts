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

  // Fetch capture items from Supabase
  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('mf_capture_items')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedItems: CaptureItem[] = (data || []).map((item: any) => ({
        id: item.id,
        type: item.type as CaptureItem['type'],
        content: item.content,
        processedText: undefined,
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
  const addItem = useCallback(async (type: CaptureItem['type'], content: string): Promise<CaptureItem | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('mf_capture_items')
        .insert({
          user_id: user.id,
          type,
          content,
          processed: false,
        })
        .select()
        .single();

      if (error) throw error;

      const newItem: CaptureItem = {
        id: data.id,
        type: data.type as CaptureItem['type'],
        content: data.content,
        createdAt: new Date(data.created_at),
        processed: data.processed,
      };

      setItems((prev) => [newItem, ...prev]);
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

  // Mark item as processed
  const markAsProcessed = useCallback(async (itemId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('mf_capture_items')
        .update({ processed: true })
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) throw error;

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, processed: true } : item
        )
      );
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

  return {
    items,
    loading,
    addItem,
    deleteItem,
    markAsProcessed,
    refetch: fetchItems,
  };
};
