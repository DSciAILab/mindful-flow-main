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
import { TaskCard } from "./TaskCard";
import { priorityConfig } from "@/lib/design-tokens";

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
  onToggleBig3?: (taskId: string) => void;
  isSplitting?: boolean;
  subtasks?: Record<string, string[]>;
  showCompleted?: boolean;
  onToggleCompleted?: () => void;
}
// Definition of priorityConfig removed. Using imported one.

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
  onToggleBig3,
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
            {group.tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                projects={projects}
                // priorityConfig removido - TaskCard usa design-tokens interno
                isSelected={selectedTaskId === task.id}
                isCompleting={completingId === task.id}
                isCompleted={task.status === 'done' || !!task.completedAt}
                isExpanded={!!expandedTasks[task.id]}
                isSplitting={isSplitting}
                subtasks={subtasks?.[task.id] || []}
                animationDelay={`${index * 50}ms`}
                onComplete={handleComplete}
                onSelect={(task) => onSelectTask(task)}
                onToggleExpand={toggleExpand}
                onEdit={onEditTask}
                onDelete={(taskId) => setDeletingTaskId(taskId)}
                onSplit={onSplitTask}
                onConvertSubtask={onConvertSubtask}
                onToggleBig3={onToggleBig3}
              />
            ))}
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
