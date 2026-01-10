import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Zap, 
  Battery, 
  BatteryLow, 
  BatteryMedium, 
  BatteryFull,
  Clock,
  ArrowRight
} from "lucide-react";
import type { Task } from "@/types";
import type { EnergyLevel } from "@/types/dailyMission";

interface EnergyBasedSuggestionsProps {
  energyLevel: EnergyLevel;
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}

const energyConfig: Record<EnergyLevel, {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  focusTime: number;
}> = {
  1: {
    icon: <BatteryLow className="h-5 w-5" />,
    title: "Energia muito baixa",
    description: "Comece com tarefas simples e curtas. Seja gentil consigo.",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    focusTime: 15,
  },
  2: {
    icon: <BatteryLow className="h-5 w-5" />,
    title: "Energia baixa",
    description: "Foque em tarefas pequenas. Qualquer progresso conta.",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    focusTime: 20,
  },
  3: {
    icon: <BatteryMedium className="h-5 w-5" />,
    title: "Energia moderada",
    description: "Bom para tarefas de rotina e médio esforço.",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    focusTime: 25,
  },
  4: {
    icon: <BatteryFull className="h-5 w-5" />,
    title: "Energia alta",
    description: "Aproveite para as tarefas mais importantes!",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    focusTime: 35,
  },
  5: {
    icon: <Zap className="h-5 w-5" />,
    title: "Energia máxima!",
    description: "Hora de atacar as tarefas difíceis e complexas!",
    color: "text-primary",
    bgColor: "bg-primary/10",
    focusTime: 45,
  },
};

export function EnergyBasedSuggestions({
  energyLevel,
  tasks,
  onSelectTask,
}: EnergyBasedSuggestionsProps) {
  const config = energyConfig[energyLevel];

  // Get suggested tasks based on energy level
  const suggestedTasks = useMemo(() => {
    const activeTasks = tasks.filter((t) => !t.completedAt);
    
    // Sort by estimated time
    const sortedByTime = [...activeTasks].sort((a, b) => {
      const aTime = a.estimatedMinutes || 30;
      const bTime = b.estimatedMinutes || 30;
      
      // Low energy: prefer shorter tasks
      if (energyLevel <= 2) {
        return aTime - bTime;
      }
      
      // High energy: prefer longer/complex tasks
      if (energyLevel >= 4) {
        return bTime - aTime;
      }
      
      // Medium: sort by priority
      const priorityOrder: Record<string, number> = {
        urgent: 0,
        high: 1,
        medium: 2,
        low: 3,
      };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return sortedByTime.slice(0, 3);
  }, [tasks, energyLevel]);

  if (suggestedTasks.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      "rounded-xl p-4",
      config.bgColor
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          config.bgColor,
          config.color
        )}>
          {config.icon}
        </div>
        <div>
          <h3 className={cn("font-medium", config.color)}>
            {config.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {config.description}
          </p>
        </div>
      </div>

      {/* Suggested focus time */}
      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Tempo de foco sugerido: <strong>{config.focusTime} minutos</strong></span>
      </div>

      {/* Suggested tasks */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          {energyLevel <= 2 
            ? "Tarefas leves para começar:" 
            : energyLevel >= 4 
              ? "Tarefas para aproveitar a energia:" 
              : "Tarefas sugeridas:"}
        </h4>
        {suggestedTasks.map((task) => (
          <Button
            key={task.id}
            variant="ghost"
            onClick={() => onSelectTask(task)}
            className="w-full justify-between h-auto py-3 px-4 bg-background/50 hover:bg-background"
          >
            <div className="text-left">
              <p className="font-medium">{task.title}</p>
              {task.estimatedMinutes && (
                <p className="text-xs text-muted-foreground">
                  ~{task.estimatedMinutes} min
                </p>
              )}
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Button>
        ))}
      </div>
    </div>
  );
}
