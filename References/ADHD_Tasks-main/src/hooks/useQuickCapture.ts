"use client";

import { ParsedTask } from "@/utils/taskParser";
import { supabaseDb } from "@/lib/supabase/index";
import { toast } from "sonner";
import { Project } from "@/lib/supabase/projects"; // Importar Project

interface UseQuickCaptureCallbacks {
  onHabitAdded?: () => void;
  onTaskAddedToProject?: () => void;
  onTaskAddedToInbox?: () => void;
  onTaskAddedToReview?: () => void;
  onNoteAdded?: () => void;
}

export const useQuickCapture = (userId: string | undefined, currentPath: string, callbacks: UseQuickCaptureCallbacks) => {
  const handleQuickCapture = async (item: ParsedTask) => {
    if (!userId) {
      toast.error("Você precisa estar logado para adicionar itens.");
      return;
    }

    let finalProjectId: string | null = null;
    if (item.project) {
      const existingProjects: Project[] = await supabaseDb.getProjects(userId); // Tipar explicitamente
      const existingProject = existingProjects.find((p: Project) => p.name.toLowerCase() === item.project!.toLowerCase()); // Tipar p
      if (existingProject) {
        finalProjectId = existingProject.id;
      } else {
        // CORRIGIDO: Passando todos os campos opcionais como null
        const newProject = await supabaseDb.addProject(userId, { name: item.project, description: null, woop_wish: null, woop_outcome: null, woop_obstacle: null, woop_plan: null, smart_specific: null, smart_measurable: null, smart_achievable: null, smart_relevant: null, smart_time_bound: null });
        if (newProject) {
          finalProjectId = newProject.id;
          toast.success(`Novo projeto "${newProject.name}" criado!`);
        } else {
          toast.error(`Falha ao criar projeto "${item.project}".`);
          return; // Aborta se não conseguir criar o projeto
        }
      }
    }

    if (item.type === 'note') {
      const newNote = await supabaseDb.addNote(userId, {
        content: item.title,
        project_id: finalProjectId, // Usar project_id
        hashtags: item.hashtags,
      });
      if (newNote) {
        callbacks.onNoteAdded?.();
        toast.success(`Anotação adicionada!`);
      } else {
        toast.error("Falha ao adicionar anotação.");
      }
    } else if (item.type === 'habit') {
      const newHabitData = {
        title: item.title,
        project_id: finalProjectId, // Usar project_id
        hashtags: item.hashtags,
        type: 'boolean' as const, // Hábitos de captura rápida são booleanos por padrão
      };
      const newHabit = await supabaseDb.addHabit(userId, newHabitData);
      if (newHabit) {
        callbacks.onHabitAdded?.();
        toast.success(`Hábito "${item.title}" adicionado!`);
      } else {
        toast.error("Falha ao adicionar hábito.");
      }
    } else { // É uma tarefa
      if (currentPath === '/') {
        item.status = 'done_today';
      }

      if (item.status === 'done_today') {
        const newTask = await supabaseDb.addTask(userId, { ...item, project_id: finalProjectId }); // Usar project_id
        if (newTask) {
          callbacks.onTaskAddedToInbox?.();
          toast.success(`Tarefa "${item.title}" adicionada ao Foco do Dia!`);
        } else {
          toast.error("Falha ao adicionar tarefa ao Foco do Dia.");
        }
      } else if (item.project_id || finalProjectId) { // Verificar project_id ou finalProjectId
        const newTask = await supabaseDb.addTask(userId, { ...item, status: 'todo', project_id: finalProjectId }); // Usar project_id
        if (newTask) {
          callbacks.onTaskAddedToProject?.();
          toast.success(`"${item.title}" adicionado ao projeto "${item.project}"!`);
        } else {
          toast.error("Falha ao adicionar tarefa ao projeto.");
        }
      } else if (item.status === 'review') {
        const newReviewTask = await supabaseDb.addTask(userId, { ...item, status: 'review', project_id: finalProjectId }); // Usar project_id
        if (newReviewTask) {
          callbacks.onTaskAddedToReview?.();
          toast.success(`Tarefa "${item.title}" adicionada para revisão!`);
        } else {
          toast.error("Falha ao adicionar tarefa para revisão.");
        }
      } else {
        const newTask = await supabaseDb.addTask(userId, { ...item, status: 'todo', project_id: finalProjectId }); // Usar project_id
        if (newTask) {
          callbacks.onTaskAddedToInbox?.();
          toast.success(`Tarefa "${item.title}" adicionada à caixa de entrada!`);
        } else {
          toast.error("Falha ao adicionar tarefa.");
        }
      }
    }
  };

  return { handleQuickCapture };
};