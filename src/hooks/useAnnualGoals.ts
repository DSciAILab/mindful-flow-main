import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface AnnualGoal {
  id: string;
  title: string;
  description?: string;
  year: number;
  quarter?: 1 | 2 | 3 | 4;
  areaId?: string;
  projectId?: string;
  status: 'active' | 'completed' | 'cancelled';
  completedAt?: Date;
  createdAt: Date;
}

export interface AnnualGoalInput {
  title: string;
  description?: string;
  year: number;
  quarter?: 1 | 2 | 3 | 4;
  areaId?: string;
  projectId?: string;
}

export const useAnnualGoals = (year?: number) => {
  const [goals, setGoals] = useState<AnnualGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const currentYear = year || new Date().getFullYear();

  // Map DB row to AnnualGoal
  const mapGoal = (row: any): AnnualGoal => ({
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    year: row.year,
    quarter: row.quarter || undefined,
    areaId: row.area_id || undefined,
    projectId: row.project_id || undefined,
    status: row.status,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    createdAt: new Date(row.created_at),
  });

  // Fetch goals for the year
  const fetchGoals = useCallback(async () => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('mf_annual_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', currentYear)
        .order('quarter', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setGoals((data || []).map(mapGoal));
    } catch (error) {
      console.error('Error fetching annual goals:', error);
    } finally {
      setLoading(false);
    }
  }, [user, currentYear]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Add a new goal
  const addGoal = useCallback(async (input: AnnualGoalInput): Promise<AnnualGoal | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('mf_annual_goals')
        .insert({
          user_id: user.id,
          title: input.title,
          description: input.description || null,
          year: input.year,
          quarter: input.quarter || null,
          area_id: input.areaId || null,
          project_id: input.projectId || null,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      const newGoal = mapGoal(data);
      setGoals((prev) => [newGoal, ...prev]);

      toast({
        title: 'Meta criada!',
        description: `"${newGoal.title}" foi adicionada ao ano.`,
      });

      return newGoal;
    } catch (error) {
      console.error('Error adding annual goal:', error);
      toast({
        title: 'Erro ao criar meta',
        description: 'Não foi possível criar a meta.',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, toast]);

  // Update a goal
  const updateGoal = useCallback(async (goalId: string, updates: Partial<AnnualGoalInput>): Promise<boolean> => {
    if (!user) return false;

    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description || null;
      if (updates.quarter !== undefined) dbUpdates.quarter = updates.quarter || null;
      if (updates.areaId !== undefined) dbUpdates.area_id = updates.areaId || null;
      if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId || null;
      dbUpdates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('mf_annual_goals')
        .update(dbUpdates)
        .eq('id', goalId)
        .eq('user_id', user.id);

      if (error) throw error;

      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId ? { ...g, ...updates } : g
        )
      );

      return true;
    } catch (error) {
      console.error('Error updating annual goal:', error);
      toast({
        title: 'Erro ao atualizar meta',
        description: 'Não foi possível atualizar a meta.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  // Toggle complete
  const toggleComplete = useCallback(async (goalId: string): Promise<boolean> => {
    if (!user) return false;

    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return false;

    const isCompleting = goal.status !== 'completed';

    try {
      const { error } = await supabase
        .from('mf_annual_goals')
        .update({
          status: isCompleting ? 'completed' : 'active',
          completed_at: isCompleting ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', goalId)
        .eq('user_id', user.id);

      if (error) throw error;

      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId
            ? {
                ...g,
                status: isCompleting ? 'completed' : 'active',
                completedAt: isCompleting ? new Date() : undefined,
              }
            : g
        )
      );

      toast({
        title: isCompleting ? '🎉 Meta concluída!' : 'Meta reaberta',
        description: goal.title,
      });

      return true;
    } catch (error) {
      console.error('Error toggling goal complete:', error);
      return false;
    }
  }, [user, goals, toast]);

  // Delete a goal
  const deleteGoal = useCallback(async (goalId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('mf_annual_goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', user.id);

      if (error) throw error;

      setGoals((prev) => prev.filter((g) => g.id !== goalId));

      toast({
        title: 'Meta excluída',
        description: 'A meta foi removida.',
      });

      return true;
    } catch (error) {
      console.error('Error deleting annual goal:', error);
      toast({
        title: 'Erro ao excluir meta',
        description: 'Não foi possível excluir a meta.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  // Computed stats
  const stats = {
    total: goals.length,
    completed: goals.filter((g) => g.status === 'completed').length,
    active: goals.filter((g) => g.status === 'active').length,
    progress: goals.length > 0
      ? Math.round((goals.filter((g) => g.status === 'completed').length / goals.length) * 100)
      : 0,
    byQuarter: [1, 2, 3, 4].map((q) => ({
      quarter: q,
      total: goals.filter((g) => g.quarter === q).length,
      completed: goals.filter((g) => g.quarter === q && g.status === 'completed').length,
    })),
    byArea: goals.reduce((acc, g) => {
      if (g.areaId) {
        acc[g.areaId] = (acc[g.areaId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>),
  };

  return {
    goals,
    loading,
    stats,
    addGoal,
    updateGoal,
    toggleComplete,
    deleteGoal,
    refetch: fetchGoals,
  };
};
