import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Briefcase, 
  Phone, 
  Laptop, 
  ShoppingCart, 
  Globe,
  X
} from "lucide-react";
import type { TaskContext } from "@/types";

interface ContextSelectorProps {
  value: TaskContext[];
  onChange: (contexts: TaskContext[]) => void;
  allowCustom?: boolean;
}

const contextConfig: Record<TaskContext, {
  icon: typeof Home;
  label: string;
  color: string;
  bgColor: string;
}> = {
  '@home': {
    icon: Home,
    label: 'Casa',
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/30',
  },
  '@work': {
    icon: Briefcase,
    label: 'Trabalho',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30',
  },
  '@phone': {
    icon: Phone,
    label: 'Telefone',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30',
  },
  '@computer': {
    icon: Laptop,
    label: 'Computador',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30',
  },
  '@errands': {
    icon: ShoppingCart,
    label: 'Rua',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30',
  },
  '@anywhere': {
    icon: Globe,
    label: 'Qualquer lugar',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/30',
  },
};

const allContexts: TaskContext[] = [
  '@home',
  '@work',
  '@phone',
  '@computer',
  '@errands',
  '@anywhere',
];

export const ContextSelector = ({ value, onChange }: ContextSelectorProps) => {
  const toggleContext = (context: TaskContext) => {
    if (value.includes(context)) {
      onChange(value.filter((c) => c !== context));
    } else {
      onChange([...value, context]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted-foreground">
          Contextos
        </label>
        {value.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-muted-foreground hover:text-foreground"
            onClick={clearAll}
          >
            <X className="h-3 w-3 mr-1" />
            Limpar
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {allContexts.map((context) => {
          const config = contextConfig[context];
          const Icon = config.icon;
          const isSelected = value.includes(context);

          return (
            <Button
              key={context}
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "h-8 px-3 gap-1.5 transition-all duration-200 border",
                isSelected && [config.bgColor, config.color, "border-2"],
                !isSelected && "opacity-60 hover:opacity-100"
              )}
              onClick={() => toggleContext(context)}
            >
              <Icon className={cn("h-3.5 w-3.5", isSelected && config.color)} />
              <span className="text-xs">{config.label}</span>
            </Button>
          );
        })}
      </div>
      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {value.length} contexto{value.length > 1 ? 's' : ''} selecionado{value.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};

export { contextConfig, allContexts };
