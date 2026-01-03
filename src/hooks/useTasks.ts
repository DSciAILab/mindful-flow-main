import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { Task } from '@/types';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Map raw DB data to Task type
  const mapTask = (task: any): Task => ({
    id: task.id,
    title: task.title,
    description: task.description || undefined,
    priority: task.priority as Task['priority'],
    status: task.status as Task['status'],
    tags: task.tags || [],
    points: task.points || 10,
    createdAt: new Date(task.created_at),
    dueDate: task.due_date ? new Date(task.due_date) : undefined,
    completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
    timeSpentMinutes: task.time_spent_minutes || 0,
    estimatedMinutes: task.estimated_minutes || undefined,
    projectId: task.project_id || undefined,
    activityLog: [],
  });

  // Fetch active tasks from Supabase
  const fetchTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('mf_tasks')
        .select('*')
        .eq('user_id', user.id)
        .is('completed_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTasks((data || []).map(mapTask));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Erro ao carregar tarefas',
        description: 'Não foi possível carregar suas tarefas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Fetch completed tasks (last 30 days)
  const fetchCompletedTasks = useCallback(async () => {
    if (!user) {
      setCompletedTasks([]);
      return;
    }

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('mf_tasks')
        .select('*')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .gte('completed_at', thirtyDaysAgo.toISOString())
        .order('completed_at', { ascending: false });

      if (error) throw error;

      setCompletedTasks((data || []).map(mapTask));
    } catch (error) {
      console.error('Error fetching completed tasks:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Add a new task
  const addTask = useCallback(async (taskData: Partial<Task>): Promise<Task | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('mf_tasks')
        .insert({
          user_id: user.id,
          title: taskData.title || 'Nova tarefa',
          description: taskData.description || null,
          priority: taskData.priority || 'medium',
          status: taskData.status || 'next',
          tags: taskData.tags || [],
          points: taskData.points || 10,
          estimated_minutes: taskData.estimatedMinutes || null,
          project_id: taskData.projectId || null,
          due_date: taskData.dueDate?.toISOString() || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description || undefined,
        priority: data.priority as Task['priority'],
        status: data.status as Task['status'],
        tags: data.tags || [],
        points: data.points || 10,
        createdAt: new Date(data.created_at),
        dueDate: data.due_date ? new Date(data.due_date) : undefined,
        timeSpentMinutes: data.time_spent_minutes || 0,
        estimatedMinutes: data.estimated_minutes || undefined,
        projectId: data.project_id || undefined,
        activityLog: [],
      };

      setTasks((prev) => [newTask, ...prev]);
      return newTask;
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: 'Erro ao criar tarefa',
        description: 'Não foi possível criar a tarefa.',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, toast]);

  // Update a task
  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>): Promise<boolean> => {
    if (!user) return false;

    try {
      const dbUpdates: Record<string, unknown> = {};
      
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description || null;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
      if (updates.points !== undefined) dbUpdates.points = updates.points;
      if (updates.timeSpentMinutes !== undefined) dbUpdates.time_spent_minutes = updates.timeSpentMinutes;
      if (updates.estimatedMinutes !== undefined) dbUpdates.estimated_minutes = updates.estimatedMinutes || null;
      if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId || null;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate?.toISOString() || null;
      if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt?.toISOString() || null;

      const { error } = await supabase
        .from('mf_tasks')
        .update(dbUpdates)
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) throw error;

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, ...updates } : task
        )
      );

      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Erro ao atualizar tarefa',
        description: 'Não foi possível atualizar a tarefa.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  // Complete a task
  const completeTask = useCallback(async (taskId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('mf_tasks')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) throw error;

      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      return true;
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: 'Erro ao concluir tarefa',
        description: 'Não foi possível concluir a tarefa.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  // Delete a task
  const deleteTask = useCallback(async (taskId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('mf_tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) throw error;

      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Erro ao excluir tarefa',
        description: 'Não foi possível excluir a tarefa.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  // Update time spent on a task
  const addTimeToTask = useCallback(async (taskId: string, minutes: number): Promise<boolean> => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return false;

    return updateTask(taskId, {
      timeSpentMinutes: task.timeSpentMinutes + minutes,
    });
  }, [tasks, updateTask]);

  return {
    tasks,
    completedTasks,
    loading,
    addTask,
    updateTask,
    completeTask,
    deleteTask,
    addTimeToTask,
    refetch: fetchTasks,
    fetchCompletedTasks,
  };
};
