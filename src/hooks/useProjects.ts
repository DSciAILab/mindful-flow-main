import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { Project } from '@/types';

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('mf_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedProjects: Project[] = (data || []).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description || undefined,
        areaId: p.life_area_id || undefined,
        goalId: p.goal_id || undefined,
        color: p.color || '#3b82f6',
        progress: 0, // Calculated later or stored
        tasks: [], // Fetched separately if needed
        createdAt: new Date(p.created_at),
      }));

      setProjects(mappedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const addProject = async (projectData: Partial<Project>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('mf_projects')
        .insert({
          user_id: user.id,
          name: projectData.name || 'Novo Projeto',
          description: projectData.description || null,
          color: projectData.color || '#3b82f6',
          life_area_id: projectData.areaId || null,
          goal_id: projectData.goalId || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newProject: Project = {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        areaId: data.life_area_id || undefined,
        goalId: data.goal_id || undefined,
        color: data.color,
        progress: 0,
        tasks: [],
        createdAt: new Date(data.created_at),
      };

      setProjects(prev => [newProject, ...prev]);
      return newProject;
    } catch (error) {
      console.error('Error adding project:', error);
      toast({
        title: 'Erro ao criar projeto',
        description: error.message || 'Não foi possível criar o projeto.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateProject = async (projectId: string, updates: Partial<Project>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('mf_projects')
        .update({
          name: updates.name,
          description: updates.description,
          color: updates.color,
          life_area_id: updates.areaId,
          goal_id: updates.goalId,
        })
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) throw error;

      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, ...updates } : p
      ));

      toast({
        title: 'Projeto atualizado',
        description: 'As alterações foram salvas.',
      });

      return true;
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: 'Erro ao atualizar projeto',
        description: 'Não foi possível salvar as alterações.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteProject = async (projectId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('mf_projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== projectId));

      toast({
        title: 'Projeto excluído',
        description: 'O projeto foi removido.',
      });

      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Erro ao excluir projeto',
        description: 'Não foi possível excluir o projeto.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    projects,
    loading,
    addProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
  };
};
