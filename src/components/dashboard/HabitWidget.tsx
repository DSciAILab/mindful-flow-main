import { format, startOfToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Flame, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHabits } from "@/hooks/useHabits";
import { Button } from "@/components/ui/button";

export function HabitWidget() {
  const { habits, loading, toggleHabit } = useHabits();
  const today = startOfToday();
  const todayStr = format(today, 'yyyy-MM-dd');

  if (loading) return <div className="h-48 animate-pulse bg-muted rounded-2xl" />;

  const completedToday = habits.filter(h => h.completedDays[todayStr]).length;
  const totalHabits = habits.length;
  const progress = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0;

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <h3 className="font-semibold text-foreground">Hábitos de Hoje</h3>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {completedToday}/{totalHabits} concluídos
        </span>
      </div>

      {totalHabits > 0 && (
        <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div 
            className="h-full bg-orange-500 transition-all duration-500" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      )}

      <div className="space-y-2">
        {habits.slice(0, 4).map((habit) => {
          const isCompleted = habit.completedDays[todayStr];
          return (
            <button
              key={habit.id}
              onClick={() => toggleHabit(habit.id, today)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl p-2.5 transition-all duration-200",
                isCompleted 
                  ? "bg-orange-500/10 text-orange-600" 
                  : "bg-muted/50 text-foreground hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-3">
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">{habit.title}</span>
              </div>
              <div 
                className="h-2 w-2 rounded-full" 
                style={{ backgroundColor: habit.color }} 
              />
            </button>
          );
        })}

        {totalHabits === 0 && (
          <div className="py-4 text-center">
            <p className="text-xs text-muted-foreground">Nenhum hábito para hoje.</p>
          </div>
        )}
      </div>
    </div>
  );
}
