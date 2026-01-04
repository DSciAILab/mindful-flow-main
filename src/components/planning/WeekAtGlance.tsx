import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  Sun,
  Moon,
  Coffee,
  Target,
  Users,
  Sparkles,
  ClipboardList,
  LayoutList
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeBlock {
  id: string;
  title: string;
  startHour: number;
  duration: number; // in hours
  type: 'focus' | 'meeting' | 'break' | 'personal' | 'routine';
  completed?: boolean;
}

interface DayPlan {
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  blocks: TimeBlock[];
  energyLevel?: 'high' | 'medium' | 'low';
}

const sampleWeekBlocks: Record<number, TimeBlock[]> = {
  0: [
    { id: '1', title: 'Planejamento semanal', startHour: 9, duration: 1, type: 'focus' },
    { id: '2', title: 'Descanso', startHour: 14, duration: 2, type: 'personal' },
  ],
  1: [
    { id: '3', title: 'Deep work - Projeto A', startHour: 9, duration: 2, type: 'focus', completed: true },
    { id: '4', title: 'Reunião time', startHour: 11, duration: 1, type: 'meeting' },
    { id: '5', title: 'Almoço', startHour: 12, duration: 1, type: 'break' },
    { id: '6', title: 'Emails e admin', startHour: 14, duration: 1, type: 'routine' },
    { id: '7', title: 'Revisão código', startHour: 15, duration: 2, type: 'focus' },
  ],
  2: [
    { id: '8', title: 'Treino', startHour: 7, duration: 1, type: 'personal' },
    { id: '9', title: 'Deep work - Projeto B', startHour: 9, duration: 3, type: 'focus' },
    { id: '10', title: 'Almoço', startHour: 12, duration: 1, type: 'break' },
    { id: '11', title: 'Reunião cliente', startHour: 14, duration: 1.5, type: 'meeting' },
  ],
  3: [
    { id: '12', title: 'Leitura', startHour: 8, duration: 1, type: 'personal' },
    { id: '13', title: 'Deep work', startHour: 9, duration: 2, type: 'focus' },
    { id: '14', title: 'Brainstorm', startHour: 11, duration: 1, type: 'meeting' },
  ],
  4: [
    { id: '15', title: 'Review semanal', startHour: 9, duration: 1, type: 'routine' },
    { id: '16', title: 'Finalizar entregas', startHour: 10, duration: 3, type: 'focus' },
    { id: '17', title: 'Celebrar conquistas!', startHour: 16, duration: 1, type: 'personal' },
  ],
  5: [
    { id: '18', title: 'Hobbies', startHour: 10, duration: 2, type: 'personal' },
  ],
  6: [
    { id: '19', title: 'Tempo família', startHour: 10, duration: 4, type: 'personal' },
  ],
};

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const fullDayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const blockTypeConfig: Record<TimeBlock['type'], { bg: string; text: string; icon: React.ElementType }> = {
  focus: { bg: 'bg-primary/20', text: 'text-primary', icon: Target },
  meeting: { bg: 'bg-accent/20', text: 'text-accent', icon: Users },
  break: { bg: 'bg-status-completed/20', text: 'text-status-completed', icon: Coffee },
  personal: { bg: 'bg-reward-gold/20', text: 'text-reward-gold', icon: Sparkles },
  routine: { bg: 'bg-muted', text: 'text-muted-foreground', icon: ClipboardList },
};

