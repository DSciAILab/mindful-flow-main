import { supabase, APP_ID } from "@/integrations/supabase/client";
import { format } from "date-fns"; // Importar format

export interface Project {
  id: string;
  user_id: string;
  app_id: string;
  name: string;
  description: string | null;
  woop_wish: string | null;
  woop_outcome: string | null;
  woop_obstacle: string | null;
  woop_plan: string | null;
  smart_specific: string | null;
  smart_measurable: string | null;
  smart_achievable: string | null;
  smart_relevant: string | null;
  smart_time_bound: string | null; // DATE type in DB, use string for JS
  created_at: string;
  updated_at: string;
}

export const getProjects = async (userId: string): Promise<Project[]> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
  return data as Project[];
};

export const getProjectById = async (userId: string, projectId: string): Promise<Project | null> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .eq('id', projectId)
    .single();

  if (error) {
    console.error("Error fetching project by ID:", error);
    return null;
  }
  return data as Project;
};

export const addProject = async (userId: string, project: Omit<Project, 'id' | 'user_id' | 'app_id' | 'created_at' | 'updated_at'>): Promise<Project | null> => {
  const { data, error } = await supabase
    .from('projects')
    .insert({ ...project, user_id: userId, app_id: APP_ID })
    .select()
    .single();

  if (error) {
    console.error("Error adding project:", error);
    return null;
  }
  return data as Project;
};

export const updateProject = async (userId: string, projectId: string, updates: Partial<Omit<Project, 'id' | 'user_id' | 'app_id' | 'created_at' | 'updated_at'>>): Promise<boolean> => {
  const updatesToSend: Partial<Project> = { ...updates };
  // Formatar smart_time_bound para 'yyyy-MM-dd' se existir e for um objeto Date
  if (updatesToSend.smart_time_bound && typeof updatesToSend.smart_time_bound !== 'string') {
    updatesToSend.smart_time_bound = format(new Date(updatesToSend.smart_time_bound), 'yyyy-MM-dd');
  }

  const { error } = await supabase
    .from('projects')
    .update(updatesToSend)
    .eq('id', projectId)
    .eq('user_id', userId);

  if (error) {
    console.error("Error updating project:", error);
    return false;
  }
  return true;
};

export const deleteProject = async (userId: string, projectId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', userId);

  if (error) {
    console.error("Error deleting project:", error);
    return false;
  }
  return true;
};