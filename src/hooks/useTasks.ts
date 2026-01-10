import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { Task, EnergyLevel, TaskContext } from '@/types';

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
    isBig3: task.is_big3 || false,
    big3Date: task.big3_date ? new Date(task.big3_date) : undefined,
    // Energy and Context fields
    energyRequired: (task.energy_required as EnergyLevel) || 'medium',
    contexts: (task.contexts as TaskContext[]) || [],
    timeRequiredMinutes: task.time_required_minutes || undefined,
  });

  // Get today's date string for Big 3 comparison
  const getTodayString = () => new Date().toISOString().split('T')[0];

  // Get Big 3 tasks for today
  const big3Tasks = tasks.filter((task) => {
    if (!task.isBig3 || !task.big3Date) return false;
    const taskDateStr = task.big3Date.toISOString().split('T')[0];
    return taskDateStr === getTodayString();
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
          // Energy and Context fields
          energy_required: taskData.energyRequired || 'medium',
          contexts: taskData.contexts || [],
          time_required_minutes: taskData.timeRequiredMinutes || null,
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
        // Energy and Context fields
        energyRequired: (data.energy_required as EnergyLevel) || 'medium',
        contexts: (data.contexts as TaskContext[]) || [],
        timeRequiredMinutes: data.time_required_minutes || undefined,
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
      if (updates.isBig3 !== undefined) dbUpdates.is_big3 = updates.isBig3;
      if (updates.big3Date !== undefined) dbUpdates.big3_date = updates.big3Date?.toISOString().split('T')[0] || null;
      // Energy and Context fields
      if (updates.energyRequired !== undefined) dbUpdates.energy_required = updates.energyRequired;
      if (updates.contexts !== undefined) dbUpdates.contexts = updates.contexts;
      if (updates.timeRequiredMinutes !== undefined) dbUpdates.time_required_minutes = updates.timeRequiredMinutes || null;

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

  // Toggle Big 3 status for a task
  const toggleBig3 = useCallback(async (taskId: string): Promise<boolean> => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return false;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Check if task is already Big 3 today
    const isCurrentlyBig3 = task.isBig3 && task.big3Date && 
      task.big3Date.toISOString().split('T')[0] === todayStr;

    if (isCurrentlyBig3) {
      // Remove from Big 3
      return updateTask(taskId, {
        isBig3: false,
        big3Date: undefined,
      });
    }

    // Check if we already have 3 Big 3 tasks for today
    const todayBig3Count = tasks.filter((t) => {
      if (!t.isBig3 || !t.big3Date) return false;
      return t.big3Date.toISOString().split('T')[0] === todayStr;
    }).length;

    if (todayBig3Count >= 3) {
      toast({
        title: 'Limite atingido',
        description: 'Você já tem 3 tarefas Big 3 para hoje. Remova uma antes de adicionar outra.',
        variant: 'destructive',
      });
      return false;
    }

    // Add to Big 3
    return updateTask(taskId, {
      isBig3: true,
      big3Date: today,
    });
  }, [tasks, updateTask]);

  // Reorder tasks by priority (from comparison modal)
  const reorderTasksByPriority = useCallback(async (sortedTaskIds: string[]): Promise<boolean> => {
    if (!user) return false;

    try {
      // Update each task with its new sort order
      const updates = sortedTaskIds.map((taskId, index) => ({
        id: taskId,
        sort_order: index,
      }));

      // Batch update all tasks
      for (const update of updates) {
        const { error } = await supabase
          .from('mf_tasks')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      // Update local state
      setTasks((prev) => {
        const taskMap = new Map(prev.map(t => [t.id, t]));
        const sortedTasks: Task[] = [];
        
        // Add sorted tasks first
        for (let i = 0; i < sortedTaskIds.length; i++) {
          const task = taskMap.get(sortedTaskIds[i]);
          if (task) {
            sortedTasks.push({ ...task, sortOrder: i });
          }
        }
        
        // Add remaining tasks (not in sorted list)
        for (const task of prev) {
          if (!sortedTaskIds.includes(task.id)) {
            sortedTasks.push(task);
          }
        }
        
        return sortedTasks;
      });

      toast({
        title: 'Tarefas priorizadas!',
        description: 'A ordem das tarefas foi atualizada.',
      });

      return true;
    } catch (error) {
      console.error('Error reordering tasks:', error);
      toast({
        title: 'Erro ao reordenar',
        description: 'Não foi possível salvar a nova ordem.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  return {
    tasks,
    completedTasks,
    big3Tasks,
    loading,
    addTask,
    updateTask,
    completeTask,
    deleteTask,
    addTimeToTask,
    toggleBig3,
    reorderTasksByPriority,
    refetch: fetchTasks,
    fetchCompletedTasks,
  };
};