export function WeekAtGlance() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7));

  const weekDays: DayPlan[] = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return {
      dayName: dayNames[i],
      dayNumber: date.getDate(),
      isToday: date.toDateString() === today.toDateString(),
      blocks: sampleWeekBlocks[i] || [],
      energyLevel: i === 0 || i === 6 ? 'low' : i === 2 ? 'high' : 'medium',
    };
  });

  const totalFocusHours = Object.values(sampleWeekBlocks)
    .flat()
    .filter(b => b.type === 'focus')
    .reduce((sum, b) => sum + b.duration, 0);

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const getTimeOfDay = () => {
    const hour = today.getHours();
    if (hour < 12) return { icon: <Sun className="h-4 w-4" />, text: 'manhã' };
    if (hour < 18) return { icon: <Coffee className="h-4 w-4" />, text: 'tarde' };
    return { icon: <Moon className="h-4 w-4" />, text: 'noite' };
  };

  const timeOfDay = getTimeOfDay();

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-card">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
            <LayoutList className="h-5 w-5 text-primary" />
            Visão Semanal
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {timeOfDay.icon}
            <span>Boa {timeOfDay.text}! Você tem {totalFocusHours}h de foco planejadas</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={() => setWeekOffset(weekOffset - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant={weekOffset === 0 ? "default" : "outline"} 
            size="sm"
            onClick={() => setWeekOffset(0)}
          >
            Esta Semana
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setWeekOffset(weekOffset + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week grid - Premium Day Selector */}
      <div className="mb-8 grid grid-cols-7 gap-2 md:gap-4">
        {weekDays.map((day, i) => {
          const isSelected = selectedDay === i;
          return (
            <button
              key={i}
              onClick={() => setSelectedDay(isSelected ? null : i)}
              className={cn(
                "group relative flex flex-col items-center justify-between overflow-hidden rounded-2xl p-2 transition-all duration-300",
                "border border-transparent hover:border-white/10",
                day.isToday && !isSelected && "bg-primary/10 border-primary/20",
                isSelected 
                  ? "h-28 bg-gradient-to-br from-primary to-primary/80 shadow-glow scale-105 z-10" 
                  : "h-24 bg-muted/20 hover:bg-muted/30"
              )}
            >
              <div className="flex flex-col items-center gap-1">
                <span className={cn(
                  "text-xs font-medium uppercase tracking-wider",
                  isSelected ? "text-primary-foreground/90" : "text-muted-foreground"
                )}>
                  {day.dayName}
                </span>
                <span className={cn(
                  "text-2xl font-bold font-display",
                  isSelected ? "text-primary-foreground" : "text-foreground"
                )}>
                  {day.dayNumber}
                </span>
              </div>
              
              <div className="flex gap-1 mb-2">
                {day.blocks.slice(0, 3).map((block) => (
                  <div
                    key={block.id}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full transition-colors",
                      isSelected ? "bg-white/80" : 
                      block.type === 'focus' ? "bg-primary" :
                      block.type === 'meeting' ? "bg-accent" :
                      "bg-muted-foreground/50"
                    )}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day Timeline */}
      {selectedDay !== null && (
        <div className="mb-8 animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-lg font-semibold">
              <span className="text-muted-foreground">{weekDays[selectedDay].dayName},</span>
              <span className="text-foreground">{weekDays[selectedDay].dayNumber}</span>
            </h4>
            <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-3">
            {weekDays[selectedDay].blocks.length > 0 ? (
              weekDays[selectedDay].blocks.map((block) => {
                const config = blockTypeConfig[block.type];
                const Icon = config.icon;
                return (
                  <div
                    key={block.id}
                    className={cn(
                      "group relative flex items-center gap-4 rounded-2xl border border-border/50 bg-card/50 p-4 transition-all hover:bg-card hover:border-border hover:shadow-lg hover:-translate-y-0.5",
                      block.completed && "opacity-60"
                    )}
                  >
                    {/* Status Indicator Strip */}
                    <div className={cn(
                      "absolute left-0 top-3 bottom-3 w-1 rounded-r-full",
                      block.type === 'focus' ? "bg-primary" :
                      block.type === 'meeting' ? "bg-accent" :
                      block.type === 'personal' ? "bg-reward-gold" :
                      "bg-muted-foreground"
                    )} />

                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      block.completed ? "bg-muted text-muted-foreground" : config.bg
                    )}>
                      <Icon className={cn("h-5 w-5", block.completed ? "text-muted-foreground" : config.text)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className={cn(
                        "font-medium truncate",
                        block.completed ? "line-through text-muted-foreground" : "text-foreground"
                      )}>
                        {block.title}
                      </h4>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {formatHour(block.startHour)} - {formatHour(block.startHour + block.duration)}
                          <span className="opacity-50">({block.duration}h)</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                       {/* Placeholder interactions */}
                       <div className={cn(
                         "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors",
                         block.completed 
                           ? "bg-status-completed border-status-completed" 
                           : "border-muted-foreground/30 group-hover:border-primary/50"
                       )}>
                         {block.completed && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                       </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed border-border/50 bg-muted/5">
                <Sun className="h-10 w-10 text-muted-foreground/20 mb-3" />
                <p className="text-muted-foreground">Dia livre! Aproveite para descansar ou planejar algo novo.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Block type legend */}
      <div className="flex flex-wrap gap-4 border-t border-border/50 pt-4">
        {Object.entries(blockTypeConfig).map(([type, config]) => {
          const Icon = config.icon;
          return (
            <div key={type} className="flex items-center gap-2">
              <div className={cn("p-1 rounded bg-muted/50")}>
                <Icon className={cn("h-3.5 w-3.5", config.text)} />
              </div>
              <span className="text-xs font-medium capitalize text-muted-foreground">{type}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
