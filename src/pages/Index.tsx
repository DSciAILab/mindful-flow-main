import { useState, useCallback, useEffect } from "react";
import { DndContext, DragEndEvent, useSensor, useSensors, MouseSensor, TouchSensor } from "@dnd-kit/core";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { QuickCapture } from "@/components/dashboard/QuickCapture";
import { TimerWidget } from "@/components/dashboard/TimerWidget";
import { FocusTimer } from "@/components/dashboard/FocusTimer";
import { TaskList } from "@/components/dashboard/TaskList";
import { DailyProgress } from "@/components/dashboard/DailyProgress";
import { PanicModeModal } from "@/components/dashboard/PanicModeModal";
import { DailyReflection } from "@/components/dashboard/DailyReflection";
import { InboxPreview } from "@/components/dashboard/InboxPreview";
import { TaskEditModal } from "@/components/dashboard/TaskEditModal";
import { TaskCreateModal } from "@/components/dashboard/TaskCreateModal";
import { ProcessInboxModal } from "@/components/dashboard/ProcessInboxModal";
import { HabitTracker } from "@/components/dashboard/HabitTracker";
import { HabitWidget } from "@/components/dashboard/HabitWidget";
import { FloatingCoach } from "@/components/dashboard/FloatingCoach";
import { FocusMode } from "@/components/dashboard/FocusMode";
import { TimerDashboard } from "@/components/dashboard/TimerDashboard";
import { FullPagePomodoro } from "@/components/dashboard/FullPagePomodoro";
import { QuoteDisplay } from "@/components/dashboard/QuoteDisplay";
import { Big3Widget } from "@/components/dashboard/Big3Widget";
import { TaskPriorityCompareModal } from "@/components/dashboard/TaskPriorityCompareModal";
import { MorningCheckinModal, DailyMissionCard } from "@/components/daily-mission";
import { WellnessReminderToast, StretchGuide, EyeRestTimer } from "@/components/wellness";
import { ProjectCreateModal } from "@/components/projects/ProjectCreateModal";
import { ProjectList } from "@/components/projects/ProjectCard";
import { WheelOfLife } from "@/components/planning/WheelOfLife";
import { YearAtGlance } from "@/components/planning/YearAtGlance";
import { MonthAtGlance } from "@/components/planning/MonthAtGlance";
import { WeekAtGlance } from "@/components/planning/WeekAtGlance";
import { Settings } from "@/components/settings/Settings";
import { KanbanBoard } from "@/components/projects/KanbanBoard";
import { JournalEditor } from "@/components/journal/JournalEditor";
import { JournalList } from "@/components/journal/JournalList";
import { NotesPage } from "@/pages/Notes";
import { SketchPage } from "@/components/canvas/SketchPage";
import { TaskSelectorDialog } from "@/components/dashboard/TaskSelectorDialog";
import { TaskCompleteDialog } from "@/components/dashboard/TaskCompleteDialog";
import { WelcomeDialog } from "@/components/onboarding/WelcomeDialog";
import { Button } from "@/components/ui/button";
import { useTimer } from "@/hooks/useTimer";
import { useUserStats } from "@/hooks/useUserStats";
import { useToast } from "@/hooks/use-toast";
import { useTaskSplitting } from "@/hooks/useTaskSplitting";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useJournal } from "@/hooks/useJournal";
import { useNotes } from "@/hooks/useNotes";
import { useProfile } from "@/hooks/useProfile";
import { useCaptureItems } from "@/hooks/useCaptureItems";
import { useTimerSounds } from "@/hooks/useTimerSounds";
import { useDailyMission } from "@/hooks/useDailyMission";
import { useHabits } from "@/hooks/useHabits";
import { useWellnessReminders } from "@/hooks/useWellnessReminders";
import { useDistractions } from '@/hooks/useDistractions';
import { GamificationProvider, useGamification } from '@/hooks/useGamification';
import { DistractionReviewModal } from '@/components/distractions/DistractionReviewModal';
import { 
  AchievementUnlockedModal, 
  LevelUpModal, 
  GamificationDashboard 
} from '@/components/gamification';
import { cn } from "@/lib/utils";
import { 
  Sparkles, 
  Target, 
  Calendar, 
  Inbox, 
  CheckSquare, 
  FolderKanban, 
  BookOpen, 
  Brain, 
  Lightbulb, 
  BarChart3,
  Plus,
  Trash2,
  ListTodo,
  Pencil,
  Save,
  X,
  Type,
  Mic,
  Camera,
  Clock,
  Scale,
  Trophy
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Textarea } from "@/components/ui/textarea";
import type { Task, CaptureItem, JournalEntry, Project } from "@/types";

