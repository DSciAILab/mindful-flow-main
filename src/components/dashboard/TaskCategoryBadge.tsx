import { cn } from '@/lib/utils';

export type TaskCategory = 'red' | 'yellow' | 'purple' | 'green';

interface TaskCategoryBadgeProps {
  category: TaskCategory | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const CATEGORY_CONFIG: Record<TaskCategory, { color: string; bg: string; label: string; emoji: string; description: string }> = {
  red: {
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    label: 'Urgente',
    emoji: '🔴',
    description: 'Envolve outras pessoas',
  },
  yellow: {
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    label: 'Melhor Fazer',
    emoji: '🟡',
    description: 'Tarefas domésticas/chatas',
  },
  purple: {
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    label: 'Feel Good',
    emoji: '🟣',
    description: 'Me faz sentir bem',
  },
  green: {
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    label: 'Nice to Have',
    emoji: '🟢',
    description: 'Seria bom se eu pudesse',
  },
};

const SIZE_CONFIG = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function TaskCategoryBadge({ 
  category, 
  size = 'md', 
  showLabel = false,
  className 
}: TaskCategoryBadgeProps) {
  if (!category) return null;

  const config = CATEGORY_CONFIG[category];
  if (!config) return null;

  if (showLabel) {
    return (
      <span 
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
          config.bg,
          config.color,
          className
        )}
        title={config.description}
      >
        <span className={SIZE_CONFIG[size]}>{config.emoji}</span>
        {config.label}
      </span>
    );
  }

  return (
    <span 
      className={cn(
        "inline-flex items-center justify-center",
        SIZE_CONFIG[size],
        className
      )}
      title={`${config.label}: ${config.description}`}
    >
      {config.emoji}
    </span>
  );
}

interface TaskCategorySelectorProps {
  value: TaskCategory | null | undefined;
  onChange: (category: TaskCategory) => void;
  className?: string;
}

export function TaskCategorySelector({ value, onChange, className }: TaskCategorySelectorProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {(Object.keys(CATEGORY_CONFIG) as TaskCategory[]).map((cat) => {
        const config = CATEGORY_CONFIG[cat];
        const isSelected = value === cat;
        
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
              isSelected 
                ? cn(config.bg, config.color, "ring-2 ring-primary ring-offset-2")
                : "border-border bg-muted/50 hover:bg-muted"
            )}
          >
            <span>{config.emoji}</span>
            <span className="hidden sm:inline">{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function getCategoryColor(category: TaskCategory | null | undefined): string {
  if (!category) return 'bg-gray-400';
  
  switch (category) {
    case 'red': return 'bg-red-500';
    case 'yellow': return 'bg-yellow-500';
    case 'purple': return 'bg-purple-500';
    case 'green': return 'bg-green-500';
    default: return 'bg-gray-400';
  }
}

export { CATEGORY_CONFIG };
