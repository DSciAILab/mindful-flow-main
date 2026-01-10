import { useState } from "react";
import { format } from "date-fns";
import { 
  Check, 
  Flame, 
  MoreVertical,
  Pencil,
  Trash2,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { HabitWithStats, Habit } from "@/types";
import confetti from "canvas-confetti";

interface HabitCardProps {
  habit: HabitWithStats;
  onToggle: (habitId: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
}

// Motivational messages based on streak
const getMotivationalMessage = (streak: number): string => {
  if (streak >= 30) return "Lendário! 🏆";
  if (streak >= 21) return "Hábito formado! 🎯";
  if (streak >= 14) return "Duas semanas! 💪";
  if (streak >= 7) return "Uma semana! 🔥";
  if (streak >= 3) return "Construindo! ⭐";
  if (streak >= 1) return "Continue assim!";
  return "Comece agora! ✨";
};

// Celebration animation
const celebrate = () => {
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#8B5CF6', '#10B981', '#F59E0B', '#EC4899'],
    disableForReducedMotion: true,
  });
};

export function HabitCard({ habit, onToggle, onEdit, onDelete }: HabitCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  
  const handleToggle = async () => {
    if (!habit.completedToday) {
      // Celebrate when completing
      setIsAnimating(true);
      celebrate();
      setTimeout(() => setIsAnimating(false), 600);
    }
    onToggle(habit.id);
  };

  const frequencyLabel = {
    daily: 'Diário',
    weekly: 'Semanal',
    specific_days: 'Dias específicos',
  }[habit.frequency];

  const isDue = habit.isDueToday ?? true;
  const isDimmed = !isDue && !habit.completedToday;

  return (
    <div 
      className={cn(
        "group relative flex items-center gap-4 rounded-2xl border p-4 pl-5 transition-all duration-300 overflow-hidden",
        habit.completedToday 
          ? "border-primary/30 bg-primary/5" 
          : isDimmed
            ? "border-border/40 bg-muted/20 border-dashed opacity-75 hover:opacity-100" // Dimmed style
            : "border-border/50 bg-card hover:border-border"
      )}
    >
      {/* Color indicator - now properly clips with parent's overflow-hidden */}
      <div 
        className={cn(
          "absolute inset-y-0 left-0 w-1.5",
          isDimmed ? "opacity-30" : "opacity-100"
        )}
        style={{ backgroundColor: habit.color }}
      />
      
      {/* Check button */}
      <button
        onClick={handleToggle}
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 transition-all duration-300",
          habit.completedToday
            ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
            : isDimmed
              ? "border-muted-foreground/20 bg-muted/30 text-muted-foreground/40 hover:border-primary/50 hover:text-primary"
              : "border-muted-foreground/30 bg-muted/50 text-muted-foreground hover:border-primary hover:text-primary",
          isAnimating && "scale-110"
        )}
      >
        <Check className={cn("h-6 w-6", habit.completedToday && "stroke-[3px]")} />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={cn(
            "font-semibold truncate transition-colors",
            habit.completedToday ? "text-primary" : isDimmed ? "text-muted-foreground" : "text-foreground"
          )}>
            {habit.title}
          </h3>
          
          {/* Streak badge */}
          {habit.streak.currentStreak > 0 && (
            <div className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
              isDimmed 
                ? "bg-slate-500/10 text-slate-500 grayscale opacity-70"
                : "bg-orange-500/10 text-orange-500"
            )}>
              <Flame className="h-3 w-3 fill-current" />
              {habit.streak.currentStreak}
            </div>
          )}
        </div>
        
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          {isDimmed ? (
             <span className="font-medium text-muted-foreground/70 flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
               Fora da agenda
             </span>
          ) : (
            <span className="uppercase tracking-wider font-medium">{frequencyLabel}</span>
          )}
          <span>•</span>
          <span>{habit.completionRate}% <span className="hidden sm:inline">nos últimos 30 dias</span></span>
        </div>
        
        {habit.streak.currentStreak > 0 && !isDimmed && (
          <p className="mt-1 text-xs text-muted-foreground/80">
            {getMotivationalMessage(habit.streak.currentStreak)}
          </p>
        )}
      </div>

      {/* Completion indicator */}
      {habit.completedToday && (
        <div className="flex items-center gap-1 text-xs font-medium text-primary">
          <Sparkles className="h-4 w-4" />
          Feito!
        </div>
      )}

      {/* Actions menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(habit)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => onDelete(habit.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Arquivar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
