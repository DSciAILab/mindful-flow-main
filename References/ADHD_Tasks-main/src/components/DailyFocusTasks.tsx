"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw, Check, Trash2, Clock, Zap, PauseCircle } from "lucide-react"; // NEW: Import PauseCircle
import { ParsedTask } from "@/utils/taskParser";
import { useTimer } from "@/contexts/TimerContext";
import { cn } from "@/lib/utils";

interface DailyFocusTasksProps {
  tasks: ParsedTask[];
  onReturnToToDo: (task: ParsedTask) => void;
  onComplete: (task: ParsedTask) => void;
  onDelete: (task: ParsedTask) => void;
  activeTasksStats: Record<string, { totalTime: number; interruptions: number; totalBreakTime: number }>; // NEW PROP: Adicionado totalBreakTime
}

const DailyFocusTasks = ({ tasks, onReturnToToDo, onComplete, onDelete, activeTasksStats }: DailyFocusTasksProps) => {
  const { selectTaskAndEnterFocus } = useTimer();

  const getPriorityDisplay = (priority: ParsedTask['priority']) => {
    switch (priority) {
      case 'high': return { text: 'Alta', color: 'border-l-red-500' };
      case 'medium': return { text: 'Média', color: 'border-l-yellow-500' };
      case 'low': return { text: 'Baixa', color: 'border-l-green-500' };
      default: return { text: 'Nenhuma', color: 'border-l-gray-500' };
    }
  };

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation(); // Impede que o clique acione o modo de foco
    action();
  };

  return (
    <Card className="mx-4 mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Foco do Dia (Top 3)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhuma tarefa no seu Foco do Dia. Adicione tarefas na Inbox.
          </p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => {
              const { text: priorityText, color: priorityColorClass } = getPriorityDisplay(task.priority);
              const stats = activeTasksStats[task.id];
              const totalMinutes = stats ? Math.round(stats.totalTime / 60) : 0;
              const interruptionCount = stats ? stats.interruptions : 0;
              const totalBreakMinutes = stats ? Math.round(stats.totalBreakTime / 60) : 0; // NEW: Total de minutos de pausa
              const hasStarted = totalMinutes > 0 || interruptionCount > 0 || totalBreakMinutes > 0; // NEW: Incluir tempo de pausa

              return (
                <li
                  key={task.id}
                  onClick={() => selectTaskAndEnterFocus(task)}
                  className={cn(
                    "flex items-center justify-between p-3 border rounded-md cursor-pointer",
                    "bg-primary text-primary-foreground hover:bg-primary/90 border-l-4",
                    priorityColorClass
                  )}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{task.title}</span>
                    {task.priority && <span className="text-xs opacity-70">{priorityText}</span>}
                    {hasStarted && (
                      <div className="flex items-center gap-2 text-xs opacity-70 ml-2">
                        {totalMinutes > 0 && (
                          <div className="flex items-center gap-1" title={`Tempo focado: ${totalMinutes} minutos`}>
                            <Clock className="h-3 w-3" />
                            <span>{totalMinutes}m</span>
                          </div>
                        )}
                        {interruptionCount > 0 && (
                          <div className="flex items-center gap-1" title={`Interrupções: ${interruptionCount}`}>
                            <Zap className="h-3 w-3" />
                            <span>{interruptionCount}</span>
                          </div>
                        )}
                        {totalBreakMinutes > 0 && ( // NEW: Exibir tempo de pausa
                          <div className="flex items-center gap-1" title={`Tempo de Pausa: ${totalBreakMinutes} minutos`}>
                            <PauseCircle className="h-3 w-3" />
                            <span>{totalBreakMinutes}m</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="icon" onClick={(e) => handleActionClick(e, () => onReturnToToDo(task))}>
                      <RotateCcw className="h-4 w-4" />
                      <span className="sr-only">Retornar para Tarefas a Fazer</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => handleActionClick(e, () => onComplete(task))}>
                      <Check className="h-4 w-4" />
                      <span className="sr-only">Marcar como concluída</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => handleActionClick(e, () => onDelete(task))}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Deletar tarefa</span>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyFocusTasks;