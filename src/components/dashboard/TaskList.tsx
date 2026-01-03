import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Circle, 
  CheckCircle2, 
  Clock, 
  Star,
  Plus,
  Play,
  Timer,
  AlertCircle,
  Zap,
  Flag,
  Leaf,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
  Trash2,
  FolderKanban
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task, Priority, Project } from "@/types";
import { useProjects } from "@/hooks/useProjects";
import { LifeAreaBadge } from "@/components/ui/LifeAreaBadge";

interface TaskListProps {
  tasks: Task[];
  selectedTaskId: string | null;
  onComplete: (taskId: string) => void;
  onSelectTask: (task: Task) => void;
  onAddTask: () => void;
  onDeleteTask?: (taskId: string) => void;
  onSplitTask?: (taskId: string) => void;
  onConvertSubtask?: (parentTaskId: string, subtaskTitle: string, subtaskIndex: number) => void;
  onEditTask?: (task: Task) => void;
  isSplitting?: boolean;
  subtasks?: Record<string, string[]>;
}

const priorityConfig: Record<Priority, { color: string; label: string; bgColor: string; icon: React.ElementType }> = {
  urgent: { color: 'text-priority-urgent', label: 'Urgente', bgColor: 'bg-priority-urgent/10', icon: AlertCircle },
  high: { color: 'text-priority-high', label: 'Alta', bgColor: 'bg-priority-high/10', icon: Zap },
  medium: { color: 'text-priority-medium', label: 'Média', bgColor: 'bg-priority-medium/10', icon: Flag },
  low: { color: 'text-priority-low', label: 'Baixa', bgColor: 'bg-priority-low/10', icon: Leaf },
};

