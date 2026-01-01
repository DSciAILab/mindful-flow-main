import { supabase, APP_ID } from "@/integrations/supabase/client";
import { ParsedTask } from "@/utils/taskParser";
import { subDays } from 'date-fns';
import { toast } from "sonner";

// Definindo a interface para o tipo de dado retornado pelo join de projetos
interface ProjectNameOnly {
  name: string;
}

export const getTasks = async (userId: string, status?: ParsedTask['status']): Promise<ParsedTask[]> => {
  let query = supabase.from('tasks').select('*, projects(name)').eq('user_id', userId); // Join com projects para obter o nome
  if (status) {
    query = query.eq('status', status);
  }
  const { data, error } = await query.order('created_at', { ascending: true });
  if (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
  return data.map((task: ParsedTask & { projects: ProjectNameOnly[] | null }) => ({
    ...task,
    project: task.projects?.[0]?.name || null, // Acessa o primeiro elemento do array
  })) as ParsedTask[];
};

export const getUnscheduledTasks = async (userId: string): Promise<ParsedTask[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, scheduled_blocks!left(id), projects(name)') // Join com projects
    .eq('user_id', userId)
    .eq('status', 'todo')
    .is('scheduled_blocks.id', null)
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Error fetching unscheduled tasks:", error);
    return [];
  }
  return data.map((task: ParsedTask & { projects: ProjectNameOnly[] | null }) => ({
    ...task,
    project: task.projects?.[0]?.name || null,
  })) as ParsedTask[];
};

export const getProjectTasks = async (userId: string): Promise<ParsedTask[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, projects(name)') // Join com projects
    .eq('user_id', userId)
    .not('project_id', 'is', null) // Alterado para project_id
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Error fetching project tasks:", error);
    return [];
  }
  return data.map((task: ParsedTask & { projects: ProjectNameOnly[] | null }) => ({
    ...task,
    project: task.projects?.[0]?.name || null,
  })) as ParsedTask[];
};

export const addTask = async (userId: string, task: ParsedTask): Promise<ParsedTask | null> => {
  const { data, error } = await supabase.from('tasks').insert({
    ...task,
    user_id: userId,
    app_id: APP_ID,
    project_id: task.project_id, // Usar project_id
    project: undefined, // Remover a propriedade 'project' se ela existir no objeto task
  }).select('*, projects(name)').single(); // Selecionar o nome do projeto de volta
  if (error) {
    console.error("Error adding task:", error);
    toast.error(`Falha ao adicionar tarefa: ${error.message}`);
    return null;
  }
  return { ...data, project: (data as ParsedTask & { projects: ProjectNameOnly[] | null }).projects?.[0]?.name || null } as ParsedTask;
};

export const updateTask = async (userId: string, taskId: string, updates: Partial<ParsedTask>): Promise<ParsedTask | null> => {
  const updatesToSend: Partial<any> = { ...updates };
  if ('project' in updatesToSend) {
    delete updatesToSend.project; // Remove a propriedade 'project' textual
  }

  // Se a tarefa está sendo marcada como 'completed', conceda XP
  if (updates.status === 'completed') {
    const XP_PER_TASK = 10; // Defina a quantidade de XP por tarefa
    const { error: xpError } = await supabase
      .rpc('increment_xp', { user_id: userId, amount: XP_PER_TASK }); // CORRIGIDO: Chamada RPC diretamente no cliente supabase

    if (xpError) {
      console.error("Error incrementing XP:", xpError);
      toast.error(`Falha ao conceder XP: ${xpError.message}`);
    } else {
      toast.success(`Tarefa concluída! Você ganhou ${XP_PER_TASK} XP!`);
    }
  }

  const { data, error } = await supabase.from('tasks').update(updatesToSend).eq('id', taskId).eq('user_id', userId).select('*, projects(name)').single();
  if (error) {
    console.error("Error updating task:", error);
    toast.error(`Falha ao atualizar tarefa: ${error.message}`);
    return null;
  }
  return { ...data, project: (data as ParsedTask & { projects: ProjectNameOnly[] | null }).projects?.[0]?.name || null } as ParsedTask;
};

export const deleteTask = async (userId: string, taskId: string): Promise<boolean> => {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId).eq('user_id', userId);
  if (error) {
    console.error("Error deleting task:", error);
    toast.error(`Falha ao deletar tarefa: ${error.message}`);
    return false;
  }
  return true;
};

export const getCompletedTasksLastWeek = async (userId: string): Promise<ParsedTask[]> => {
  const sevenDaysAgo = subDays(new Date(), 7).toISOString();

  const { data, error } = await supabase
    .from('tasks')
    .select('*, projects(name)') // Join com projects
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('updated_at', sevenDaysAgo)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error("Error fetching last week's completed tasks:", error);
    return [];
  }
  return data.map((task: ParsedTask & { projects: ProjectNameOnly[] | null }) => ({
    ...task,
    project: task.projects?.[0]?.name || null,
  })) as ParsedTask[];
};

// NEW: Busca histórico completo (completas e canceladas) para a Inbox
export const getInboxHistory = async (userId: string): Promise<ParsedTask[]> => {
  // Busca as últimas 100 tarefas (para evitar sobrecarga) que estão 'completed' ou 'cancelled'
  const { data, error } = await supabase
    .from('tasks')
    .select('*, projects(name)')
    .eq('user_id', userId)
    .in('status', ['completed', 'cancelled'])
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching inbox history:", error);
    return [];
  }
  return data.map((task: ParsedTask & { projects: ProjectNameOnly[] | null }) => ({
    ...task,
    project: task.projects?.[0]?.name || null,
  })) as ParsedTask[];
};

export const getUniqueProjects = async (userId: string): Promise<string[]> => {
  // Agora, buscamos os nomes dos projetos da nova tabela 'projects'
  const { data, error } = await supabase
    .from('projects')
    .select('name')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) {
    console.error("Error fetching unique project names:", error);
    return [];
  }

  return data.map(p => p.name);
};

export const getUniqueHashtags = async (userId: string): Promise<string[]> => {
  const { data: tasks, error: tasksError } = await supabase.from('tasks').select('hashtags').eq('user_id', userId);
  const { data: notes, error: notesError } = await supabase.from('notes').select('hashtags').eq('user_id', userId);

  if (tasksError || notesError) {
    console.error("Error fetching hashtags from tables:", tasksError || notesError);
    return [];
  }

  const allHashtags = [
    ...(tasks || []).flatMap(t => t.hashtags || []),
    ...(notes || []).flatMap(n => n.hashtags || [])
  ];

  return [...new Set(allHashtags)].sort();
};