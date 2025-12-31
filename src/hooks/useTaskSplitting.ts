import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@/types";

export function useTaskSplitting() {
  const [isSplitting, setIsSplitting] = useState(false);
  const [subtasks, setSubtasks] = useState<Record<string, string[]>>({});
  const { toast } = useToast();

  const splitTask = useCallback(async (task: Task) => {
    setIsSplitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('split-task-ai', {
        body: {
          taskTitle: task.title,
          taskDescription: task.description,
          priority: task.priority,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.subtasks && Array.isArray(data.subtasks)) {
        setSubtasks(prev => ({
          ...prev,
          [task.id]: data.subtasks,
        }));
        
        toast({
          title: "Tarefa dividida!",
          description: `${data.subtasks.length} subtarefas sugeridas pela IA`,
        });
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error splitting task:', error);
      toast({
        title: "Erro ao dividir tarefa",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setIsSplitting(false);
    }
  }, [toast]);

  const clearSubtasks = useCallback((taskId: string) => {
    setSubtasks(prev => {
      const newSubtasks = { ...prev };
      delete newSubtasks[taskId];
      return newSubtasks;
    });
  }, []);

  const removeSubtask = useCallback((taskId: string, subtaskIndex: number) => {
    setSubtasks(prev => {
      const taskSubtasks = prev[taskId];
      if (!taskSubtasks) return prev;
      
      const newTaskSubtasks = taskSubtasks.filter((_, i) => i !== subtaskIndex);
      
      if (newTaskSubtasks.length === 0) {
        const newSubtasks = { ...prev };
        delete newSubtasks[taskId];
        return newSubtasks;
      }
      
      return {
        ...prev,
        [taskId]: newTaskSubtasks,
      };
    });
  }, []);

  return {
    isSplitting,
    subtasks,
    splitTask,
    clearSubtasks,
    removeSubtask,
  };
}
