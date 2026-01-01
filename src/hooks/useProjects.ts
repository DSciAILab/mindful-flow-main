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
        })
        .select()
        .single();

      if (error) throw error;

      const newProject: Project = {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
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

  return {
    projects,
    loading,
    addProject,
    refetch: fetchProjects,
  };
};
