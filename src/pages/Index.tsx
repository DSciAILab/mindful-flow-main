import { useState, useCallback } from "react";
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
import { QuoteDisplay } from "@/components/dashboard/QuoteDisplay";
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
import { TaskSelectorDialog } from "@/components/dashboard/TaskSelectorDialog";
import { Button } from "@/components/ui/button";
import { useTimer } from "@/hooks/useTimer";
import { useUserStats } from "@/hooks/useUserStats";
import { useToast } from "@/hooks/use-toast";
import { useTaskSplitting } from "@/hooks/useTaskSplitting";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useJournal } from "@/hooks/useJournal";
import { useProfile } from "@/hooks/useProfile";
import { useCaptureItems } from "@/hooks/useCaptureItems";
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
  Trash2
} from "lucide-react";
import type { Task, CaptureItem, JournalEntry, Project } from "@/types";

export default function Index() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  
  // Inbox processing state
  const [processingInboxItem, setProcessingInboxItem] = useState<CaptureItem | null>(null);

  // Focus mode state
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  
  // Task selector dialog state
  const [isTaskSelectorOpen, setIsTaskSelectorOpen] = useState(false);

  const { 
    tasks, 
    loading: tasksLoading, 
    addTask, 
    updateTask, 
    completeTask: completeTaskInDb, 
    deleteTask: deleteTaskInDb,
    addTimeToTask 
  } = useTasks();

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
  
  const {
    items: inboxItems,
    loading: inboxLoading,
    addItem: addCaptureItem,
    deleteItem: deleteCaptureItem,
    markAsProcessed,
  } = useCaptureItems();
  
  const { greetingName } = useProfile();
  
  const { stats, completeTask: addPointsForTask, addFocusTime } = useUserStats();
  const { toast } = useToast();
  const { isSplitting, subtasks, splitTask, removeSubtask } = useTaskSplitting();

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

  const handleSessionComplete = useCallback(() => {
    toast({
      title: "Sessão completa!",
      description: "Ótimo trabalho! Hora de uma pausa.",
    });
  }, [toast]);

  const timer = useTimer({
    onMinutePassed: handleMinutePassed,
    onSessionComplete: handleSessionComplete,
  });

  const handleCapture = async (type: string, content: string) => {
    const item = await addCaptureItem(type as CaptureItem['type'], content);
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
      handleTaskComplete(selectedTask.id);
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
                <div className="space-y-3">
                  {inboxItems.map((item) => (
                    <div 
                      key={item.id}
                      className={cn(
                        "flex items-start gap-3 rounded-xl p-4 transition-all",
                        item.processed ? "bg-muted/30 opacity-60" : "bg-muted/50"
                      )}
                    >
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{item.content}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!item.processed && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setProcessingInboxItem(item)}
                            title="Processar"
                          >
                            <Sparkles className="h-4 w-4 text-primary" />
                          </Button>
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
          <div className="space-y-6">
            <div className="animate-fade-in">
              <h1 className="mb-2 flex items-center gap-3 font-display text-2xl font-semibold text-foreground md:text-3xl">
                <CheckSquare className="h-8 w-8 text-primary" />
                Tarefas
              </h1>
              <p className="text-muted-foreground">
                Gerencie suas tarefas e subtarefas
              </p>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
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
                isSplitting={isSplitting}
                subtasks={subtasks}
              />
            </div>
          </div>
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
            
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Seus Projetos</h2>
              <Button onClick={() => setIsProjectModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Projeto
              </Button>
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
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Left column */}
              <div className="space-y-4 lg:col-span-2">
                <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                  <QuickCapture onCapture={handleCapture} />
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
      />

      <main className="pt-16 md:pl-64">
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
        onStart={timer.start}
        onPause={timer.pause}
        onDone={handleTaskDone}
        onBreak={timer.goToBreak}
        onClearTask={handleClearTask}
      />

      <PanicModeModal 
        isOpen={panicModeOpen} 
        onClose={() => setPanicModeOpen(false)} 
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
        onClose={() => setIsCreateModalOpen(false)}
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
        onCreateNote={(title, content) => {
          // TODO: Implement actual note creation in a notes table if needed
          toast({ 
            title: "Nota salva!", 
            description: "A nota foi criada a partir do inbox (simulação)." 
          });
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
        onClose={() => setIsTaskSelectorOpen(false)}
        tasks={tasks}
        onSelectTask={handleSelectTask}
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
    </div>
  );
}

