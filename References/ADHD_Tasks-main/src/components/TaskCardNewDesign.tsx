"use client";

import { ParsedTask } from "@/utils/taskParser";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { LightningBoltIcon } from '@radix-ui/react-icons'; // Using Radix UI icon for lightning bolt
import { Check, Clock, Zap, PauseCircle } from 'lucide-react'; // Using Lucide React for checkmark, added Clock and Zap, NEW: PauseCircle

interface TaskCardNewDesignProps {
  task: ParsedTask;
  onComplete: (task: ParsedTask) => void;
  onEdit: (task: ParsedTask) => void;
  taskStats?: { totalTime: number; interruptions: number; totalBreakTime: number }; // NEW PROP: Adicionado totalBreakTime
}

const TaskCardNewDesign = ({ task, onComplete, onEdit, taskStats }: TaskCardNewDesignProps) => {
  const isPriority = task.priority === 'high' && task.status !== 'completed';
  const isCompleted = task.status === 'completed';

  const handleCheckboxChange = () => {
    if (!isCompleted) {
      onComplete(task);
    }
  };

  const getBorderColorClass = (task: ParsedTask) => {
    if (isPriority) return ''; // Priority card has gradient, no border
    if (isCompleted) return ''; // Completed card has green background, no border
    
    // For regular tasks, use category or priority for border color
    switch (task.category) {
      case 'red': return 'border-l-task-border-red';
      case 'yellow': return 'border-l-yellow-500'; // Assuming yellow is fine
      case 'purple': return 'border-l-purple-500'; // Assuming purple is fine
      case 'green': return 'border-l-green-500'; // Assuming green is fine
      default:
        // If no category, use priority for a subtle hint
        switch (task.priority) {
          case 'high': return 'border-l-task-border-red'; // Red for high priority
          case 'medium': return 'border-l-task-border-blue'; // Blue for medium priority
          case 'low': return 'border-l-gray-400'; // Gray for low priority
          default: return 'border-l-gray-300'; // Default light gray
        }
    }
  };

  const borderColorClass = getBorderColorClass(task);

  const totalMinutes = taskStats ? Math.round(taskStats.totalTime / 60) : 0;
  const interruptionCount = taskStats ? taskStats.interruptions : 0;
  const totalBreakMinutes = taskStats ? Math.round(taskStats.totalBreakTime / 60) : 0; // NEW: Total de minutos de pausa
  const hasStarted = totalMinutes > 0 || interruptionCount > 0 || totalBreakMinutes > 0; // NEW: Incluir tempo de pausa

  return (
    <div
      className={cn(
        "relative flex items-center p-4 rounded-xl shadow-md cursor-pointer transition-all duration-200",
        "min-h-[80px] mb-3", // Added min-height and margin-bottom for spacing
        isPriority && "bg-gradient-to-r from-task-priority-start to-task-priority-end text-white",
        isCompleted && "bg-task-completed-bg text-task-completed-text",
        !isPriority && !isCompleted && "bg-card text-foreground border-l-4", // Default card styling with left border
        borderColorClass,
        "hover:shadow-lg hover:scale-[1.01]" // NEW: Hover effect
      )}
      onClick={() => onEdit(task)}
    >
      {isPriority ? (
        <LightningBoltIcon className="h-5 w-5 mr-3 flex-shrink-0" />
      ) : isCompleted ? (
        <Check className="h-5 w-5 mr-3 flex-shrink-0 text-task-completed-text" />
      ) : (
        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleCheckboxChange}
          className="mr-3 flex-shrink-0 h-5 w-5 rounded-full border-2"
          id={`task-${task.id}`}
        />
      )}
      
      <div className="flex-grow">
        {isPriority && <p className="text-sm font-semibold mb-1">Tarefa Prioritária</p>}
        <p className={cn("text-lg font-medium", isCompleted && "line-through")}>{task.title}</p>
        {task.due_date && !isCompleted && (
          <p className="text-sm text-white/80 mt-1">
            Vence hoje às {new Date(task.due_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
        {isCompleted && (
          <p className="text-sm mt-1">Concluído ⭐+10 XP</p>
        )}
        {!isPriority && !isCompleted && task.priority === 'high' && (
          <p className="text-sm text-muted-foreground mt-1">Urgente</p>
        )}
        {!isPriority && !isCompleted && task.priority === 'medium' && (
          <p className="text-sm text-muted-foreground mt-1">A Fazer</p>
        )}
        {!isPriority && !isCompleted && task.priority === 'low' && (
          <p className="text-sm text-muted-foreground mt-1">Baixa Prioridade</p>
        )}
        {hasStarted && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            {totalMinutes > 0 && (
              <div className="flex items-center gap-1" title={`Tempo focado: ${totalMinutes} minutos`}>
                <Clock className="h-4 w-4" />
                <span>{totalMinutes}m</span>
              </div>
            )}
            {interruptionCount > 0 && (
              <div className="flex items-center gap-1" title={`Interrupções: ${interruptionCount}`}>
                <Zap className="h-4 w-4" />
                <span>{interruptionCount}</span>
              </div>
            )}
            {totalBreakMinutes > 0 && ( // NEW: Exibir tempo de pausa
              <div className="flex items-center gap-1" title={`Tempo de Pausa: ${totalBreakMinutes} minutos`}>
                <PauseCircle className="h-4 w-4" />
                <span>{totalBreakMinutes}m</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCardNewDesign;