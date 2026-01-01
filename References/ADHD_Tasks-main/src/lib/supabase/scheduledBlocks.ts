import { supabase, APP_ID } from "@/integrations/supabase/client";
import { format } from "date-fns";

// Define a interface para o nome do projeto aninhado
interface NestedProjectName {
  name: string;
}

// Define a interface para a tarefa aninhada
interface NestedTask {
  title: string;
  project_id: string | null;
  hashtags: string[];
  category: 'red' | 'yellow' | 'purple' | 'green' | null;
  projects: NestedProjectName | null; // projects will be an object or null here
}

// Interface para a estrutura de dados bruta retornada pelo Supabase com o join
interface RawScheduledBlockFromSupabase {
  id: string;
  user_id: string;
  task_id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
  tasks: NestedTask | null; // tasks will be an object or null
}

export interface ScheduledBlock {
  id: string;
  user_id: string;
  task_id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
  tasks: NestedTask | null; // tasks will be an object or null
  project: string | null; // Flattened project name
}

// Tipo para as propriedades que são realmente inseridas/atualizadas na tabela scheduled_blocks
type ScheduledBlockInput = {
  task_id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
};

export const getScheduledBlocks = async (userId: string, date: Date): Promise<ScheduledBlock[]> => {
  const dateString = format(date, 'yyyy-MM-dd');
  const startOfDay = `${dateString}T00:00:00.000Z`;
  const endOfDay = `${dateString}T23:59:59.999Z`;

  const { data, error } = await supabase
    .from('scheduled_blocks')
    .select(`
      *,
      tasks (
        title,
        project_id,
        hashtags,
        category,
        projects(name)
      )
    `)
    .eq('user_id', userId)
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)
    .order('start_time', { ascending: true });

  if (error) {
    console.error("Error fetching scheduled blocks:", error);
    return [];
  }
  // Mapear os dados brutos para a interface ScheduledBlock
  return (data as RawScheduledBlockFromSupabase[]).map(block => ({
    id: block.id,
    user_id: block.user_id,
    task_id: block.task_id,
    start_time: block.start_time,
    end_time: block.end_time,
    duration_minutes: block.duration_minutes,
    created_at: block.created_at,
    updated_at: block.updated_at,
    tasks: block.tasks,
    project: block.tasks?.projects?.name || null,
  }));
};

export const addScheduledBlock = async (userId: string, block: ScheduledBlockInput): Promise<ScheduledBlock | null> => {
  const { data, error } = await supabase
    .from('scheduled_blocks')
    .insert({ ...block, user_id: userId, app_id: APP_ID })
    .select(`
      *,
      tasks (
        title,
        project_id,
        hashtags,
        category,
        projects(name)
      )
    `)
    .single();

  if (error) {
    console.error("Error adding scheduled block:", error);
    return null;
  }
  // Mapear o dado único bruto para a interface ScheduledBlock
  return data ? ({
    id: data.id,
    user_id: data.user_id,
    task_id: data.task_id,
    start_time: data.start_time,
    end_time: data.end_time,
    duration_minutes: data.duration_minutes,
    created_at: data.created_at,
    updated_at: data.updated_at,
    tasks: data.tasks,
    project: data.tasks?.projects?.name || null,
  } as ScheduledBlock) : null;
};

export const updateScheduledBlock = async (userId: string, blockId: string, updates: Partial<ScheduledBlockInput>): Promise<boolean> => {
  const { error } = await supabase
    .from('scheduled_blocks')
    .update(updates)
    .eq('id', blockId)
    .eq('user_id', userId);

  if (error) {
    console.error("Error updating scheduled block:", error);
    return false;
  }
  return true;
};

export const deleteScheduledBlock = async (userId: string, blockId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('scheduled_blocks')
    .delete()
    .eq('id', blockId)
    .eq('user_id', userId);

  if (error) {
    console.error("Error deleting scheduled block:", error);
    return false;
  }
  return true;
};