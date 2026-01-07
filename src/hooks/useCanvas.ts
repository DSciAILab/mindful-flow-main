import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import type { Sketch } from '@/types';

export interface SketchInput {
  title: string;
  canvas_data: string;
  thumbnail?: string;
}

export function useCanvas() {
  const [sketches, setSketches] = useState<Sketch[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSketches();
  }, []);

  const fetchSketches = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('mf_sketches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedSketches: Sketch[] = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        title: item.title || 'Untitled Sketch',
        canvas_data: item.canvas_data,
        thumbnail: item.thumbnail,
        created_at: new Date(item.created_at),
        updated_at: new Date(item.updated_at || item.created_at),
      }));
      
      setSketches(mappedSketches);
    } catch (error) {
      console.error('Error fetching sketches:', error);
      toast({
        title: 'Erro ao carregar desenhos',
        description: 'Não foi possível carregar seus desenhos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addSketch = async (sketch: SketchInput) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const insertData = {
        user_id: user.id,
        title: sketch.title,
        canvas_data: sketch.canvas_data,
        thumbnail: sketch.thumbnail || null,
      };

      const { data, error } = await supabase
        .from('mf_sketches')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      const newSketch: Sketch = {
        id: data.id,
        user_id: data.user_id,
        title: data.title,
        canvas_data: data.canvas_data,
        thumbnail: data.thumbnail,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at || data.created_at),
      };

      setSketches([newSketch, ...sketches]);
      toast({
        title: 'Desenho salvo',
        description: 'Seu desenho foi salvo com sucesso.',
      });
      return newSketch;
    } catch (error) {
      console.error('Error adding sketch:', error);
      toast({
        title: 'Erro ao salvar desenho',
        description: 'Ocorreu um erro ao salvar seu desenho.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateSketch = async (id: string, updates: Partial<SketchInput>) => {
    try {
      const updateData: Record<string, any> = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.canvas_data !== undefined) updateData.canvas_data = updates.canvas_data;
      if (updates.thumbnail !== undefined) updateData.thumbnail = updates.thumbnail;

      const { data, error } = await supabase
        .from('mf_sketches')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedSketch: Sketch = {
        id: data.id,
        user_id: data.user_id,
        title: data.title,
        canvas_data: data.canvas_data,
        thumbnail: data.thumbnail,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      };

      setSketches(sketches.map(s => s.id === id ? updatedSketch : s));
      toast({
        title: 'Desenho atualizado',
        description: 'As alterações foram salvas.',
      });
      return updatedSketch;
    } catch (error) {
      console.error('Error updating sketch:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o desenho.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteSketch = async (id: string) => {
    try {
      const { error } = await supabase
        .from('mf_sketches')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSketches(sketches.filter(s => s.id !== id));
      toast({
        title: 'Desenho excluído',
        description: 'O desenho foi removido com sucesso.',
      });
      return true;
    } catch (error) {
      console.error('Error deleting sketch:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o desenho.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    sketches,
    loading,
    addSketch,
    updateSketch,
    deleteSketch,
    refreshSketches: fetchSketches,
  };
}