export default function Index() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<'fixed' | 'auto-hide'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('app-sidebar-mode') as 'fixed' | 'auto-hide') || 'fixed';
    }
    return 'fixed';
  });
  const [activeView, setActiveView] = useState('dashboard');
  const [panicModeOpen, setPanicModeOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Journal state
  const [isJournalEditing, setIsJournalEditing] = useState(false);
  const [editingJournalEntry, setEditingJournalEntry] = useState<JournalEntry | null>(null);
  
  // Task create modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createTaskProjectId, setCreateTaskProjectId] = useState<string | undefined>();
  
  // Inbox processing state
  const [processingInboxItem, setProcessingInboxItem] = useState<CaptureItem | null>(null);

  // Focus mode state
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  
  // Task selector dialog state
  const [isTaskSelectorOpen, setIsTaskSelectorOpen] = useState(false);
  const [isSelectingForBig3, setIsSelectingForBig3] = useState(false);
  
  // Daily mission check-in skipped state (persisted in sessionStorage)
  const [checkinSkipped, setCheckinSkipped] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('checkin-skipped-today') === 'true';
    }
    return false;
  });
  
  // Profile hook - must be before useEffect that uses it
  const { greetingName, needsWelcome, profile, updateDisplayName } = useProfile();
  
  // Welcome dialog state
  const [showWelcome, setShowWelcome] = useState(false);
  
  // Show welcome dialog when profile loads and needs welcome
  useEffect(() => {
    if (needsWelcome && !showWelcome) {
      setShowWelcome(true);
    }
  }, [needsWelcome, showWelcome]);
  
  // Listen for sidebar mode changes from Settings
  useEffect(() => {
    const handleSidebarModeChange = (event: CustomEvent<'fixed' | 'auto-hide'>) => {
      setSidebarMode(event.detail);
      // If switching to auto-hide, close the sidebar
      if (event.detail === 'auto-hide') {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('sidebar-mode-change', handleSidebarModeChange as EventListener);
    return () => {
      window.removeEventListener('sidebar-mode-change', handleSidebarModeChange as EventListener);
    };
  }, []);
  
  // Task complete celebration state
  const [showTaskComplete, setShowTaskComplete] = useState(false);
  const [completedTaskTitle, setCompletedTaskTitle] = useState<string>();

  const { 
    tasks, 
    loading: tasksLoading, 
    addTask, 
    updateTask, 
    completeTask: completeTaskInDb, 
    deleteTask: deleteTaskInDb,
    addTimeToTask,
    completedTasks,
    fetchCompletedTasks,
    big3Tasks,
    toggleBig3,
    reorderTasksByPriority
  } = useTasks();

  // Priority comparison modal state
  const [isPriorityCompareOpen, setIsPriorityCompareOpen] = useState(false);

  const [showCompletedTasks, setShowCompletedTasks] = useState(false);

  const handleToggleCompletedTasks = () => {
    const newValue = !showCompletedTasks;
    setShowCompletedTasks(newValue);
    if (newValue) {
      fetchCompletedTasks();
    }
  };

  const visibleTasks = showCompletedTasks 
    ? [...tasks, ...completedTasks]
    : tasks;

  const {
    projects,
    addProject,
    updateProject,
    deleteProject,
    loading: projectsLoading
  } = useProjects();
  
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectViewMode, setProjectViewMode] = useState<'cards' | 'minimal'>('minimal');
  
  const handleEditProject = (project: Project) => {
    setProjectToEdit(project);
    setIsProjectModalOpen(true);
  };
  
  const handleProjectModalClose = () => {
    setIsProjectModalOpen(false);
    setProjectToEdit(null);
  };
  
  const handleSaveProject = async (projectData: Partial<Project>) => {
    if (projectToEdit) {
      await updateProject(projectToEdit.id, projectData);
    } else {
      await addProject(projectData);
    }
    handleProjectModalClose();
  };
  
  const {
    entries: journalEntries,
    loading: journalLoading,
    addEntry: addJournalEntry,
    updateEntry: updateJournalEntry,
    deleteEntry: deleteJournalEntry,
  } = useJournal();

  const { addNote } = useNotes();
  
  // Inbox editing state
  const [editingInboxId, setEditingInboxId] = useState<string | null>(null);
  const [editInboxContent, setEditInboxContent] = useState("");

  const {
    items: inboxItems,
    loading: inboxLoading,
    addItem: addCaptureItem,
    deleteItem: deleteCaptureItem,
    markAsProcessed,
    updateItem: updateCaptureItem,
  } = useCaptureItems();
  
  // Daily Mission hook
  const {
    config: missionConfig,
    dailyMission,
    shouldShowCheckinModal,
    saveMorningCheckin,
    updateConfig: updateMissionConfig,
  } = useDailyMission();
  
  // Habits hook for habit completion in daily mission
  const { toggleHabit } = useHabits();

  // Distractions hook for Parking Lot feature
  const {
    distractions,
    captureDistraction,
    convertToTask: convertDistractionToTask,
    moveToInbox: moveDistractionToInbox,
    markAsProcessed: markDistractionProcessed,
    deleteDistraction,
    getSessionDistractions,
  } = useDistractions();
  
  // Focus session tracking for distractions
  const [focusSessionId, setFocusSessionId] = useState<string | undefined>();
  const [showDistractionReview, setShowDistractionReview] = useState(false);

  // State for wellness modals
  const [showStretchGuide, setShowStretchGuide] = useState(false);
  const [showEyeRest, setShowEyeRest] = useState(false);

  const { stats, completeTask: addPointsForTask, addFocusTime } = useUserStats();
  const { toast } = useToast();
  const { isSplitting, subtasks, splitTask, removeSubtask } = useTaskSplitting();
  const { playFocusEndSound, playBreakEndSound } = useTimerSounds();
  
  // Gamification hook
  const {
    pendingAchievements,
    pendingLevelUp,
    showAchievementModal,
    showLevelUpModal,
    dismissAchievementModal,
    dismissLevelUpModal,
  } = useGamification();

  // Journal handlers
  const handleSaveJournalEntry = useCallback(async (entryData: Partial<JournalEntry>) => {
    if (entryData.id) {
      const success = await updateJournalEntry(entryData.id, entryData);
      if (success) {
        toast({
          title: "Entrada atualizada!",
          description: "Sua entrada foi salva com sucesso.",
        });
      }
    } else {
      const newEntry = await addJournalEntry(entryData);
      if (newEntry) {
        toast({
          title: "Entrada criada!",
          description: "Sua nova entrada foi salva.",
        });
      }
    }
    setIsJournalEditing(false);
    setEditingJournalEntry(null);
  }, [addJournalEntry, updateJournalEntry, toast]);

  const handleDeleteJournalEntry = useCallback(async (entryId: string) => {
    const success = await deleteJournalEntry(entryId);
    if (success) {
      toast({
        title: "Entrada excluída",
        description: "A entrada foi removida com sucesso.",
      });
    }
  }, [deleteJournalEntry, toast]);

  const handleSplitTask = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      splitTask(task);
    }
  }, [tasks, splitTask]);

  // Drag and Drop sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && over.id === 'big3-droppable') {
      const taskId = active.id as string;
      const task = tasks.find(t => t.id === taskId);
      
      // Check if already Big 3
      const todayStr = new Date().toISOString().split('T')[0];
      const isBig3Today = task?.isBig3 && task?.big3Date && 
        new Date(task.big3Date).toISOString().split('T')[0] === todayStr;

      if (!isBig3Today) {
        toggleBig3(taskId);
        toast({
          title: "Adicionado ao Big 3!",
          description: "Tarefa definida como prioridade do dia.",
        });
      }
    }
  }, [tasks, toggleBig3, toast]);

  const handleConvertSubtask = useCallback(async (parentTaskId: string, subtaskTitle: string, subtaskIndex: number) => {
    const parentTask = tasks.find(t => t.id === parentTaskId);
    if (!parentTask) return;

    const newTask = await addTask({
      title: subtaskTitle,
      priority: parentTask.priority === 'urgent' ? 'high' : parentTask.priority,
      status: 'next',
      tags: parentTask.tags,
      points: Math.max(5, Math.floor(parentTask.points / 3)),
    });

    if (newTask) {
      removeSubtask(parentTaskId, subtaskIndex);
      toast({
        title: "Tarefa criada!",
        description: `"${subtaskTitle}" foi adicionada à lista`,
      });
    }
  }, [tasks, addTask, removeSubtask, toast]);

  const handleMinutePassed = useCallback(() => {
    if (selectedTask) {
      addTimeToTask(selectedTask.id, 1);
      setSelectedTask(prev => prev ? { ...prev, timeSpentMinutes: prev.timeSpentMinutes + 1 } : null);
      addFocusTime(1);
    }
  }, [selectedTask, addTimeToTask, addFocusTime]);

  const handleSessionComplete = useCallback((type: 'focus' | 'break' = 'focus') => {
    // Play appropriate sound based on session type
    if (type === 'focus') {
      playFocusEndSound();
      
      // Check if there are unprocessed distractions from this session
      const sessionDistractions = focusSessionId 
        ? getSessionDistractions(focusSessionId).filter(d => !d.processed)
        : distractions.filter(d => !d.processed);
      
      if (sessionDistractions.length > 0) {
        // Trigger review modal after a short delay
        setTimeout(() => setShowDistractionReview(true), 500);
      }
    } else {
      playBreakEndSound();
    }
    
    toast({
      title: type === 'focus' ? "Sessão completa!" : "Pausa terminada!",
      description: type === 'focus' ? "Ótimo trabalho! Hora de uma pausa." : "Vamos voltar ao foco!",
    });
  }, [toast, playFocusEndSound, playBreakEndSound, focusSessionId, getSessionDistractions, distractions]);

  const timer = useTimer({
    onMinutePassed: handleMinutePassed,
    onSessionComplete: handleSessionComplete,
  });

  // Wellness reminders hook - pass timer.isRunning to pause during focus
  const {
    activeReminder,
    handleComplete: handleWellnessComplete,
    handleSnooze: handleWellnessSnooze,
    handleDismiss: handleWellnessDismiss,
  } = useWellnessReminders({ isFocusRunning: timer.isRunning });

  const handleCapture = async (type: string, content: string, audioUrl?: string, projectId?: string) => {
    // Check for direct conversion intents
    if (content.startsWith("Task:")) {
      const cleanTitle = content
        .replace("Task:", "")
        .replace(/\[Project: .*?\]/, "") // Remove project tag if present in filtered content
        .trim();
        
      const newTask = await addTask({
        title: cleanTitle || "Nova Tarefa",
        description: audioUrl ? `Áudio anexado: ${audioUrl}` : undefined,
        projectId: projectId,
        priority: "medium",
        status: "next" // Default status
      });

      if (newTask) {
        toast({
          title: "Tarefa criada!",
          description: `"${newTask.title}" foi adicionada às suas tarefas.`,
        });
      }
      return;
    }

    // Check for Note: prefix - redirect directly to notes (not inbox)
    if (content.startsWith("Note:")) {
      const cleanTitle = content
        .replace("Note:", "")
        .replace(/\[Project: .*?\]/, "")
        .trim();
        
      const newNote = await addNote({
        title: cleanTitle || `Nota - ${new Date().toLocaleString()}`,
        content: audioUrl ? `Áudio anexado: ${audioUrl}` : undefined,
        area_id: "personal",
        audio_url: audioUrl,
        project_id: projectId,
      });

      if (newNote) {
        toast({
          title: "Nota criada!",
          description: `"${newNote.title}" foi salva nas suas notas.`,
        });
      }
      return;
    }

    // Default: Add to Inbox
    const item = await addCaptureItem(type as CaptureItem['type'], content, audioUrl);
    if (item) {
      toast({
        title: "Capturado!",
        description: "Sua ideia foi salva no Inbox.",
      });
    }
  };

  const handleDeleteInboxItem = async (id: string) => {
    const success = await deleteCaptureItem(id);
    if (success) {
      toast({
        title: "Item excluído",
        description: "O item foi removido do Inbox.",
      });
    }
  };

  const handleTaskComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const bonusPoints = Math.floor(task.timeSpentMinutes / 10);
      const totalPoints = task.points + bonusPoints;
      
      const success = await completeTaskInDb(taskId);
      if (success) {
        addPointsForTask(totalPoints);
        
        if (selectedTask?.id === taskId) {
          setSelectedTask(null);
          timer.resetAll();
        }
        
        toast({
          title: `+${totalPoints} pontos!`,
          description: bonusPoints > 0 
            ? `Tarefa concluída! (+${bonusPoints} bônus por tempo de foco)`
            : "Tarefa concluída com sucesso!",
        });
      }
    }
  };

  const handleTaskDone = () => {
    if (selectedTask) {
      // Show celebration before completing
      setCompletedTaskTitle(selectedTask.title);
      setShowTaskComplete(true);
    }
  };
  
  const handleTaskCompleteClose = () => {
    setShowTaskComplete(false);
    if (selectedTask) {
      handleTaskComplete(selectedTask.id);
      setSelectedTask(null);
      timer.resetAll();
    }
  };

  const handleSelectTask = (task: Task) => {
    if (timer.isRunning) {
      timer.pause();
    }
    setSelectedTask(task);
    timer.resetAll();
    toast({
      title: "Tarefa selecionada",
      description: `Pronto para focar em: ${task.title}`,
    });
  };

  const handleClearTask = () => {
    if (timer.isRunning) {
      timer.pause();
    }
    setSelectedTask(null);
    timer.resetAll();
  };

  const handleReflectionComplete = (reflection: { mood: number; gratitude: string }) => {
    toast({
      title: "Reflexão salva!",
      description: "Seu momento de autocuidado foi registrado.",
    });
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleSaveTask = async (updatedTask: Task) => {
    const success = await updateTask(updatedTask.id, updatedTask);
    if (success) {
      toast({
        title: "Tarefa atualizada!",
        description: "Suas alterações foram salvas.",
      });
    }
  };
  const handleStartEditInbox = (item: CaptureItem) => {
    setEditingInboxId(item.id);
    setEditInboxContent(item.content);
  };

  const handleSaveEditInbox = (id: string) => {
    if (updateCaptureItem) {
      updateCaptureItem(id, editInboxContent);
    }
    setEditingInboxId(null);
  };

  const handleCancelEditInbox = () => {
    setEditingInboxId(null);
  };
  
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };
  const handleDeleteTask = async (taskId: string) => {
    const success = await deleteTaskInDb(taskId);
    if (success) {
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
        timer.resetAll();
      }
      toast({
        title: "Tarefa excluída",
        description: "A tarefa foi removida com sucesso.",
      });
    }
  };

  const dailyGoals = {
    tasks: 8,
    focusMinutes: 180,
  };

  const renderContent = () => {
    switch (activeView) {
      case 'inbox':
        return (
          <div className="space-y-6">
            <div className="animate-fade-in">
              <h1 className="mb-2 flex items-center gap-3 font-display text-2xl font-semibold text-foreground md:text-3xl">
                <Inbox className="h-8 w-8 text-primary" />
                Inbox
              </h1>
              <p className="text-muted-foreground">
                Capture tudo aqui, processe depois
              </p>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <QuickCapture onCapture={handleCapture} />
            </div>
            <div className="animate-fade-in rounded-2xl border border-border/50 bg-card p-6 shadow-card" style={{ animationDelay: '200ms' }}>
              <h3 className="mb-4 font-semibold text-foreground">Itens para processar</h3>
              {inboxItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Inbox vazio! 🎉</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {inboxItems.map((item) => (
                    <div 
                      key={item.id}
                      className={cn(
                        "flex items-start gap-3 rounded-xl p-4 transition-all",
                        item.processed ? "bg-muted/30 opacity-60" : "bg-muted/50"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        {editingInboxId === item.id ? (
                           <div className="space-y-2">
                              <Textarea 
                                value={editInboxContent}
                                onChange={(e) => setEditInboxContent(e.target.value)}
                                className="min-h-[100px] bg-background"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleSaveEditInbox(item.id)} className="h-7 px-2">
                                  <Save className="mr-1 h-3 w-3" /> Salvar
                                </Button>
                                <Button size="sm" variant="ghost" onClick={handleCancelEditInbox} className="h-7 px-2">
                                  <X className="mr-1 h-3 w-3" /> Cancelar
                                </Button>
                              </div>
                           </div>
                        ) : (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown
                              components={{
                                img: ({node, ...props}) => (
                                  <img 
                                    {...props} 
                                    className="rounded-lg max-h-60 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity my-2 border border-border" 
                                    onClick={() => props.src && window.open(props.src, '_blank')} 
                                  />
                                )
                              }}
                            >
                              {item.content}
                            </ReactMarkdown>
                          </div>
                        )}
                        
                        {item.audioUrl && (
                          <div className="mt-2">
                             <audio src={item.audioUrl} controls className="h-8 w-full max-w-[200px]" />
                          </div>
                        )}
                        <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {item.createdAt.toLocaleDateString('pt-BR')} às {item.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!item.processed && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setProcessingInboxItem(item)}
                              title="Processar"
                            >
                              <Sparkles className="h-4 w-4 text-primary" />
                            </Button>
                            {!editingInboxId && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStartEditInbox(item)}
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                              </Button>
                            )}
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteInboxItem(item.id)}
                          className="text-muted-foreground hover:text-destructive"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'tasks':
        return (
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="space-y-6">
            <div className="animate-fade-in flex items-start justify-between">
              <div>
                <h1 className="mb-2 flex items-center gap-3 font-display text-2xl font-semibold text-foreground md:text-3xl">
                  <CheckSquare className="h-8 w-8 text-primary" />
                  Tarefas
                </h1>
                <p className="text-muted-foreground">
                  Gerencie suas tarefas e subtarefas
                </p>
              </div>
              {tasks.filter(t => !t.completedAt).length >= 2 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPriorityCompareOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Scale className="h-4 w-4" />
                  Priorizar
                </Button>
              )}
            </div>
            
            {/* Big 3 Widget - espelho do dashboard */}
            <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <Big3Widget 
                big3Tasks={big3Tasks} 
                onSelectTask={handleSelectTask}
                onToggleBig3={toggleBig3}
                onAddBig3={() => {
                  setIsSelectingForBig3(true);
                  setIsTaskSelectorOpen(true);
                }}
              />
            </div>
            
            <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <TaskList 
                tasks={visibleTasks}
                showCompleted={showCompletedTasks}
                onToggleCompleted={handleToggleCompletedTasks}
                selectedTaskId={selectedTask?.id || null}
                onComplete={handleTaskComplete}
                onSelectTask={handleSelectTask}
                onAddTask={() => setIsCreateModalOpen(true)}
                onDeleteTask={handleDeleteTask}
                onSplitTask={handleSplitTask}
                onConvertSubtask={handleConvertSubtask}
                onEditTask={handleEditTask}
                isSplitting={isSplitting}
                subtasks={subtasks}
              />
            </div>

            {/* Priority Compare Modal */}
            <TaskPriorityCompareModal
              isOpen={isPriorityCompareOpen}
              onClose={() => setIsPriorityCompareOpen(false)}
              tasks={tasks.filter(t => !t.completedAt)}
              onComplete={reorderTasksByPriority}
            />
          </div>
          </DndContext>
        );

      case 'habits':
        return (
          <div className="animate-fade-in">
            <HabitTracker />
          </div>
        );

      case 'projects':
        return (
          <div className="space-y-6">
            <div className="animate-fade-in">
              <h1 className="mb-2 flex items-center gap-3 font-display text-2xl font-semibold text-foreground md:text-3xl">
                <FolderKanban className="h-8 w-8 text-primary" />
                Projetos & Tarefas
              </h1>
              <p className="text-muted-foreground">
                Gerencie seus projetos e acompanhe o progresso das tarefas
              </p>
            </div>
            
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Seus Projetos</h2>
              <div className="flex items-center gap-2">
                {/* View mode toggle - single icon */}
                <button
                  onClick={() => setProjectViewMode(projectViewMode === 'minimal' ? 'cards' : 'minimal')}
                  className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title={projectViewMode === 'minimal' ? 'Visualizar cards' : 'Visualizar lista'}
                >
                  {projectViewMode === 'minimal' ? (
                    <FolderKanban className="h-4 w-4" />
                  ) : (
                    <ListTodo className="h-4 w-4" />
                  )}
                </button>
                <Button onClick={() => setIsProjectModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Projeto
                </Button>
              </div>
            </div>

            <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <ProjectList
                projects={projects}
                tasks={tasks}
                selectedProjectId={selectedProjectId}
                onSelectProject={setSelectedProjectId}
                onEditProject={handleEditProject}
                onDeleteProject={deleteProject}
                onEditTask={(task) => {
                  setEditingTask(task);
                  setIsEditModalOpen(true);
                }}
                onAddTask={(projectId) => {
                  setCreateTaskProjectId(projectId);
                  setIsCreateModalOpen(true);
                }}
                viewMode={projectViewMode}
              />
            </div>

            <div className="animate-fade-in space-y-4" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {selectedProjectId 
                    ? `Tarefas: ${projects.find(p => p.id === selectedProjectId)?.name}`
                    : "Todas as Tarefas"
                  }
                </h2>
              </div>
              
              <KanbanBoard 
                tasks={selectedProjectId ? tasks.filter(t => t.projectId === selectedProjectId) : tasks}
                onTaskMove={async (taskId, newStatus) => {
                  const success = await updateTask(taskId, { status: newStatus as Task['status'] });
                  if (success) {
                    toast({
                      title: "Tarefa movida!",
                      description: `Status atualizado com sucesso`,
                    });
                  }
                }}
                onTaskClick={(task) => handleSelectTask(task)}
              />
            </div>
          </div>
        );

      case 'goals':
        return (
          <div className="space-y-6">
            <div className="animate-fade-in">
              <h1 className="mb-2 flex items-center gap-3 font-display text-2xl font-semibold text-foreground md:text-3xl">
                <Target className="h-8 w-8 text-primary" />
                Objetivos & Planejamento
              </h1>
              <p className="text-muted-foreground">
                Visualize e planeje sua vida com clareza
              </p>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <WheelOfLife onSave={() => toast({ title: "Roda da Vida salva!" })} />
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <YearAtGlance />
            </div>
          </div>
        );
      
      case 'calendar':
        return (
          <div className="space-y-6">
            <div className="animate-fade-in">
              <h1 className="mb-2 flex items-center gap-3 font-display text-2xl font-semibold text-foreground md:text-3xl">
                <Calendar className="h-8 w-8 text-primary" />
                Agenda & Planejamento
              </h1>
              <p className="text-muted-foreground">
                Visualize seu tempo em diferentes perspectivas
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="animate-fade-in lg:col-span-2" style={{ animationDelay: '100ms' }}>
                <WeekAtGlance />
              </div>
              <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                <MonthAtGlance />
              </div>
              <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
                <YearAtGlance />
              </div>
            </div>
          </div>
        );

      case 'notes':
        return (
          <div className="animate-fade-in">
            <NotesPage />
          </div>
        );

      case 'canvas':
        return (
          <div className="animate-fade-in">
            <SketchPage />
          </div>
        );

      case 'journal':
        return (
          <div className="space-y-6">
            <div className="animate-fade-in">
              <h1 className="mb-2 flex items-center gap-3 font-display text-2xl font-semibold text-foreground md:text-3xl">
                <BookOpen className="h-8 w-8 text-primary" />
                Diário
              </h1>
              <p className="text-muted-foreground">
                Registre seus pensamentos e experiências
              </p>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              {isJournalEditing ? (
                <JournalEditor
                  entry={editingJournalEntry}
                  onSave={handleSaveJournalEntry}
                  onCancel={() => {
                    setIsJournalEditing(false);
                    setEditingJournalEntry(null);
                  }}
                />
              ) : (
                <JournalList
                  entries={journalEntries}
                  loading={journalLoading}
                  onCreateNew={() => {
                    setEditingJournalEntry(null);
                    setIsJournalEditing(true);
                  }}
                  onEdit={(entry) => {
                    setEditingJournalEntry(entry);
                    setIsJournalEditing(true);
                  }}
                  onDelete={handleDeleteJournalEntry}
                />
              )}
            </div>
          </div>
        );

      case 'reflection':
        return (
          <div className="space-y-6">
            <div className="animate-fade-in">
              <h1 className="mb-2 flex items-center gap-3 font-display text-2xl font-semibold text-foreground md:text-3xl">
                <Brain className="h-8 w-8 text-primary" />
                Reflexões
              </h1>
              <p className="text-muted-foreground">
                Momento de autocuidado e autoconhecimento
              </p>
            </div>
            <div className="mx-auto max-w-lg animate-fade-in" style={{ animationDelay: '100ms' }}>
              <DailyReflection onComplete={handleReflectionComplete} />
            </div>
          </div>
        );

      case 'ideas':
        return (
          <div className="space-y-6">
            <div className="animate-fade-in">
              <h1 className="mb-2 flex items-center gap-3 font-display text-2xl font-semibold text-foreground md:text-3xl">
                <Lightbulb className="h-8 w-8 text-primary" />
                Ideias
              </h1>
              <p className="text-muted-foreground">
                Capture e organize suas ideias criativas
              </p>
            </div>
            <div className="animate-fade-in rounded-2xl border border-border/50 bg-card p-8 text-center shadow-card" style={{ animationDelay: '100ms' }}>
              <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 font-semibold text-foreground">Em breve</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                O banco de ideias estará disponível em breve
              </p>
            </div>
          </div>
        );

      case 'reports':
        return (
          <div className="space-y-6">
            <div className="animate-fade-in">
              <h1 className="mb-2 flex items-center gap-3 font-display text-2xl font-semibold text-foreground md:text-3xl">
                <BarChart3 className="h-8 w-8 text-primary" />
                Estatísticas de Foco
              </h1>
              <p className="text-muted-foreground">
                Acompanhe seu progresso e produtividade
              </p>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <TimerDashboard />
            </div>
          </div>
        );

      case 'pomodoro':
        return (
          <FullPagePomodoro 
            onExit={() => setActiveView('dashboard')}
          />
        );

      case 'achievements':
        return (
          <div className="space-y-6">
            <div className="animate-fade-in">
              <GamificationDashboard 
                stats={{
                  tasksCompleted: stats.tasksCompletedToday + (completedTasks?.length || 0),
                  focusMinutesTotal: stats.focusMinutesToday,
                  currentStreak: stats.currentStreak,
                  longestStreak: stats.longestStreak,
                  habitsCompletedStreak: 0, // TODO: Get from habits hook
                  hasPanicModeSurvived: false,
                  hasEarlyBirdTask: false,
                  hasNightOwlTask: false,
                }}
              />
            </div>
          </div>
        );

      case 'settings':
        return <Settings onThemeChange={() => toast({ title: "Tema atualizado!" })} />;

      case 'dashboard':
      default:
        return (
          <>
            {/* Welcome section */}
            <div className="mb-6 animate-fade-in">
              <h1 className="flex items-center gap-3 font-display text-2xl font-semibold text-foreground md:text-3xl">
                <Sparkles className="h-8 w-8 text-primary" />
                {greetingName 
                  ? `Olá, ${greetingName}! Vamos conquistar o dia?`
                  : 'Olá! Vamos conquistar o dia?'
                }
              </h1>
              <p className="text-muted-foreground">
                {new Date().toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </p>
            </div>

            {/* Main grid */}
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Left column */}
              <div className="space-y-4 lg:col-span-2">
                {/* Daily Mission Card - shows at top if enabled */}
                {missionConfig?.showOnStartup && (
                  <div className="animate-fade-in" style={{ animationDelay: '50ms' }}>
                    <DailyMissionCard
                      mission={dailyMission}
                      onTaskComplete={handleTaskComplete}
                      onHabitComplete={(habitId) => toggleHabit(habitId, new Date())}
                      onViewAll={() => setActiveView('tasks')}
                      onSelectTask={handleSelectTask}
                    />
                  </div>
                )}
                
                <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                  <QuickCapture onCapture={handleCapture} />
                </div>
                
                <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
                  <Big3Widget 
                    big3Tasks={big3Tasks} 
                    onSelectTask={handleSelectTask}
                    onToggleBig3={toggleBig3}
                    onAddBig3={() => {
                      setIsSelectingForBig3(true);
                      setIsTaskSelectorOpen(true);
                    }}
                  />
                </div>

                <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                  <TaskList 
                    tasks={tasks}
                    selectedTaskId={selectedTask?.id || null}
                    onComplete={handleTaskComplete}
                    onSelectTask={handleSelectTask}
                    onAddTask={() => setIsCreateModalOpen(true)}
                    onDeleteTask={handleDeleteTask}
                    onSplitTask={handleSplitTask}
                    onConvertSubtask={handleConvertSubtask}
                    onEditTask={handleEditTask}
                    onToggleBig3={toggleBig3}
                    isSplitting={isSplitting}
                    subtasks={subtasks}
                  />
                </div>

                <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
                  <InboxPreview 
                    items={inboxItems}
                    onViewAll={() => setActiveView('inbox')}
                    onProcess={(item) => setProcessingInboxItem(item)}
                    onDelete={handleDeleteInboxItem}
                    onUpdate={(id, content) => updateCaptureItem && updateCaptureItem(id, content)}
                  />
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
                  <TimerWidget 
                    formattedTime={timer.formattedTime}
                    progress={timer.progress}
                    isRunning={timer.isRunning}
                    isPaused={timer.isPaused}
                    type={timer.type}
                    sessionsCompleted={timer.sessionsCompleted}
                    totalBreakTime={timer.totalBreakTime}
                    selectedTask={selectedTask}
                    onStart={timer.start}
                    onPause={timer.pause}
                    onDone={handleTaskDone}
                    onBreak={timer.goToBreak}
                    onClearTask={handleClearTask}
                    onRequestTaskSelection={() => setIsTaskSelectorOpen(true)}
                  />
                </div>

                <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                  <HabitWidget />
                </div>

                <div className="animate-fade-in" style={{ animationDelay: '250ms' }}>
                  <DailyProgress stats={stats} dailyGoals={dailyGoals} />
                </div>

                <div className="animate-fade-in" style={{ animationDelay: '350ms' }}>
                  <DailyReflection onComplete={handleReflectionComplete} />
                </div>
              </div>
            </div>
            </DndContext>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        stats={stats} 
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        onPanicMode={() => setPanicModeOpen(true)}
      />
      
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeView={activeView}
        onViewChange={setActiveView}
        mode={sidebarMode}
      />

      <main className={cn(
        "pt-16 transition-all duration-300",
        sidebarMode === 'fixed' ? "md:pl-64" : "md:pl-0"
      )}>
        <div className="container mx-auto max-w-6xl p-4 md:p-6">
          {renderContent()}
        </div>
      </main>

      {/* Focus Timer - fullscreen immersive mode with minimize option */}
      <FocusTimer
        formattedTime={timer.formattedTime}
        progress={timer.progress}
        isRunning={timer.isRunning}
        isPaused={timer.isPaused}
        type={timer.type}
        sessionsCompleted={timer.sessionsCompleted}
        selectedTask={selectedTask}
        focusSessionId={focusSessionId}
        onStart={timer.start}
        onPause={timer.pause}
        onDone={handleTaskDone}
        onBreak={timer.goToBreak}
        onClearTask={handleClearTask}
        onSkipToFocus={timer.skipToFocus}
        onCaptureDistraction={async (content) => {
          await captureDistraction(content, selectedTask?.id, focusSessionId);
        }}
      />

      <PanicModeModal 
        isOpen={panicModeOpen} 
        onClose={() => setPanicModeOpen(false)} 
      />

      {/* Morning Check-in Modal */}
      <MorningCheckinModal
        isOpen={shouldShowCheckinModal && !checkinSkipped}
        onComplete={async (energy, mood, sleep, notes) => {
          await saveMorningCheckin(energy, mood, sleep, notes);
        }}
        onSkip={() => {
          setCheckinSkipped(true);
          sessionStorage.setItem('checkin-skipped-today', 'true');
        }}
      />

      <TaskEditModal
        task={editingTask}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />

      <TaskCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateTaskProjectId(undefined);
        }}
        onSave={async (taskData) => {
          const newTask = await addTask(taskData);
          if (newTask) {
            toast({
              title: "Tarefa criada!",
              description: `"${newTask.title}" foi adicionada à lista.`,
            });
          }
          return newTask;
        }}
        defaultProjectId={createTaskProjectId}
      />

      <ProcessInboxModal
        item={processingInboxItem}
        isOpen={!!processingInboxItem}
        onClose={() => setProcessingInboxItem(null)}
        onCreateTask={async (title, description, priority) => {
          const newTask = await addTask({
            title,
            description,
            priority,
            status: "next",
            tags: [],
            estimatedMinutes: 25,
          });
          if (newTask) {
            toast({
              title: "Tarefa criada!",
              description: `"${newTask.title}" foi criada a partir do inbox.`,
            });
          }
        }}

        onCreateProject={async (name, description) => {
          const newProject = await addProject({ name, description });
          if (newProject) {
            toast({
              title: "Projeto criado!",
              description: `"${newProject.name}" foi criado a partir do inbox.`,
            });
          }
        }}
        onMarkProcessed={(id) => {
          markAsProcessed(id);
        }}
        projects={projects}
        onCreateNote={async (title, content, projectId) => {
          const newNote = await addNote({
            title,
            content,
            area_id: 'default', // TODO: Handle area selection or default
            project_id: projectId,
            tags: [],
          });
          if (newNote) {
            toast({
              title: "Nota criada!",
              description: projectId 
                ? `Nota criada e vinculada ao projeto.` 
                : "Nota criada com sucesso.",
            });
          }
        }}
      />

      <ProjectCreateModal
        isOpen={isProjectModalOpen}
        onClose={handleProjectModalClose}
        onSave={handleSaveProject}
        projectToEdit={projectToEdit}
      />

      {/* FloatingCoach AI Assistant */}
      <FloatingCoach />

      {/* Task Selector Dialog */}
      <TaskSelectorDialog
        isOpen={isTaskSelectorOpen}
        onClose={() => {
          setIsTaskSelectorOpen(false);
          setIsSelectingForBig3(false);
        }}
        tasks={tasks}
        onSelectTask={(task) => {
          if (isSelectingForBig3) {
            toggleBig3(task.id);
            toast({
              title: "Adicionado ao Big 3!",
              description: "Foque no que é importante.",
            });
          } else {
            handleSelectTask(task);
          }
          setIsTaskSelectorOpen(false);
          setIsSelectingForBig3(false);
        }}
      />

      {/* Welcome Dialog */}
      <WelcomeDialog
        isOpen={showWelcome}
        userId={profile?.id || ""}
        currentEmail={profile?.displayName || ""}
        onComplete={(displayName) => {
          updateDisplayName(displayName);
          setShowWelcome(false);
        }}
      />

      {/* Task Complete Celebration */}
      <TaskCompleteDialog
        isOpen={showTaskComplete}
        onClose={handleTaskCompleteClose}
        taskTitle={completedTaskTitle}
        xpEarned={10}
        sessionsCompleted={timer.sessionsCompleted}
      />

      {/* FocusMode Fullscreen */}
      <FocusMode
        isOpen={isFocusModeOpen}
        onClose={() => setIsFocusModeOpen(false)}
        formattedTime={timer.formattedTime}
        progress={timer.progress}
        isRunning={timer.isRunning}
        isPaused={timer.isPaused}
        type={timer.type}
        sessionsCompleted={timer.sessionsCompleted}
        selectedTask={selectedTask}
        onStart={timer.start}
        onPause={timer.pause}
        onDone={handleTaskDone}
        onBreak={timer.goToBreak}
      />

      {/* Wellness Reminder Toast */}
      {activeReminder && (
        <WellnessReminderToast
          reminder={activeReminder}
          onComplete={() => {
            // Open specific modal if it's stretch or eyes
            if (activeReminder.type === 'stretch') {
              setShowStretchGuide(true);
            } else if (activeReminder.type === 'eyes') {
              setShowEyeRest(true);
            }
            handleWellnessComplete();
          }}
          onSnooze={handleWellnessSnooze}
          onDismiss={handleWellnessDismiss}
        />
      )}

      {/* Stretch Guide Modal */}
      <StretchGuide
        isOpen={showStretchGuide}
        onComplete={() => setShowStretchGuide(false)}
        onSkip={() => setShowStretchGuide(false)}
      />

      {/* Eye Rest Timer Modal */}
      <EyeRestTimer
        isOpen={showEyeRest}
        onComplete={() => setShowEyeRest(false)}
      />

      {/* Distraction Review Modal - shown after focus session with captured thoughts */}
      <DistractionReviewModal
        isOpen={showDistractionReview}
        distractions={distractions}
        onClose={() => setShowDistractionReview(false)}
        onProcessAll={async (actions) => {
          for (const [id, action] of actions) {
            if (action === 'task') {
              await convertDistractionToTask(id, async (title) => {
                const newTask = await addTask({
                  title,
                  priority: 'medium',
                  status: 'inbox',
                });
                return newTask;
              });
            } else if (action === 'inbox') {
              await moveDistractionToInbox(id, addCaptureItem);
            } else if (action === 'delete') {
              await deleteDistraction(id);
            } else if (action === 'processed') {
              await markDistractionProcessed(id);
            }
          }
          setShowDistractionReview(false);
        }}
      />

      {/* Achievement Unlocked Modal */}
      <AchievementUnlockedModal
        achievement={pendingAchievements[0] || null}
        isOpen={showAchievementModal && pendingAchievements.length > 0}
        onClose={dismissAchievementModal}
      />

      {/* Level Up Modal */}
      <LevelUpModal
        previousLevel={pendingLevelUp?.previousLevel || null}
        newLevel={pendingLevelUp?.newLevel || null}
        isOpen={showLevelUpModal && !!pendingLevelUp}
        onClose={dismissLevelUpModal}
      />
    </div>
  );
}
