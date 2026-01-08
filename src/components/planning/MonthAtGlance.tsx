import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Star,
  CalendarRange,
  Loader2,
  CheckSquare,
  Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarSync } from "./CalendarSync";
import { EventModal } from "./EventModal";
import { CalendarEvent as ICSEvent } from "@/lib/calendar-ics";
import { useCalendar, CalendarEvent, EventType } from "@/hooks/useCalendar";
import { useTasks } from "@/hooks/useTasks";
import { useHabits } from "@/hooks/useHabits";
import { format } from "date-fns";

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Unified calendar item type
interface CalendarItem {
  id: string;
  title: string;
  type: 'event' | 'task' | 'habit';
  subType?: EventType | string;
  startTime?: Date;
  isCompleted?: boolean;
  priority?: string;
  color?: string;
}

const getItemStyle = (item: CalendarItem) => {
  if (item.type === 'task') {
    return item.isCompleted 
      ? 'bg-gray-500/20 text-gray-400 line-through' 
      : 'bg-primary/20 text-primary';
  }
  if (item.type === 'habit') {
    return item.isCompleted 
      ? 'bg-green-500/20 text-green-400' 
      : 'bg-orange-500/20 text-orange-400';
  }
  // Event types
  switch (item.subType as EventType) {
    case 'focus': return 'bg-purple-500/20 text-purple-400';
    case 'meeting': return 'bg-blue-500/20 text-blue-400';
    case 'break': return 'bg-gray-500/20 text-gray-400';
    case 'personal': return 'bg-green-500/20 text-green-400';
    case 'routine': return 'bg-orange-500/20 text-orange-400';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getItemDot = (item: CalendarItem) => {
  if (item.type === 'task') return item.isCompleted ? 'bg-gray-500' : 'bg-primary';
  if (item.type === 'habit') return item.isCompleted ? 'bg-green-500' : 'bg-orange-500';
  switch (item.subType as EventType) {
    case 'focus': return 'bg-purple-500';
    case 'meeting': return 'bg-blue-500';
    case 'break': return 'bg-gray-500';
    case 'personal': return 'bg-green-500';
    case 'routine': return 'bg-orange-500';
    default: return 'bg-primary';
  }
};

export function MonthAtGlance() {
  const { events, loading: eventsLoading, addEvent, updateEvent, deleteEvent } = useCalendar();
  const { tasks, loading: tasksLoading } = useTasks();
  const { habits, loading: habitsLoading } = useHabits();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showSync, setShowSync] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const today = new Date();

  const loading = eventsLoading || tasksLoading || habitsLoading;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Group all items (events, tasks, habits) by day
  const itemsByDay = useMemo(() => {
    const grouped: Record<number, CalendarItem[]> = {};
    
    // Add events
    events.forEach(event => {
      const eventDate = new Date(event.start_time);
      if (eventDate.getMonth() === month && eventDate.getFullYear() === year) {
        const day = eventDate.getDate();
        if (!grouped[day]) grouped[day] = [];
        grouped[day].push({
          id: event.id,
          title: event.title,
          type: 'event',
          subType: event.type,
          startTime: eventDate,
        });
      }
    });

    // Add tasks with due dates
    tasks.forEach(task => {
      if (task.dueDate) {
        const taskDate = new Date(task.dueDate);
        if (taskDate.getMonth() === month && taskDate.getFullYear() === year) {
          const day = taskDate.getDate();
          if (!grouped[day]) grouped[day] = [];
          grouped[day].push({
            id: task.id,
            title: task.title,
            type: 'task',
            isCompleted: task.status === 'done',
            priority: task.priority,
          });
        }
      }
    });

    // Add habits (recurring based on frequency)
    habits.forEach(habit => {
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = format(new Date(year, month, day), 'yyyy-MM-dd');
        const dayOfWeek = new Date(year, month, day).getDay();
        
        // Check if habit is scheduled for this day based on frequency
        const isScheduled = habit.frequency === 'daily' || 
          (habit.daysOfWeek && habit.daysOfWeek.includes(dayOfWeek));
        
        if (isScheduled) {
          if (!grouped[day]) grouped[day] = [];
          grouped[day].push({
            id: `habit-${habit.id}-${dateStr}`,
            title: habit.title,
            type: 'habit',
            isCompleted: habit.completedDays[dateStr] === true,
            color: habit.color,
          });
        }
      }
    });

    return grouped;
  }, [events, tasks, habits, month, year, daysInMonth]);

  // Convert events to ICS format for export
  const convertToCalendarEvents = (): ICSEvent[] => {
    return events
      .filter(e => {
        const d = new Date(e.start_time);
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .map(event => ({
        id: event.id,
        title: event.title,
        startDate: new Date(event.start_time),
        endDate: new Date(event.end_time),
        type: event.type,
      }));
  };

  const handleImportEvents = (imported: ICSEvent[]) => {
    console.log('Imported events:', imported);
  };

  const isToday = (day: number) => 
    today.getDate() === day && 
    today.getMonth() === month && 
    today.getFullYear() === year;

  const isPast = (day: number) => {
    const date = new Date(year, month, day);
    return date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(year, month, day);
    setSelectedDate(clickedDate);
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setSelectedDate(undefined);
    setShowEventModal(true);
  };

  const handleNewEvent = () => {
    setSelectedEvent(null);
    setSelectedDate(new Date());
    setShowEventModal(true);
  };

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Stats
  const totalItems = Object.values(itemsByDay).flat().length;
  const upcomingTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) >= today && t.status !== 'done').length;
  const habitsToday = habits.filter(h => {
    const dayOfWeek = today.getDay();
    return h.frequency === 'daily' || (h.daysOfWeek && h.daysOfWeek.includes(dayOfWeek));
  }).length;

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-card">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
            <CalendarRange className="h-5 w-5 text-primary" />
            Visão Mensal
          </h3>
          <p className="text-sm text-muted-foreground">Eventos, tarefas e hábitos integrados</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleNewEvent}>
            <Plus className="mr-1 h-4 w-4" />
            Evento
          </Button>
          <Button variant={showSync ? "default" : "ghost"} size="sm" onClick={() => setShowSync(!showSync)}>
            <CalendarRange className="h-4 w-4" />
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
          <CalendarSync events={convertToCalendarEvents()} onImport={handleImportEvents} />
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-muted/30 p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{totalItems}</p>
          <p className="text-xs text-muted-foreground">Este mês</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <CheckSquare className="h-4 w-4 text-primary" />
            <p className="text-2xl font-bold text-primary">{upcomingTasks}</p>
          </div>
          <p className="text-xs text-muted-foreground">Tarefas</p>
        </div>
        <div className="rounded-xl bg-orange-500/10 p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <Flame className="h-4 w-4 text-orange-500" />
            <p className="text-2xl font-bold text-orange-500">{habitsToday}</p>
          </div>
          <p className="text-xs text-muted-foreground">Hábitos hoje</p>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {/* Calendar grid */}
      {!loading && (
        <>
          <div className="mb-4 grid grid-cols-7 gap-1">
            {weekDays.map((day) => (
              <div key={day} className="py-2 text-center text-xs font-medium text-muted-foreground">
                {day}
              </div>
            ))}

            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dayItems = itemsByDay[day] || [];
              const hasItems = dayItems.length > 0;
              const hasTask = dayItems.some(i => i.type === 'task' && !i.isCompleted);
              const hasHabit = dayItems.some(i => i.type === 'habit');

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "group relative aspect-square rounded-xl p-1 text-sm transition-all duration-200",
                    isToday(day) 
                      ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2" 
                      : isPast(day)
                        ? "bg-muted/20 text-muted-foreground hover:bg-muted/40"
                        : "bg-muted/30 text-foreground hover:bg-muted/50",
                    hasTask && !isToday(day) && "ring-1 ring-primary/30",
                    hasItems && !isToday(day) && "bg-accent/10"
                  )}
                >
                  <span className={cn("font-medium", isToday(day) && "font-bold")}>
                    {day}
                  </span>
                  
                  {hasItems && (
                    <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
                      {dayItems.slice(0, 4).map((item, idx) => (
                        <span key={idx} className={cn("h-1 w-1 rounded-full", getItemDot(item))} />
                      ))}
                      {dayItems.length > 4 && (
                        <span className="text-[8px] text-muted-foreground">+{dayItems.length - 4}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mb-4 flex flex-wrap gap-3 border-t border-border/50 pt-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">Tarefa</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              <span className="text-muted-foreground">Hábito</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">Evento</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Concluído</span>
            </div>
          </div>

          {/* Upcoming items */}
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Star className="h-4 w-4 text-reward-gold" />
              Próximos
            </h4>
            {Object.entries(itemsByDay)
              .filter(([day]) => parseInt(day) >= today.getDate() || month > today.getMonth() || year > today.getFullYear())
              .slice(0, 5)
              .flatMap(([day, items]) => items.slice(0, 2).map(item => ({ day, item })))
              .slice(0, 5)
              .length === 0 ? (
              <div className="rounded-lg bg-muted/30 p-4 text-center">
                <p className="text-sm text-muted-foreground">Nenhum item agendado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(itemsByDay)
                  .filter(([day]) => parseInt(day) >= today.getDate())
                  .slice(0, 5)
                  .flatMap(([day, items]) => items.slice(0, 2).map(item => ({ day, item })))
                  .slice(0, 5)
                  .map(({ day, item }) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-lg bg-muted/30 p-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-foreground">
                        {day}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={cn("truncate text-sm font-medium text-foreground", item.isCompleted && "line-through opacity-60")}>
                          {item.title}
                        </p>
                      </div>
                      <span className={cn("rounded-md px-2 py-0.5 text-xs", getItemStyle(item))}>
                        {item.type === 'task' ? 'Tarefa' : item.type === 'habit' ? 'Hábito' : 'Evento'}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Event Modal */}
      <EventModal
        open={showEventModal}
        onOpenChange={setShowEventModal}
        event={selectedEvent}
        selectedDate={selectedDate}
        onSave={addEvent}
        onUpdate={updateEvent}
        onDelete={deleteEvent}
      />
    </div>
  );
}
