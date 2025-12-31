import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  MoreHorizontal, 
  Clock, 
  CheckCircle2,
  Circle,
  ArrowRight,
  GripVertical,
  FolderKanban
} from "lucide-react";
import type { Task } from "@/types";
import { useProjects } from "@/hooks/useProjects";

interface Column {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
}

const columns: Column[] = [
  { 
    id: 'inbox', 
    title: 'Inbox', 
    icon: <Circle className="h-4 w-4" />,
    color: 'text-muted-foreground'
  },
  { 
    id: 'next', 
    title: 'Próximas', 
    icon: <ArrowRight className="h-4 w-4" />,
    color: 'text-blue-500'
  },
  { 
    id: 'in-progress', 
    title: 'Em Progresso', 
    icon: <Clock className="h-4 w-4" />,
    color: 'text-amber-500'
  },
  { 
    id: 'done', 
    title: 'Concluídas', 
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: 'text-emerald-500'
  },
];

interface KanbanBoardProps {
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: string) => void;
  onTaskClick?: (task: Task) => void;
}

const priorityColors: Record<string, string> = {
  urgent: 'border-l-red-500',
  high: 'border-l-orange-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-emerald-500',
};

const priorityLabels: Record<string, string> = {
  urgent: 'Urgente',
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

export function KanbanBoard({ tasks, onTaskMove, onTaskClick }: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const { projects } = useProjects();

  const getTasksByStatus = (status: string) => {
    const statusMap: Record<string, string[]> = {
      'inbox': ['inbox'],
      'next': ['next'],
      'in-progress': ['in-progress', 'inProgress'],
      'done': ['done', 'completed'],
    };
    return tasks.filter(task => statusMap[status]?.includes(task.status));
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (draggedTask) {
      onTaskMove(draggedTask, columnId);
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => {
        const columnTasks = getTasksByStatus(column.id);
        const isOver = dragOverColumn === column.id;

        return (
          <div
            key={column.id}
            className={cn(
              "flex min-w-[280px] flex-1 flex-col rounded-2xl border border-border/50 bg-card/50 transition-all",
              isOver && "border-primary bg-primary/5"
            )}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between border-b border-border/50 p-4">
              <div className="flex items-center gap-2">
                <span className={column.color}>{column.icon}</span>
                <h3 className="font-semibold text-foreground">{column.title}</h3>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
                  {columnTasks.length}
                </span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Column Content */}
            <div className="flex-1 space-y-3 p-3">
              {columnTasks.length === 0 ? (
                <div className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-border/50 text-sm text-muted-foreground">
                  {isOver ? 'Solte aqui' : 'Nenhuma tarefa'}
                </div>
              ) : (
                columnTasks.map((task) => {
                  const project = projects.find(p => p.id === task.projectId);
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onTaskClick?.(task)}
                      className={cn(
                        "group cursor-pointer rounded-xl border-l-4 bg-card p-4 shadow-sm transition-all hover:shadow-md",
                        priorityColors[task.priority] || 'border-l-muted',
                        draggedTask === task.id && "opacity-50"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground line-clamp-2">
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-medium",
                              task.priority === 'urgent' && "bg-red-500/10 text-red-500",
                              task.priority === 'high' && "bg-orange-500/10 text-orange-500",
                              task.priority === 'medium' && "bg-yellow-500/10 text-yellow-500",
                              task.priority === 'low' && "bg-emerald-500/10 text-emerald-500",
                            )}>
                              {priorityLabels[task.priority]}
                            </span>
                            {task.tags?.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                              >
                                {tag}
                              </span>
                            ))}
                            {project && (
                              <span className="flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                <FolderKanban className="h-3 w-3" style={{ color: project.color }} />
                                {project.name}
                              </span>
                            )}
                            {task.estimatedMinutes && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {task.estimatedMinutes}min
                              </span>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
