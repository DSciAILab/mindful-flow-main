import { useState } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Check, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Flame,
  Target,
  Trophy,
  Archive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Habit } from "@/types";
import { useHabits } from "@/hooks/useHabits";
import { useProjects } from "@/hooks/useProjects";
import { LifeAreaBadge } from "@/components/ui/LifeAreaBadge";
import { HabitCreateModal } from "./HabitCreateModal";

export function HabitTracker() {
  const { habits, loading, toggleHabit, addHabit, deleteHabit } = useHabits();
  const { projects } = useProjects();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const handlePrevWeek = () => setCurrentDate(prev => addDays(prev, -7));
  const handleNextWeek = () => setCurrentDate(prev => addDays(prev, 7));

  const calculateStreak = (habit: Habit) => {
    let streak = 0;
    let checkDate = new Date();
    
    while (true) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      if (habit.completedDays[dateStr]) {
        streak++;
        checkDate = addDays(checkDate, -1);
      } else {
        // If not completed today, maybe it's still ongoing? 
        // Only break if not completed yesterday
        if (isSameDay(checkDate, new Date())) {
          checkDate = addDays(checkDate, -1);
          continue;
        }
        break;
      }
    }
    return streak;
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="h-48" />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Rastreador de Hábitos</h2>
          <p className="text-muted-foreground">Construa consistência dia após dia</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[140px] text-center">
            {format(weekStart, 'd MMM', { locale: ptBR })} - {format(addDays(weekStart, 6), 'd MMM', { locale: ptBR })}
          </span>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Hábito
          </Button>
        </div>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Meus Hábitos</CardTitle>
            <div className="flex gap-4">
              {weekDays.map((day) => (
                <div key={day.toString()} className="flex flex-col items-center w-10">
                  <span className="text-[10px] uppercase text-muted-foreground font-bold">
                    {format(day, 'eee', { locale: ptBR })}
                  </span>
                  <span className={cn(
                    "text-xs font-semibold mt-1",
                    isSameDay(day, new Date()) ? "text-primary" : "text-foreground"
                  )}>
                    {format(day, 'd')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-1">
            {habits.length === 0 ? (
              <div className="py-12 text-center">
                <Target className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Nenhum hábito cadastrado ainda.</p>
                <Button variant="link" onClick={() => addHabit({ title: "Beber Água" })}>
                  Adicionar meu primeiro hábito
                </Button>
              </div>
            ) : (
              habits.map((habit) => {
                const streak = calculateStreak(habit);
                return (
                  <div key={habit.id} className="group flex items-center justify-between py-3 border-b border-border/30 last:border-0 hover:bg-muted/30 rounded-lg px-2 -mx-2 transition-colors">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-1.5 h-8 rounded-full" 
                        style={{ backgroundColor: habit.color }} 
                      />
                      <div>
                        <p className="font-semibold text-foreground">{habit.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {(() => {
                            const project = projects.find(p => p.id === habit.projectId);
                            return project?.areaId ? (
                              <LifeAreaBadge areaId={project.areaId} showName={false} />
                            ) : null;
                          })()}
                          {streak > 0 && (
                            <div className="flex items-center gap-1 text-[10px] bg-orange-500/10 text-orange-500 px-1.5 py-0.5 rounded-full font-bold">
                              <Flame className="h-3 w-3 fill-current" />
                              {streak} DIAS
                            </div>
                          )}
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                            {habit.frequency === 'daily' ? 'Diário' : 'Semanal'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(`Arquivar "${habit.title}"? O histórico será preservado.`)) {
                            deleteHabit(habit.id);
                          }
                        }}
                        className="ml-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                        title="Arquivar hábito (histórico preservado)"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex gap-4">
                      {weekDays.map((day) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const isCompleted = habit.completedDays[dateStr];
                        const isFuture = day > new Date();

                        return (
                          <button
                            key={dateStr}
                            disabled={isFuture}
                            onClick={() => toggleHabit(habit.id, day)}
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 border-2",
                              isCompleted 
                                ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
                                : "bg-muted/50 border-transparent hover:border-primary/50 text-transparent hover:text-primary/50",
                              isFuture && "opacity-20 cursor-not-allowed border-transparent"
                            )}
                          >
                            <Check className={cn("h-5 w-5", isCompleted ? "stroke-[3px]" : "stroke-current")} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Performance Summary */}
      {(() => {
        // Calculate weekly completion: only count days up to today (not future)
        const today = new Date();
        const pastDays = weekDays.filter(day => day <= today);
        
        if (habits.length === 0 || pastDays.length === 0) {
          return null;
        }
        
        let totalExpected = habits.length * pastDays.length;
        let totalCompleted = 0;
        
        habits.forEach(habit => {
          pastDays.forEach(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            if (habit.completedDays[dateStr]) {
              totalCompleted++;
            }
          });
        });
        
        const percentage = totalExpected > 0 
          ? Math.round((totalCompleted / totalExpected) * 100) 
          : 0;
        
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20 text-primary">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Meta Semanal</p>
                    <p className="text-xl font-bold">{percentage}% Concluído</p>
                    <p className="text-[10px] text-muted-foreground">{totalCompleted}/{totalExpected} check-ins</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* ... more stats cards could go here */}
          </div>
        );
      })()}

      {/* Create Habit Modal */}
      <HabitCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={addHabit}
      />
    </div>
  );
}
