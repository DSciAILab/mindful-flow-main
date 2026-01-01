"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ParsedTask } from "@/utils/taskParser";
import { supabaseDb } from "@/lib/supabase/index";
import { toast } from "sonner";
import { isToday, parseISO, format, isThisWeek, isPast, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Project } from "@/lib/supabase/projects";
import { ScheduledBlock } from "@/lib/supabase/scheduledBlocks";

export const useInbox = (userId: string | undefined) => {
  const [tasksToDo, setTasksToDo] = useState<ParsedTask[]>([]);
  const [tasksDoneToday, setTasksDoneToday] = useState<ParsedTask[]>([]);
  const [tasksCompleted, setTasksCompleted] = useState<ParsedTask[]>([]);
  const [projectTasks, setProjectTasks] = useState<ParsedTask[]>([]);
  const [completedTasksStats, setCompletedTasksStats] = useState<Record<string, { totalTime: number; interruptions: number; totalBreakTime: number }>>({});
  const [activeTasksStats, setActiveTasksStats] = useState<Record<string, { totalTime: number; interruptions: number; totalBreakTime: number }>>({});
  const [selectedTask, setSelectedTask] = useState<ParsedTask | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  // Alterado de 'today' para 'all'
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'all' | 'overdue'>('all');
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [hashtagsList, setHashtagsList] = useState<string[]>([]);
  const [filterQuery, setFilterQuery] = useState("");

  const loadAllTasks = useCallback(async (isRevalidating = false) => {
    if (!userId) return;
    const [todo, doneToday, completedOrCancelled, projects, allProjects, uniqueHashtags, scheduledBlocksToday] = await Promise.all([
      supabaseDb.getTasks(userId, 'todo'),
      supabaseDb.getTasks(userId, 'done_today'),
      supabaseDb.getInboxHistory(userId), // Modified to fetch completed AND cancelled
      supabaseDb.getProjectTasks(userId),
      supabaseDb.getProjects(userId),
      supabaseDb.getUniqueHashtags(userId),
      supabaseDb.getScheduledBlocks(userId, new Date()),
    ]);

    let currentFocusTasks = [...doneToday];
    const focusTaskIds = new Set(currentFocusTasks.map((t: ParsedTask) => t.id));
    const completedTaskIds = new Set(completedOrCancelled.map((t: ParsedTask) => t.id));
    let currentTodoTasks = [...todo];

    if (currentFocusTasks.length < 3) {
      const slotsToFill = 3 - currentFocusTasks.length;
      const candidateTasks = scheduledBlocksToday
        .map((block: ScheduledBlock) => ({
          ...block.tasks,
          id: block.task_id,
          project_id: block.tasks?.project_id || null,
          project: block.project || null,
        } as ParsedTask))
        .filter((task: ParsedTask) =>
          task &&
          !focusTaskIds.has(task.id) &&
          !completedTaskIds.has(task.id) &&
          currentTodoTasks.some(todoTask => todoTask.id === task.id)
        );

      const tasksToPromote = candidateTasks.slice(0, slotsToFill);

      if (tasksToPromote.length > 0) {
        const updatePromises = tasksToPromote.map((task: ParsedTask) =>
          supabaseDb.updateTask(userId, task.id, { status: 'done_today', priority: 'medium' })
        );
        await Promise.all(updatePromises);

        const promotedTaskIds = new Set(tasksToPromote.map((t: ParsedTask) => t.id));
        currentTodoTasks = currentTodoTasks.filter(t => !promotedTaskIds.has(t.id));
        currentFocusTasks = [...currentFocusTasks, ...tasksToPromote];

        if (!isRevalidating) {
          toast.info(`${tasksToPromote.length} tarefa(s) agendada(s) foram movidas para o Foco do Dia.`);
        }
      }
    }

    setTasksToDo(currentTodoTasks);
    setTasksDoneToday(currentFocusTasks);
    setTasksCompleted(completedOrCancelled); // Now contains both completed and cancelled
    setProjectTasks(projects);
    setProjectsList(allProjects);
    setHashtagsList(uniqueHashtags);

    const allActiveTaskIds = [...currentTodoTasks, ...currentFocusTasks].map(task => task.id);
    const allCompletedTaskIds = completedOrCancelled.map(task => task.id);
    const allRelevantTaskIds = [...new Set([...allActiveTaskIds, ...allCompletedTaskIds])];

    if (allRelevantTaskIds.length > 0) {
      const [timeLogsData, interruptionsData, breakLogsData] = await Promise.all([
        supabaseDb.getTimeLogsForTasks(userId, allRelevantTaskIds),
        supabaseDb.getInterruptionLogsForTasks(userId, allRelevantTaskIds),
        supabaseDb.getBreakLogsForTasks(userId, allRelevantTaskIds),
      ]);

      const stats: Record<string, { totalTime: number; interruptions: number; totalBreakTime: number }> = {};
      allRelevantTaskIds.forEach(id => {
        stats[id] = { totalTime: 0, interruptions: 0, totalBreakTime: 0 };
      });
      timeLogsData.forEach(log => {
        if (stats[log.task_id]) {
          stats[log.task_id].totalTime += log.duration_seconds;
        }
      });
      interruptionsData.forEach(log => {
        if (stats[log.task_id]) {
          stats[log.task_id].interruptions += 1;
        }
      });
      breakLogsData.forEach(log => {
        if (stats[log.task_id]) {
          stats[log.task_id].totalBreakTime += log.duration_seconds;
        }
      });

      const activeStats: Record<string, { totalTime: number; interruptions: number; totalBreakTime: number }> = {};
      allActiveTaskIds.forEach(id => {
        if (stats[id]) activeStats[id] = stats[id];
      });
      setActiveTasksStats(activeStats);

      const completedStats: Record<string, { totalTime: number; interruptions: number; totalBreakTime: number }> = {};
      allCompletedTaskIds.forEach(id => {
        if (stats[id]) completedStats[id] = stats[id];
      });
      setCompletedTasksStats(completedStats);
    } else {
      setActiveTasksStats({});
      setCompletedTasksStats({});
    }
  }, [userId]);

  useEffect(() => {
    loadAllTasks();
  }, [loadAllTasks]);

  const displayTasksToDo = useMemo(() => {
    let filteredTasks = tasksToDo;

    if (filterPeriod === 'today') {
      filteredTasks = filteredTasks.filter(task => task.due_date && isToday(parseISO(task.due_date)));
    } else if (filterPeriod === 'week') {
      filteredTasks = filteredTasks.filter(task => task.due_date && isThisWeek(parseISO(task.due_date), { weekStartsOn: 1, locale: ptBR }));
    } else if (filterPeriod === 'overdue') {
      filteredTasks = filteredTasks.filter(task => task.due_date && isPast(startOfDay(parseISO(task.due_date))) && !isToday(parseISO(task.due_date)));
    }

    if (filterQuery.trim()) {
      const lowercasedQuery = filterQuery.toLowerCase();
      filteredTasks = filteredTasks.filter(task => {
        const titleMatch = task.title.toLowerCase().includes(lowercasedQuery);
        const projectName = projectsList.find(p => p.id === task.project_id)?.name;
        const projectMatch = projectName?.toLowerCase().includes(lowercasedQuery);
        const hashtagMatch = task.hashtags.some(tag => tag.toLowerCase().includes(lowercasedQuery));
        const dateMatch = task.due_date ? format(parseISO(task.due_date), "dd/MM/yyyy").includes(lowercasedQuery) : false;
        return titleMatch || projectMatch || hashtagMatch || dateMatch;
      });
    }

    return filteredTasks;
  }, [tasksToDo, filterPeriod, filterQuery, projectsList]);

  const handleMoveToFocus = async (taskToMove: ParsedTask) => {
    if (!userId) return;
    if (tasksDoneToday.length >= 3) {
      toast.error("Você já tem 3 tarefas no foco do dia. Conclua uma para adicionar outra!");
      return;
    }
    if (tasksDoneToday.some(task => task.id === taskToMove.id)) {
      toast.info("Esta tarefa já está no 'Foco do Dia'.");
      return;
    }

    const success = await supabaseDb.updateTask(userId, taskToMove.id, { status: 'done_today', priority: 'medium' });
    if (success) {
      toast.success(`"${taskToMove.title}" movida para 'Foco do Dia'!`);
      loadAllTasks(true);
    } else {
      toast.error("Falha ao mover tarefa.");
    }
  };

  const handleReturnTaskToToDoList = async (taskToReturn: ParsedTask) => {
    if (!userId) return;
    const success = await supabaseDb.updateTask(userId, taskToReturn.id, { status: 'todo', priority: null });
    if (success) {
      toast.info(`"${taskToReturn.title}" movida de volta para 'Tarefas a Fazer'.`);
      loadAllTasks(true);
    } else {
      toast.error("Falha ao mover tarefa.");
    }
  };

  const handleTaskCompletion = async (taskToComplete: ParsedTask) => {
    if (!userId) return;
    const success = await supabaseDb.updateTask(userId, taskToComplete.id, { status: 'completed' });
    if (success) {
      toast.success(`"${taskToComplete.title}" concluída!`);
      loadAllTasks(true);
    } else {
      toast.error("Falha ao concluir tarefa.");
    }
  };

  const handleTaskDeletion = async (taskToRemove: ParsedTask) => {
    if (!userId) return;
    const success = await supabaseDb.deleteTask(userId, taskToRemove.id);
    if (success) {
      toast.info(`"${taskToRemove.title}" deletada.`);
      loadAllTasks(true);
    } else {
      toast.error("Falha ao deletar tarefa.");
    }
  };

  const handleTaskCancellation = async (taskToCancel: ParsedTask) => {
    if (!userId) return;
    const updatedTask = await supabaseDb.updateTask(userId, taskToCancel.id, { status: 'cancelled' });
    if (updatedTask) {
      toast.warning(`"${taskToCancel.title}" foi marcada como cancelada.`);
      loadAllTasks(true);
      if (selectedTask?.id === taskToCancel.id) {
        setSelectedTask(null);
        setIsSheetOpen(false);
      }
    } else {
      toast.error("Falha ao cancelar tarefa.");
    }
  };

  const handleEditClick = (task: ParsedTask) => {
    setSelectedTask(task);
    setIsSheetOpen(true);
  };

  const handleSaveTaskDetails = async (taskId: string, updates: Partial<ParsedTask>) => {
    if (!userId) return;

    let finalProjectId = updates.project_id;
    if (updates.project && !updates.project_id) {
      const existingProject = projectsList.find(p => p.name.toLowerCase() === updates.project!.toLowerCase());
      if (existingProject) {
        finalProjectId = existingProject.id;
      } else {
        const newProject = await supabaseDb.addProject(userId, {
          name: updates.project,
          description: null,
          woop_wish: null,
          woop_outcome: null,
          woop_obstacle: null,
          woop_plan: null,
          smart_specific: null,
          smart_measurable: null,
          smart_achievable: null,
          smart_relevant: null,
          smart_time_bound: null,
        });
        if (newProject) {
          finalProjectId = newProject.id;
          toast.success(`Novo projeto "${newProject.name}" criado!`);
          loadAllTasks();
        } else {
          toast.error("Falha ao criar novo projeto.");
          return;
        }
      }
    }

    const updatesToSend: Partial<ParsedTask> = { ...updates, project_id: finalProjectId, project: undefined };
    const success = await supabaseDb.updateTask(userId, taskId, updatesToSend);
    if (success) {
      toast.success("Tarefa atualizada com sucesso!");
      setIsSheetOpen(false);
      setSelectedTask(null);
      loadAllTasks();
    } else {
      toast.error("Falha ao salvar alterações na tarefa.");
    }
  };

  const handleDuplicateTask = async (taskToDuplicate: ParsedTask) => {
    if (!userId) {
      toast.error("Você precisa estar logado para duplicar tarefas.");
      return;
    }

    const newTask: Partial<ParsedTask> = {
      title: taskToDuplicate.title,
      description: taskToDuplicate.description,
      project_id: taskToDuplicate.project_id,
      hashtags: [...taskToDuplicate.hashtags],
      priority: taskToDuplicate.priority,
      category: taskToDuplicate.category,
      due_date: null,
      status: 'todo',
    };

    const success = await supabaseDb.addTask(userId, newTask as ParsedTask);
    if (success) {
      toast.success(`Tarefa "${newTask.title}" duplicada com sucesso!`);
      loadAllTasks();
    } else {
      toast.error("Falha ao duplicar tarefa.");
    }
  };

  return {
    displayTasksToDo,
    tasksDoneToday,
    tasksCompleted,
    projectTasks,
    completedTasksStats,
    activeTasksStats,
    filterPeriod,
    setFilterPeriod,
    projectsList,
    hashtagsList,
    filterQuery,
    setFilterQuery,
    loadAllTasks,
    handleMoveToFocus,
    handleReturnTaskToToDoList,
    handleTaskCompletion,
    handleTaskDeletion,
    handleTaskCancellation,
    handleEditClick,
    handleSaveTaskDetails,
    handleDuplicateTask,
    setIsSheetOpen,
    selectedTask,
    isSheetOpen,
    setProjectsList,
  };
};