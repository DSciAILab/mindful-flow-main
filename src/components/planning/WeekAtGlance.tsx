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

      {/* Week grid */}
      <div className="mb-6 grid grid-cols-7 gap-2">
        {weekDays.map((day, i) => (
          <button
            key={i}
            onClick={() => setSelectedDay(selectedDay === i ? null : i)}
            className={cn(
              "rounded-xl p-3 text-center transition-all duration-200",
              day.isToday 
                ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2" 
                : selectedDay === i
                  ? "bg-accent/20 ring-2 ring-accent"
                  : "bg-muted/30 hover:bg-muted/50"
            )}
          >
            <p className={cn(
              "text-xs",
              day.isToday ? "text-primary-foreground/80" : "text-muted-foreground"
            )}>
              {day.dayName}
            </p>
            <p className="text-xl font-bold">{day.dayNumber}</p>
            <div className="mt-1 flex justify-center gap-0.5">
              {day.blocks.slice(0, 3).map((block) => (
                <span 
                  key={block.id}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    block.completed ? "bg-status-completed" : 
                    block.type === 'focus' ? "bg-primary" : 
                    block.type === 'meeting' ? "bg-accent" : "bg-muted-foreground"
                  )}
                />
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Day detail view */}
      {selectedDay !== null && (
        <div className="mb-6 animate-fade-in rounded-xl bg-muted/20 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-semibold text-foreground">
              {fullDayNames[selectedDay]} - {weekDays[selectedDay].dayNumber}
            </h4>
            <Button variant="ghost" size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Adicionar
            </Button>
          </div>
          <div className="space-y-2">
            {weekDays[selectedDay].blocks.length > 0 ? (
              weekDays[selectedDay].blocks.map((block) => {
                const config = blockTypeConfig[block.type];
                const Icon = config.icon;
                return (
                  <div
                    key={block.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg p-3",
                      config.bg
                    )}
                  >
                    <Icon className={cn("h-5 w-5", config.text)} />
                    <div className="flex-1">
                      <p className={cn(
                        "text-sm font-medium",
                        block.completed ? "line-through text-muted-foreground" : "text-foreground"
                      )}>
                        {block.title}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatHour(block.startHour)} - {formatHour(block.startHour + block.duration)}
                        <span className="ml-1">({block.duration}h)</span>
                      </p>
                    </div>
                    {block.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-status-completed" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                );
              })
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhum bloco planejado. Adicione atividades!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Block type legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(blockTypeConfig).map(([type, config]) => {
          const Icon = config.icon;
          return (
            <div key={type} className="flex items-center gap-1.5">
              <Icon className={cn("h-4 w-4", config.text)} />
              <span className="text-xs capitalize text-muted-foreground">{type}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
