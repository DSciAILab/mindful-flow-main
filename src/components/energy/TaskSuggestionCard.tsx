import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Play, 
  ChevronRight, 
  Sparkles,
  Battery,
  BatteryMedium,
  BatteryFull,
  Clock
} from "lucide-react";
import type { Task, EnergyLevel } from "@/types";
import { energyConfig } from "./EnergySelector";

interface TaskSuggestionCardProps {
  suggestedTask: Task | null;
  reason: string;
  onStart: (task: Task) => void;
  onShowOthers: () => void;
}

const EnergyIcon = ({ level }: { level: EnergyLevel }) => {
  const icons = {
    low: Battery,
    medium: BatteryMedium,
    high: BatteryFull,
  };
  const Icon = icons[level];
  const config = energyConfig[level];
  
  return <Icon className={cn("h-4 w-4", config.color)} />;
};

export const TaskSuggestionCard = ({
  suggestedTask,
  reason,
  onStart,
  onShowOthers,
}: TaskSuggestionCardProps) => {
  if (!suggestedTask) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Nenhuma tarefa sugerida</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Ajuste os filtros ou adicione novas tarefas
            </p>
          </div>
        </div>
      </div>
    );
  }

  const energyLevel = suggestedTask.energyRequired || 'medium';

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card/80 to-card/40 backdrop-blur-sm p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-xs font-medium text-primary uppercase tracking-wide">
              Tarefa Sugerida
            </h3>
            <p className="text-xs text-muted-foreground">{reason}</p>
          </div>
        </div>
      </div>

      {/* Task Info */}
      <div className="space-y-2">
        <h4 className="font-semibold text-lg text-foreground leading-tight">
          {suggestedTask.title}
        </h4>
        
        {suggestedTask.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {suggestedTask.description}
          </p>
        )}

        {/* Task metadata */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <EnergyIcon level={energyLevel} />
            <span>{energyConfig[energyLevel].label}</span>
          </div>

          {suggestedTask.timeRequiredMinutes && (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{suggestedTask.timeRequiredMinutes} min</span>
            </div>
          )}

          {suggestedTask.points && suggestedTask.points > 0 && (
            <div className="flex items-center gap-1 text-amber-500">
              <span>🏆</span>
              <span>{suggestedTask.points} pts</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          className="flex-1 gap-2"
          onClick={() => onStart(suggestedTask)}
        >
          <Play className="h-4 w-4" />
          Começar Agora
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={onShowOthers}
        >
          Ver outras
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};
