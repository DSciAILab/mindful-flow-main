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
  FolderKanban,
  Layers,
  Calendar,
  ArrowUpDown,
  Eye,
  EyeOff
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
  showCompleted?: boolean;
  onToggleCompleted?: () => void;
}

const priorityConfig: Record<Priority, { color: string; label: string; bgColor: string; icon: React.ElementType }> = {
  urgent: { color: 'text-priority-urgent', label: 'Urgente', bgColor: 'bg-priority-urgent/10', icon: AlertCircle },
  high: { color: 'text-priority-high', label: 'Alta', bgColor: 'bg-priority-high/10', icon: Zap },
  medium: { color: 'text-priority-medium', label: 'Média', bgColor: 'bg-priority-medium/10', icon: Flag },
  low: { color: 'text-priority-low', label: 'Baixa', bgColor: 'bg-priority-low/10', icon: Leaf },
};

type GroupMode = 'list' | 'project' | 'priority' | 'date';

const groupModeConfig: Record<GroupMode, { label: string; icon: React.ElementType }> = {
  list: { label: 'Lista', icon: CheckCircle2 },
  project: { label: 'Projeto', icon: FolderKanban },
  priority: { label: 'Prioridade', icon: ArrowUpDown },
  date: { label: 'Data', icon: Calendar },
};

const priorityOrder: Priority[] = ['urgent', 'high', 'medium', 'low'];

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
  showCompleted = false,
  onToggleCompleted,
}: TaskListProps) {
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [groupMode, setGroupMode] = useState<GroupMode>('list');
  const { projects } = useProjects();

  const cycleGroupMode = () => {
    const modes: GroupMode[] = ['list', 'project', 'priority', 'date'];
    const currentIndex = modes.indexOf(groupMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setGroupMode(modes[nextIndex]);
  };

  const groupTasks = (taskList: Task[]): { groupName: string; tasks: Task[]; color?: string }[] => {
    if (groupMode === 'list') {
      return [{ groupName: '', tasks: taskList }];
    }

    if (groupMode === 'project') {
      const grouped: Record<string, Task[]> = { 'Sem Projeto': [] };
      taskList.forEach(task => {
        const project = projects.find(p => p.id === task.projectId);
        const groupKey = project?.name || 'Sem Projeto';
        if (!grouped[groupKey]) grouped[groupKey] = [];
        grouped[groupKey].push(task);
      });
      return Object.entries(grouped)
        .filter(([_, tasks]) => tasks.length > 0)
        .map(([name, tasks]) => {
          const project = projects.find(p => p.name === name);
          return { groupName: name, tasks, color: project?.color };
        });
    }

    if (groupMode === 'priority') {
      return priorityOrder.map(priority => ({
        groupName: priorityConfig[priority].label,
        tasks: taskList.filter(t => t.priority === priority),
        color: undefined,
      })).filter(g => g.tasks.length > 0);
    }

    if (groupMode === 'date') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const groups: { groupName: string; tasks: Task[] }[] = [
        { groupName: 'Hoje', tasks: [] },
        { groupName: 'Esta Semana', tasks: [] },
        { groupName: 'Mais Tarde', tasks: [] },
      ];

      taskList.forEach(task => {
        const taskDate = new Date(task.createdAt);
        taskDate.setHours(0, 0, 0, 0);
        
        if (taskDate.getTime() === today.getTime()) {
          groups[0].tasks.push(task);
        } else if (taskDate < weekEnd) {
          groups[1].tasks.push(task);
        } else {
          groups[2].tasks.push(task);
        }
      });

      return groups.filter(g => g.tasks.length > 0);
    }

    return [{ groupName: '', tasks: taskList }];
  };

  const groupedTasks = groupTasks(tasks);

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
        <div className="flex items-center gap-2">
          {onToggleCompleted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCompleted}
              className={cn(
                "text-muted-foreground hover:text-foreground",
                showCompleted && "text-primary bg-primary/10 hover:bg-primary/20"
              )}
              title={showCompleted ? "Ocultar concluídas" : "Mostrar concluídas"}
            >
              {showCompleted ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={cycleGroupMode}
            className="text-muted-foreground hover:text-foreground"
            title="Mudar agrupamento"
          >
            {(() => {
              const config = groupModeConfig[groupMode];
              const Icon = config.icon;
              return (
                <>
                  <Icon className="mr-1.5 h-4 w-4" />
                  {config.label}
                </>
              );
            })()}
          </Button>
          <Button variant="ghost" size="sm" onClick={onAddTask}>
            <Plus className="mr-1 h-4 w-4" />
            Nova
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {groupedTasks.map((group, groupIndex) => (
          <div key={group.groupName || 'default'} className="space-y-2">
            {/* Group Header */}
            {group.groupName && (
              <div className="flex items-center gap-2 pt-2 first:pt-0">
                {group.color && (
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: group.color }}
                  />
                )}
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.groupName}
                </h4>
                <span className="text-xs text-muted-foreground/50">
                  ({group.tasks.length})
                </span>
              </div>
            )}
            
            {/* Tasks in this group */}
            {group.tasks.map((task, index) => {
          const priority = priorityConfig[task.priority];
          const isCompleting = completingId === task.id;
          const isCompleted = task.status === 'done' || !!task.completedAt;
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
                  isCompleted ? "bg-muted/40" : priority.bgColor,
                  isCompleting && "scale-95 opacity-50",
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
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground/70" />
                  ) : (
                    <Circle className={cn("h-5 w-5 transition-colors", priority.color, "group-hover:text-status-completed")} />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p className={cn(
                    "text-sm font-medium",
                    isCompleted ? "text-muted-foreground line-through decoration-muted-foreground/50" : "text-foreground"
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
                    <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
                      <span>•</span>
                      {formatTaskDate(task.createdAt)}
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
                      className="opacity-100 pointer-events-auto md:opacity-0 md:pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto transition-all"
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
                      className="opacity-100 pointer-events-auto md:opacity-0 md:pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto transition-all hover:bg-destructive/10"
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
                        "opacity-100 pointer-events-auto md:opacity-0 md:pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto transition-all",
                        isSplitting && "opacity-100 pointer-events-auto"
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
                        !isSelected && "opacity-100 pointer-events-auto md:opacity-0 md:pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto"
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
        ))}
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

function formatTaskDate(date: Date): string {
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  const currentYear = new Date().getFullYear();
  
  if (year === currentYear) {
    return `${day} ${month}, ${hours}:${minutes}`;
  }
  return `${day} ${month} ${year}`;
}