export function TaskList({ 
  tasks, 
  selectedTaskId, 
  onComplete, 
  onSelectTask, 
  onAddTask,
  onDeleteTask,
  onSplitTask,
  onConvertSubtask,
  onEditTask,
  isSplitting,
  subtasks = {},
}: TaskListProps) {
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const { projects } = useProjects();

  const handleComplete = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletingId(taskId);
    setTimeout(() => {
      onComplete(taskId);
      setCompletingId(null);
    }, 500);
  };

  const toggleExpand = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const formatTimeSpent = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-foreground">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          Próximas Tarefas
        </h3>
        <Button variant="ghost" size="sm" onClick={onAddTask}>
          <Plus className="mr-1 h-4 w-4" />
          Nova
        </Button>
      </div>

      <div className="space-y-2">
        {tasks.map((task, index) => {
          const priority = priorityConfig[task.priority];
          const isCompleting = completingId === task.id;
          const isCompleted = task.status === 'done';
          const isSelected = selectedTaskId === task.id;
          const PriorityIcon = priority.icon;
          const taskSubtasks = subtasks[task.id] || [];
          const isExpanded = expandedTasks[task.id];
          const hasSubtasks = taskSubtasks.length > 0;
          const project = projects.find(p => p.id === task.projectId);

          return (
            <div key={task.id}>
              <div
                className={cn(
                  "group flex items-start gap-3 rounded-xl p-3 transition-all duration-300 cursor-pointer",
                  priority.bgColor,
                  isCompleting && "scale-95 opacity-50",
                  isCompleted && "opacity-60",
                  isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <button
                  onClick={(e) => handleComplete(task.id, e)}
                  className="mt-0.5 flex-shrink-0"
                  disabled={isCompleted}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-status-completed" />
                  ) : (
                    <Circle className={cn("h-5 w-5 transition-colors", priority.color, "group-hover:text-status-completed")} />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p className={cn(
                    "text-sm font-medium text-foreground",
                    isCompleted && "line-through"
                  )}>
                    {task.title}
                  </p>
                  
                  {(() => {
                    // Check for audio URL
                    const audioMatch = task.description?.match(/Áudio anexado: (https?:\/\/[^\s]+)/);
                    const audioUrl = audioMatch ? audioMatch[1] : null;
                    const cleanDescription = task.description?.replace(/Áudio anexado: https?:\/\/[^\s]+/, '').trim();

                    return (
                      <>
                        {cleanDescription && (
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                            {cleanDescription}
                          </p>
                        )}
                        {audioUrl && (
                          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                            <audio 
                              controls 
                              src={audioUrl} 
                              className="h-8 w-full max-w-[200px]" 
                            />
                            <a 
                              href={audioUrl} 
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-primary hover:underline mt-1 inline-block ml-1"
                            >
                              Baixar Áudio
                            </a>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium",
                      priority.bgColor,
                      priority.color
                    )}>
                      <PriorityIcon className="h-3 w-3" />
                      {priority.label}
                    </span>
                    {project?.areaId && (
                      <LifeAreaBadge areaId={project.areaId} />
                    )}
                    {project && (
                      <span className="flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <FolderKanban className="h-3 w-3" style={{ color: project.color }} />
                        {project.name}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Hoje
                      </span>
                    )}
                    {task.timeSpentMinutes > 0 && (
                      <span className="flex items-center gap-1 text-xs text-accent">
                        <Timer className="h-3 w-3" />
                        {formatTimeSpent(task.timeSpentMinutes)}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-reward-gold">
                      <Star className="h-3 w-3" />
                      +{task.points}
                    </span>
                  </div>
                  
                  {/* Subtasks preview */}
                  {hasSubtasks && (
                    <button 
                      onClick={(e) => toggleExpand(task.id, e)}
                      className="mt-2 flex items-center gap-1 text-xs text-primary hover:text-primary/80"
                    >
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {taskSubtasks.length} subtarefas sugeridas
                    </button>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-shrink-0 items-center gap-1">
                  {/* Edit button */}
                  {!isCompleted && onEditTask && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTask(task);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-all"
                      title="Editar tarefa"
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                  
                  {/* Delete button */}
                  {!isCompleted && onDeleteTask && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingTaskId(task.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10"
                      title="Excluir tarefa"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  )}
                  
                  {/* AI Split button */}
                  {!isCompleted && onSplitTask && !hasSubtasks && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSplitTask(task.id);
                      }}
                      disabled={isSplitting}
                      className={cn(
                        "opacity-0 group-hover:opacity-100 transition-all",
                        isSplitting && "opacity-100"
                      )}
                      title="Dividir tarefa com IA"
                    >
                      {isSplitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-accent" />
                      )}
                    </Button>
                  )}
                  
                  {/* Play button to start timer */}
                  {!isCompleted && (
                    <Button
                      variant={isSelected ? "default" : "glass"}
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTask(task);
                      }}
                      className={cn(
                        "transition-all",
                        !isSelected && "opacity-0 group-hover:opacity-100"
                      )}
                    >
                      {isSelected ? (
                        <Timer className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  )}
              </div>
              </div>
              {/* Expanded subtasks */}
              {hasSubtasks && isExpanded && (
                <div className="ml-8 mt-1 space-y-1 animate-fade-in">
                  {taskSubtasks.map((subtask, i) => (
                    <div 
                      key={i}
                      className="group/subtask flex items-center gap-2 rounded-lg bg-muted/30 p-2 text-sm hover:bg-muted/50 transition-colors"
                    >
                      <Circle className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="flex-1 text-muted-foreground">{subtask}</span>
                      {onConvertSubtask && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onConvertSubtask(task.id, subtask, i);
                          }}
                          className="h-6 w-6 opacity-0 group-hover/subtask:opacity-100 transition-opacity"
                          title="Converter em tarefa"
                        >
                          <Plus className="h-3 w-3 text-primary" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {onConvertSubtask && taskSubtasks.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        taskSubtasks.forEach((subtask, i) => {
                          onConvertSubtask(task.id, subtask, i);
                        });
                      }}
                      className="mt-2 w-full text-xs"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Converter todas em tarefas
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {tasks.length === 0 && (
        <div className="py-8 text-center">
          <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-status-completed" />
          <p className="text-sm text-muted-foreground">
            Tudo limpo! Que tal adicionar uma nova tarefa?
          </p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingTaskId} onOpenChange={() => setDeletingTaskId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Excluir Tarefa
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeletingTaskId(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingTaskId && onDeleteTask) {
                  onDeleteTask(deletingTaskId);
                  setDeletingTaskId(null);
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
