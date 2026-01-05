import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
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
  Loader2,
  Pencil,
  Trash2,
  FolderKanban,
  ChevronDown,
  ChevronUp,
  Sparkles,
  GripVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Task, Priority, Project } from "@/types";
import { LifeAreaBadge } from "@/components/ui/LifeAreaBadge";

interface TaskCardProps {
  task: Task;
  projects: Project[];
  priorityConfig: Record<Priority, { color: string; label: string; bgColor: string; icon: React.ElementType }>;
  isSelected: boolean;
  isCompleting: boolean;
  isCompleted: boolean;
  isExpanded: boolean;
  isSplitting: boolean;
  subtasks: string[];
  animationDelay?: string;
  onComplete: (taskId: string, e: React.MouseEvent) => void;
  onSelect: (task: Task, e: React.MouseEvent) => void;
  onToggleExpand: (taskId: string, e: React.MouseEvent) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onSplit?: (taskId: string) => void;
  onConvertSubtask?: (parentTaskId: string, subtaskTitle: string, subtaskIndex: number) => void;
  onToggleBig3?: (taskId: string) => void;
}

export function TaskCard({
  task,
  projects,
  priorityConfig,
  isSelected,
  isCompleting,
  isCompleted,
  isExpanded,
  isSplitting,
  subtasks,
  animationDelay,
  onComplete,
  onSelect,
  onToggleExpand,
  onEdit,
  onDelete,
  onSplit,
  onConvertSubtask,
  onToggleBig3
}: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: task
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const priority = priorityConfig[task.priority];
  const PriorityIcon = priority.icon;
  const project = projects.find(p => p.id === task.projectId);
  const hasSubtasks = subtasks.length > 0;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const isBig3Today = task.isBig3 && task.big3Date && 
    task.big3Date.toISOString().split('T')[0] === todayStr;

  const formatTimeSpent = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const formatTaskDate = (date: Date): string => {
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
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-start gap-3 rounded-xl p-3 transition-all duration-300",
        isCompleted ? "bg-muted/40" : priority.bgColor,
        isCompleting && "scale-95 opacity-50",
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        isBig3Today && !isCompleted && "ring-2 ring-amber-500 ring-offset-1 shadow-[0_0_15px_rgba(245,158,11,0.15)]",
        isDragging && "opacity-50 z-50 shadow-xl scale-105 rotate-2 cursor-grabbing"
      )}
    >
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners}
        className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <button
        onClick={(e) => onComplete(task.id, e)}
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
            onClick={(e) => onToggleExpand(task.id, e)}
            className="mt-2 flex items-center gap-1 text-xs text-primary hover:text-primary/80"
          >
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {subtasks.length} subtarefas sugeridas
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-shrink-0 items-center gap-1">
        {/* Big 3 toggle button */}
        {!isCompleted && onToggleBig3 && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggleBig3(task.id);
            }}
            className={cn(
              "transition-all",
              isBig3Today 
                ? "opacity-100 text-amber-500" 
                : "opacity-100 pointer-events-auto md:opacity-0 md:pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto"
            )}
            title={isBig3Today ? "Remover do Big 3" : "Adicionar ao Big 3"}
          >
            <Star 
              className={cn("h-4 w-4", isBig3Today ? "text-amber-500" : "text-muted-foreground")} 
              fill={isBig3Today ? "currentColor" : "none"}
            />
          </Button>
        )}
        
        {/* Edit button */}
        {!isCompleted && onEdit && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="opacity-100 pointer-events-auto md:opacity-0 md:pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto transition-all"
            title="Editar tarefa"
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
        
        {/* Delete button */}
        {!isCompleted && onDelete && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="opacity-100 pointer-events-auto md:opacity-0 md:pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto transition-all hover:bg-destructive/10"
            title="Excluir tarefa"
          >
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </Button>
        )}
        
        {/* AI Split button */}
        {!isCompleted && onSplit && !hasSubtasks && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              onSplit(task.id);
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
              onSelect(task, e);
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
      
      {/* Expanded subtasks */}
      {hasSubtasks && isExpanded && (
        <div className="ml-8 mt-1 space-y-1 animate-fade-in w-full col-span-full">
          {subtasks.map((subtask, i) => (
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
          {onConvertSubtask && subtasks.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                subtasks.forEach((subtask, i) => {
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
}
