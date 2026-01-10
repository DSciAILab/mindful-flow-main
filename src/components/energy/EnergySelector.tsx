import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Battery, BatteryMedium, BatteryFull } from "lucide-react";
import type { EnergyLevel } from "@/types";

interface EnergySelectorProps {
  value: EnergyLevel;
  onChange: (level: EnergyLevel) => void;
  size?: 'sm' | 'md' | 'lg';
}

const energyConfig: Record<EnergyLevel, {
  icon: typeof Battery;
  label: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  low: {
    icon: Battery,
    label: 'Baixa',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30',
    description: 'Tarefas simples e rápidas',
  },
  medium: {
    icon: BatteryMedium,
    label: 'Média',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30',
    description: 'Tarefas moderadas',
  },
  high: {
    icon: BatteryFull,
    label: 'Alta',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30',
    description: 'Tarefas complexas e criativas',
  },
};

export const EnergySelector = ({ value, onChange, size = 'md' }: EnergySelectorProps) => {
  const levels: EnergyLevel[] = ['low', 'medium', 'high'];

  const sizeClasses = {
    sm: 'h-8 text-xs px-2 gap-1',
    md: 'h-10 text-sm px-3 gap-2',
    lg: 'h-12 text-base px-4 gap-2',
  };

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-muted-foreground">
        Energia Necessária
      </label>
      <div className="flex gap-2">
        {levels.map((level) => {
          const config = energyConfig[level];
          const Icon = config.icon;
          const isSelected = value === level;

          return (
            <Button
              key={level}
              type="button"
              variant="outline"
              className={cn(
                sizeClasses[size],
                "flex items-center border transition-all duration-200",
                isSelected && [config.bgColor, config.color, "border-2"],
                !isSelected && "opacity-60 hover:opacity-100"
              )}
              onClick={() => onChange(level)}
            >
              <Icon className={cn(iconSizes[size], isSelected && config.color)} />
              <span>{config.label}</span>
            </Button>
          );
        })}
      </div>
      {value && (
        <p className="text-xs text-muted-foreground">
          {energyConfig[value].description}
        </p>
      )}
    </div>
  );
};

export { energyConfig };
