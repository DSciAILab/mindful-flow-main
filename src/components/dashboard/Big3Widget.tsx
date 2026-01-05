import { Star, CheckCircle2, Clock, ArrowRight, Plus, X } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

interface Big3WidgetProps {
  big3Tasks: Task[];
  onSelectTask: (task: Task) => void;
  onToggleBig3: (taskId: string) => void;
  onAddBig3: () => void;
}

export function Big3Widget({ big3Tasks, onSelectTask, onToggleBig3, onAddBig3 }: Big3WidgetProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'big3-droppable',
  });
  
  const emptySlots = 3 - big3Tasks.length;

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "rounded-2xl border bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-yellow-500/5 p-6 shadow-card backdrop-blur-sm transition-all duration-300",
        isOver ? "border-amber-500 border-2 scale-[1.02] shadow-xl bg-amber-500/10" : "border-amber-500/20"
      )}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
          <Star className="h-5 w-5 text-white" fill="white" />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">
            Big 3 do Dia
          </h3>
          <p className="text-sm text-muted-foreground">
            Suas tarefas mais importantes
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {big3Tasks.map((task, index) => (
          <div
            key={task.id}
            className={cn(
              "group flex items-center gap-3 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-transparent p-4 transition-all hover:border-amber-500/50 hover:shadow-md cursor-pointer"
            )}
            onClick={() => onSelectTask(task)}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-sm font-bold text-white shadow-md">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{task.title}</p>
              {task.estimatedMinutes && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {task.estimatedMinutes} min
                </p>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleBig3(task.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 transition-all"
              title="Remover do Big 3"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </button>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <button
            key={`empty-${index}`}
            onClick={onAddBig3}
            className="flex w-full items-center gap-3 rounded-xl border border-dashed border-muted-foreground/20 p-4 transition-all hover:border-amber-500/50 hover:bg-amber-500/5 cursor-pointer group/empty"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 text-sm font-bold text-muted-foreground/50 group-hover/empty:border-amber-500/50 group-hover/empty:text-amber-500 transition-colors">
              <Plus className="h-4 w-4" />
            </div>
            <p className="text-sm text-muted-foreground/50 italic group-hover/empty:text-amber-500/70 transition-colors">
              Adicione uma tarefa importante...
            </p>
          </button>
        ))}
      </div>

      {big3Tasks.length === 3 && (
        <div className="mt-4 flex items-center gap-2 text-sm text-emerald-500">
          <CheckCircle2 className="h-4 w-4" />
          <span>Big 3 definido! Foque nessas tarefas hoje.</span>
        </div>
      )}
    </div>
  );
}
