import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Circle, Timer, Target } from "lucide-react";
import type { Task } from "@/types";
import { cn } from "@/lib/utils";

interface TaskSelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}

export function TaskSelectorDialog({
  isOpen,
  onClose,
  tasks,
  onSelectTask,
}: TaskSelectorDialogProps) {
  // Filter only incomplete tasks
  const availableTasks = tasks.filter(t => t.status !== 'done');

  const handleTaskSelect = (task: Task) => {
    onClose();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'low': return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
      default: return 'text-muted-foreground bg-muted border-transparent';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Selecione uma Tarefa
          </DialogTitle>
        </DialogHeader>

        {availableTasks.length === 0 ? (
          <div className="py-8 text-center">
            <Circle className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Nenhuma tarefa disponível
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Crie uma nova tarefa primeiro
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-2">
              {availableTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleTaskSelect(task)}
                  className={cn(
                    "w-full text-left rounded-xl p-3 transition-all",
                    "border border-border/50 bg-muted/20",
                    "hover:border-primary/50 hover:bg-primary/10 hover:shadow-md",
                    "group"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Circle className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground text-sm line-clamp-2">
                        {task.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        {task.estimatedMinutes && (
                          <span className="flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            {task.estimatedMinutes} min
                          </span>
                        )}
                        <span className={cn(
                          "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase border",
                          getPriorityColor(task.priority)
                        )}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    <Play className="h-4 w-4 flex-shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
