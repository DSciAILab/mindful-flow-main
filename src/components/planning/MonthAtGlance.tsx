import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Star,
  CalendarRange
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarSync } from "./CalendarSync";
import { CalendarEvent } from "@/lib/calendar-ics";

interface DayEvent {
  id: string;
  title: string;
  type: 'task' | 'event' | 'habit' | 'milestone';
  priority?: 'urgent' | 'high' | 'medium' | 'low';
}

interface DayData {
  date: number;
  events: DayEvent[];
  mood?: number;
}

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const sampleEvents: Record<number, DayEvent[]> = {
  5: [{ id: '1', title: 'Reunião de projeto', type: 'event' }],
  8: [
    { id: '2', title: 'Deadline relatório', type: 'task', priority: 'urgent' },
    { id: '3', title: 'Médico', type: 'event' }
  ],
  12: [{ id: '4', title: 'Apresentação', type: 'milestone' }],
  15: [{ id: '5', title: 'Treino', type: 'habit' }],
  20: [{ id: '6', title: 'Viagem!', type: 'event' }],
  25: [{ id: '7', title: 'Review mensal', type: 'task', priority: 'high' }],
};

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function MonthAtGlance() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showSync, setShowSync] = useState(false);
  const today = new Date();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Convert sample events to CalendarEvent format for export
  const convertToCalendarEvents = (): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    Object.entries(sampleEvents).forEach(([day, dayEvents]) => {
      dayEvents.forEach((event) => {
        const startDate = new Date(year, month, parseInt(day), 9, 0);
        const endDate = new Date(year, month, parseInt(day), 10, 0);
        events.push({
          id: event.id,
          title: event.title,
          startDate,
          endDate,
          type: event.type,
          priority: event.priority,
        });
      });
    });
    return events;
  };

  const handleImportEvents = (imported: CalendarEvent[]) => {
    console.log('Imported events:', imported);
    // TODO: Add to local state or persist to database
  };

  const isToday = (day: number) => 
    today.getDate() === day && 
    today.getMonth() === month && 
    today.getFullYear() === year;

  const isPast = (day: number) => {
    const date = new Date(year, month, day);
    return date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const getEventTypeStyle = (type: DayEvent['type']) => {
    switch (type) {
      case 'task': return 'bg-primary/20 text-primary';
      case 'event': return 'bg-accent/20 text-accent';
      case 'habit': return 'bg-status-completed/20 text-status-completed';
      case 'milestone': return 'bg-reward-gold/20 text-reward-gold';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityDot = (priority?: DayEvent['priority']) => {
    if (!priority) return null;
    const colors: Record<string, string> = {
      urgent: 'bg-priority-urgent',
      high: 'bg-priority-high',
      medium: 'bg-priority-medium',
      low: 'bg-priority-low',
    };
    return <span className={cn("h-1.5 w-1.5 rounded-full", colors[priority])} />;
  };

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Monthly stats
  const totalEvents = Object.values(sampleEvents).flat().length;
  const completedEvents = 3; // Sample

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-card">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
            <CalendarRange className="h-5 w-5 text-primary" />
            Visão Mensal
          </h3>
          <p className="text-sm text-muted-foreground">Planeje seu mês com clareza</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={showSync ? "default" : "outline"} 
            size="sm"
            onClick={() => setShowSync(!showSync)}
          >
            <CalendarRange className="mr-1 h-4 w-4" />
            Sincronizar
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-32 text-center font-display text-lg font-semibold text-foreground">
            {monthNames[month]} {year}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar sync */}
      {showSync && (
        <div className="mb-6">
          <CalendarSync 
            events={convertToCalendarEvents()} 
            onImport={handleImportEvents} 
          />
        </div>
      )}

      {/* Monthly summary */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-muted/30 p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{totalEvents}</p>
          <p className="text-xs text-muted-foreground">Eventos</p>
        </div>
        <div className="rounded-xl bg-status-completed/10 p-3 text-center">
          <p className="text-2xl font-bold text-status-completed">{completedEvents}</p>
          <p className="text-xs text-muted-foreground">Concluídos</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-3 text-center">
          <p className="text-2xl font-bold text-primary">{daysInMonth - today.getDate()}</p>
          <p className="text-xs text-muted-foreground">Dias restantes</p>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="mb-4 grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div 
            key={day} 
            className="py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}

        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dayEvents = sampleEvents[day] || [];
          const hasEvents = dayEvents.length > 0;

          return (
            <button
              key={day}
              className={cn(
                "group relative aspect-square rounded-xl p-1 text-sm transition-all duration-200",
                isToday(day) 
                  ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2" 
                  : isPast(day)
                    ? "bg-muted/20 text-muted-foreground hover:bg-muted/40"
                    : "bg-muted/30 text-foreground hover:bg-muted/50",
                hasEvents && !isToday(day) && "bg-accent/10"
              )}
            >
              <span className={cn(
                "font-medium",
                isToday(day) && "font-bold"
              )}>
                {day}
              </span>
              
              {hasEvents && (
                <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
                  {dayEvents.slice(0, 3).map((event) => (
                    <span 
                      key={event.id}
                      className={cn(
                        "h-1 w-1 rounded-full",
                        event.type === 'milestone' ? "bg-reward-gold" : 
                        event.priority === 'urgent' ? "bg-priority-urgent" : "bg-primary"
                      )}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Upcoming events */}
      <div>
        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Star className="h-4 w-4 text-reward-gold" />
          Próximos Eventos
        </h4>
        <div className="space-y-2">
          {Object.entries(sampleEvents)
            .filter(([day]) => parseInt(day) >= today.getDate())
            .slice(0, 4)
            .map(([day, events]) => (
              events.map((event) => (
                <div 
                  key={event.id}
                  className="flex items-center gap-3 rounded-lg bg-muted/30 p-2"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-foreground">
                    {day}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{event.title}</p>
                  </div>
                  <span className={cn("rounded-md px-2 py-0.5 text-xs", getEventTypeStyle(event.type))}>
                    {event.type}
                  </span>
                  {getPriorityDot(event.priority)}
                </div>
              ))
            ))}
        </div>
      </div>
    </div>
  );
}
