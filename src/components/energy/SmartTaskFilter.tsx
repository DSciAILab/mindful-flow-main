import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { 
  Battery, 
  BatteryMedium, 
  BatteryFull,
  Clock,
  X,
  Filter,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import type { EnergyLevel, TaskContext } from "@/types";
import type { TaskFilters } from "@/hooks/useSmartTaskSuggestion";
import { contextConfig, allContexts } from "./ContextSelector";

interface SmartTaskFilterProps {
  currentEnergy?: EnergyLevel;
  currentContexts: TaskContext[];
  availableTime?: number;
  onFilterChange: (filters: TaskFilters) => void;
  matchingCount: number;
  totalCount: number;
}

const energyOptions: { value: EnergyLevel; icon: typeof Battery; label: string; color: string }[] = [
  { value: 'low', icon: Battery, label: 'Baixa', color: 'text-amber-500' },
  { value: 'medium', icon: BatteryMedium, label: 'Média', color: 'text-blue-500' },
  { value: 'high', icon: BatteryFull, label: 'Alta', color: 'text-emerald-500' },
];

const timeOptions = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hora' },
  { value: 120, label: '2 horas' },
];

export const SmartTaskFilter = ({
  currentEnergy,
  currentContexts,
  availableTime,
  onFilterChange,
  matchingCount,
  totalCount,
}: SmartTaskFilterProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleEnergyChange = (energy: EnergyLevel) => {
    onFilterChange({
      energy: currentEnergy === energy ? undefined : energy,
      contexts: currentContexts,
      availableTime,
    });
  };

  const handleContextToggle = (context: TaskContext) => {
    const newContexts = currentContexts.includes(context)
      ? currentContexts.filter((c) => c !== context)
      : [...currentContexts, context];
    
    onFilterChange({
      energy: currentEnergy,
      contexts: newContexts,
      availableTime,
    });
  };

  const handleTimeChange = (time: number | undefined) => {
    onFilterChange({
      energy: currentEnergy,
      contexts: currentContexts,
      availableTime: availableTime === time ? undefined : time,
    });
  };

  const handleClearFilters = () => {
    onFilterChange({
      energy: undefined,
      contexts: [],
      availableTime: undefined,
    });
  };

  const hasActiveFilters = currentEnergy || currentContexts.length > 0 || availableTime;

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 space-y-3">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
        >
          <Filter className="h-4 w-4" />
          <span>Filtros Inteligentes</span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleClearFilters}
            >
              <X className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{matchingCount}</span>
            {" de "}
            <span>{totalCount}</span>
            {" tarefas"}
          </span>
        </div>
      </div>

      {/* Collapsible filter content */}
      {isExpanded && (
        <div className="space-y-4 pt-2 border-t border-border/30">
          {/* Energy Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Minha energia agora
            </label>
            <div className="flex gap-2">
              {energyOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = currentEnergy === option.value;

                return (
                  <Button
                    key={option.value}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 px-3 gap-1.5 transition-all",
                      isSelected && [
                        option.color,
                        "bg-current/10 border-current/30",
                      ],
                      !isSelected && "opacity-60 hover:opacity-100"
                    )}
                    onClick={() => handleEnergyChange(option.value)}
                  >
                    <Icon className={cn("h-3.5 w-3.5", isSelected && option.color)} />
                    <span className="text-xs">{option.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Context Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Onde estou / O que tenho disponível
            </label>
            <div className="flex flex-wrap gap-2">
              {allContexts.map((context) => {
                const config = contextConfig[context];
                const Icon = config.icon;
                const isSelected = currentContexts.includes(context);

                return (
                  <Button
                    key={context}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-7 px-2 gap-1 transition-all text-xs",
                      isSelected && [config.color, config.bgColor],
                      !isSelected && "opacity-60 hover:opacity-100"
                    )}
                    onClick={() => handleContextToggle(context)}
                  >
                    <Icon className={cn("h-3 w-3", isSelected && config.color)} />
                    <span>{config.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Time Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Tempo disponível
            </label>
            <div className="flex gap-2">
              {timeOptions.map((option) => {
                const isSelected = availableTime === option.value;

                return (
                  <Button
                    key={option.value}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-7 px-3 text-xs transition-all",
                      isSelected && "bg-primary/10 border-primary/30 text-primary",
                      !isSelected && "opacity-60 hover:opacity-100"
                    )}
                    onClick={() => handleTimeChange(option.value)}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Quick filter badges when collapsed */}
      {!isExpanded && hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {currentEnergy && (
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
              "bg-current/10 border border-current/20",
              energyOptions.find(e => e.value === currentEnergy)?.color
            )}>
              {energyOptions.find(e => e.value === currentEnergy)?.label}
            </span>
          )}
          {currentContexts.map((context) => (
            <span
              key={context}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
                contextConfig[context].bgColor,
                contextConfig[context].color
              )}
            >
              {contextConfig[context].label}
            </span>
          ))}
          {availableTime && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
              <Clock className="h-3 w-3" />
              {timeOptions.find(t => t.value === availableTime)?.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
