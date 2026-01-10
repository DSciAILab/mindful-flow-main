import { useMemo, useState } from "react";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Habit } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HabitContributionGraphProps {
  habits: Habit[];
  period?: '90days' | '1year';
}

// Color intensity based on completion percentage
const getColorIntensity = (completedCount: number, totalHabits: number): string => {
  if (totalHabits === 0 || completedCount === 0) {
    return "bg-muted/50";
  }
  
  const percentage = (completedCount / totalHabits) * 100;
  
  if (percentage === 100) return "bg-primary";
  if (percentage >= 75) return "bg-primary/80";
  if (percentage >= 50) return "bg-primary/60";
  if (percentage >= 25) return "bg-primary/40";
  return "bg-primary/20";
};

export function HabitContributionGraph({ habits, period = '90days' }: HabitContributionGraphProps) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  
  // Calculate days to show based on period
  const daysToShow = period === '1year' ? 365 : 90;
  
  // Generate contribution data
  const contributionData = useMemo(() => {
    const today = startOfDay(new Date());
    const startDate = subDays(today, daysToShow - 1);
    
    const days = eachDayOfInterval({ start: startDate, end: today });
    
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      
      // Count how many habits were completed on this day
      const completedCount = habits.filter(habit => 
        habit.completedDays[dateStr]
      ).length;
      
      // Only count active habits that existed on that day
      const activeHabitsOnDay = habits.filter(habit => 
        habit.isActive && startOfDay(habit.createdAt) <= day
      ).length;
      
      return {
        date: day,
        dateStr,
        completedCount,
        totalHabits: activeHabitsOnDay,
      };
    });
  }, [habits, daysToShow]);

  // Group by weeks for display
  const weeks = useMemo(() => {
    const result: typeof contributionData[] = [];
    let currentWeek: typeof contributionData = [];
    
    contributionData.forEach((day, index) => {
      currentWeek.push(day);
      
      // Start new week on Sunday or at end
      if (day.date.getDay() === 6 || index === contributionData.length - 1) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });
    
    return result;
  }, [contributionData]);

  // Month labels
  const monthLabels = useMemo(() => {
    const labels: { month: string; index: number }[] = [];
    let lastMonth = -1;
    
    weeks.forEach((week, weekIndex) => {
      const firstDay = week[0]?.date;
      if (firstDay) {
        const month = firstDay.getMonth();
        if (month !== lastMonth) {
          labels.push({
            month: format(firstDay, 'MMM', { locale: ptBR }),
            index: weekIndex,
          });
          lastMonth = month;
        }
      }
    });
    
    return labels;
  }, [weeks]);

  if (habits.length === 0) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-6 text-center">
        <p className="text-muted-foreground">
          Crie hábitos para visualizar seu progresso aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        Contribuições - Últimos {daysToShow} dias
      </h3>
      
      {/* Month labels */}
      <div className="mb-2 flex text-[10px] text-muted-foreground">
        <div className="w-8" /> {/* Spacer for day labels */}
        {monthLabels.map((label, i) => (
          <div 
            key={i}
            className="flex-shrink-0"
            style={{ 
              marginLeft: i === 0 ? 0 : `${(label.index - (monthLabels[i-1]?.index || 0)) * 14 - 24}px`,
            }}
          >
            {label.month}
          </div>
        ))}
      </div>
      
      {/* Grid */}
      <div className="flex gap-0.5 overflow-x-auto pb-2">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground pr-1">
          <div className="h-3" />
          <div className="h-3">Seg</div>
          <div className="h-3" />
          <div className="h-3">Qua</div>
          <div className="h-3" />
          <div className="h-3">Sex</div>
          <div className="h-3" />
        </div>
        
        {/* Weeks */}
        <TooltipProvider delayDuration={100}>
          <div className="flex gap-0.5">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-0.5">
                {/* Pad the first week if it doesn't start on Sunday */}
                {weekIndex === 0 && week[0] && (
                  Array.from({ length: week[0].date.getDay() }).map((_, i) => (
                    <div key={`pad-${i}`} className="h-3 w-3" />
                  ))
                )}
                
                {week.map((day) => (
                  <Tooltip key={day.dateStr}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "h-3 w-3 rounded-sm cursor-pointer transition-all",
                          getColorIntensity(day.completedCount, day.totalHabits),
                          hoveredDay === day.dateStr && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                        )}
                        onMouseEnter={() => setHoveredDay(day.dateStr)}
                        onMouseLeave={() => setHoveredDay(null)}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-semibold">
                        {format(day.date, "d 'de' MMMM, yyyy", { locale: ptBR })}
                      </p>
                      <p className="text-muted-foreground">
                        {day.completedCount}/{day.totalHabits} hábitos completados
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>
        </TooltipProvider>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
        <span>Menos</span>
        <div className="flex gap-0.5">
          <div className="h-3 w-3 rounded-sm bg-muted/50" />
          <div className="h-3 w-3 rounded-sm bg-primary/20" />
          <div className="h-3 w-3 rounded-sm bg-primary/40" />
          <div className="h-3 w-3 rounded-sm bg-primary/60" />
          <div className="h-3 w-3 rounded-sm bg-primary/80" />
          <div className="h-3 w-3 rounded-sm bg-primary" />
        </div>
        <span>Mais</span>
      </div>
    </div>
  );
}
