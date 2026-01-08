import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  Sun,
  Moon,
  Coffee,
  Target,
  Users,
  Sparkles,
  ClipboardList,
  LayoutList,
  Loader2,
  CheckSquare,
  Flame,
  GripVertical
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EventModal } from "./EventModal";
import { useCalendar, CalendarEvent, EventType } from "@/hooks/useCalendar";
import { useTasks } from "@/hooks/useTasks";
import { useHabits } from "@/hooks/useHabits";
import { format } from "date-fns";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const blockTypeConfig: Record<EventType, { bg: string; text: string; icon: React.ElementType }> = {
  focus: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: Target },
  meeting: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Users },
  break: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: Coffee },
  personal: { bg: 'bg-green-500/20', text: 'text-green-400', icon: Sparkles },
  routine: { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: ClipboardList },
};

// Unified item type for calendar
interface CalendarItem {
  id: string;
  title: string;
  type: 'event' | 'task' | 'habit';
  subType?: EventType;
  startTime?: Date;
  endTime?: Date;
  isCompleted?: boolean;
  priority?: string;
  color?: string;
  originalData?: any;
}

// Draggable item component
function DraggableItem({ item, children, isDragging }: { item: CalendarItem; children: React.ReactNode; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: item.id,
    data: item,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000,
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...attributes} className={cn(isDragging && "opacity-50")}>
      <div {...listeners} className="cursor-grab active:cursor-grabbing">
        {children}
      </div>
    </div>
  );
}

// Droppable day column
function DroppableDay({ dayIndex, isOver, children }: { dayIndex: number; isOver: boolean; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({
    id: `day-${dayIndex}`,
    data: { dayIndex },
  });

  return (
    <div 
      ref={setNodeRef} 
      className={cn(
        "space-y-3 transition-colors",
        isOver && "bg-primary/5 rounded-lg"
      )}
    >
      {children}
    </div>
  );
}

export function WeekAtGlance() {
  const { events, loading: eventsLoading, addEvent, updateEvent, deleteEvent } = useCalendar();
  const { tasks, loading: tasksLoading, updateTask } = useTasks();
  const { habits, loading: habitsLoading, toggleHabit } = useHabits();
  
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<CalendarItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7));

  const loading = eventsLoading || tasksLoading || habitsLoading;

  // Create week days with all items
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayOfWeek = date.getDay();

      const items: CalendarItem[] = [];

      // Add events for this day
      events.forEach(event => {
        const eventDate = new Date(event.start_time);
        if (eventDate.toDateString() === date.toDateString()) {
          items.push({
            id: event.id,
            title: event.title,
            type: 'event',
            subType: event.type,
            startTime: eventDate,
            endTime: new Date(event.end_time),
            originalData: event,
          });
        }
      });

      // Add tasks with due dates
      tasks.forEach(task => {
        if (task.dueDate) {
          const taskDate = new Date(task.dueDate);
          if (taskDate.toDateString() === date.toDateString()) {
            items.push({
              id: `task-${task.id}`,
              title: task.title,
              type: 'task',
              isCompleted: task.status === 'done',
              priority: task.priority,
              originalData: task,
            });
          }
        }
      });

      // Add habits for this day
      habits.forEach(habit => {
        const isScheduled = habit.frequency === 'daily' || 
          (habit.daysOfWeek && habit.daysOfWeek.includes(dayOfWeek));
        
        if (isScheduled) {
          items.push({
            id: `habit-${habit.id}-${dateStr}`,
            title: habit.title,
            type: 'habit',
            isCompleted: habit.completedDays[dateStr] === true,
            color: habit.color,
            originalData: { ...habit, dateStr },
          });
        }
      });

      // Sort by time if available
      items.sort((a, b) => {
        if (a.startTime && b.startTime) return a.startTime.getTime() - b.startTime.getTime();
        if (a.type === 'event') return -1;
        if (b.type === 'event') return 1;
        if (a.type === 'task') return -1;
        return 1;
      });

      return {
        dayName: dayNames[i],
        dayNumber: date.getDate(),
        date,
        isToday: date.toDateString() === today.toDateString(),
        items,
      };
    });
  }, [startOfWeek.toDateString(), events, tasks, habits]);

  const totalFocusHours = useMemo(() => {
    return events
      .filter(e => {
        const d = new Date(e.start_time);
        return d >= startOfWeek && d < new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
      })
      .filter(e => e.type === 'focus')
      .reduce((sum, event) => {
        const start = new Date(event.start_time);
        const end = new Date(event.end_time);
        return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }, 0);
  }, [events, startOfWeek]);

  const formatHour = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getDuration = (item: CalendarItem) => {
    if (item.startTime && item.endTime) {
      const hours = (item.endTime.getTime() - item.startTime.getTime()) / (1000 * 60 * 60);
      return hours.toFixed(1);
    }
    return null;
  };

  const getTimeOfDay = () => {
    const hour = today.getHours();
    if (hour < 12) return { icon: <Sun className="h-4 w-4" />, text: 'manhã' };
    if (hour < 18) return { icon: <Coffee className="h-4 w-4" />, text: 'tarde' };
    return { icon: <Moon className="h-4 w-4" />, text: 'noite' };
  };

  const handleAddEvent = (dayIndex: number) => {
    setSelectedEvent(null);
    setSelectedDate(weekDays[dayIndex].date);
    setShowEventModal(true);
  };

  const handleEventClick = (item: CalendarItem) => {
    if (item.type === 'event' && item.originalData) {
      setSelectedEvent(item.originalData);
      setSelectedDate(undefined);
      setShowEventModal(true);
    } else if (item.type === 'habit') {
      // Toggle habit completion
      const habitData = item.originalData;
      if (habitData) {
        toggleHabit(habitData.id, new Date(habitData.dateStr));
      }
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setActiveItem(event.active.data.current as CalendarItem);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveItem(null);

    if (!over) return;

    const draggedItem = active.data.current as CalendarItem;
    const targetDayIndex = (over.data.current as any)?.dayIndex;
    
    if (targetDayIndex === undefined) return;

    const targetDate = weekDays[targetDayIndex].date;

    // Update the item's date based on type
    if (draggedItem.type === 'event' && draggedItem.originalData) {
      const originalEvent = draggedItem.originalData as CalendarEvent;
      const originalStart = new Date(originalEvent.start_time);
      const originalEnd = new Date(originalEvent.end_time);
      
      // Keep same time, change date
      const newStart = new Date(targetDate);
      newStart.setHours(originalStart.getHours(), originalStart.getMinutes());
      
      const newEnd = new Date(targetDate);
      newEnd.setHours(originalEnd.getHours(), originalEnd.getMinutes());

      await updateEvent(originalEvent.id, {
        start_time: newStart,
        end_time: newEnd,
      });
    } else if (draggedItem.type === 'task' && draggedItem.originalData) {
      const taskId = draggedItem.originalData.id;
      await updateTask(taskId, { dueDate: targetDate });
    }
  };

  const timeOfDay = getTimeOfDay();

  const getItemIcon = (item: CalendarItem) => {
    if (item.type === 'task') return <CheckSquare className="h-4 w-4" />;
    if (item.type === 'habit') return <Flame className="h-4 w-4" />;
    const config = blockTypeConfig[item.subType || 'meeting'];
    const Icon = config.icon;
    return <Icon className="h-4 w-4" />;
  };

  const getItemStyle = (item: CalendarItem) => {
    if (item.type === 'task') {
      return item.isCompleted 
        ? { bg: 'bg-gray-500/20', text: 'text-gray-400' }
        : { bg: 'bg-primary/20', text: 'text-primary' };
    }
    if (item.type === 'habit') {
      return item.isCompleted 
        ? { bg: 'bg-green-500/20', text: 'text-green-400' }
        : { bg: 'bg-orange-500/20', text: 'text-orange-400' };
    }
    return blockTypeConfig[item.subType || 'meeting'];
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
              <span>Boa {timeOfDay.text}! {totalFocusHours > 0 && `${totalFocusHours.toFixed(1)}h de foco`}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" onClick={() => setWeekOffset(weekOffset - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant={weekOffset === 0 ? "default" : "outline"} size="sm" onClick={() => setWeekOffset(0)}>
              Esta Semana
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setWeekOffset(weekOffset + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {!loading && (
          <>
            {/* Week grid */}
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
                      {day.items.slice(0, 4).map((item, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "h-1.5 w-1.5 rounded-full transition-colors",
                            isSelected ? "bg-white/80" : 
                            item.type === 'task' ? (item.isCompleted ? "bg-gray-500" : "bg-primary") :
                            item.type === 'habit' ? (item.isCompleted ? "bg-green-500" : "bg-orange-500") :
                            item.subType === 'focus' ? "bg-purple-500" :
                            item.subType === 'meeting' ? "bg-blue-500" :
                            "bg-muted-foreground/50"
                          )}
                        />
                      ))}
                      {day.items.length > 4 && (
                        <span className={cn("text-xs", isSelected ? "text-white/60" : "text-muted-foreground")}>
                          +{day.items.length - 4}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Day Timeline with Drag & Drop */}
            {selectedDay !== null && (
              <div className="mb-8 animate-fade-in space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-lg font-semibold">
                    <span className="text-muted-foreground">{weekDays[selectedDay].dayName},</span>
                    <span className="text-foreground">{weekDays[selectedDay].dayNumber}</span>
                  </h4>
                  <Button variant="outline" size="sm" onClick={() => handleAddEvent(selectedDay)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                  </Button>
                </div>

                <DroppableDay dayIndex={selectedDay} isOver={false}>
                  {weekDays[selectedDay].items.length > 0 ? (
                    weekDays[selectedDay].items.map((item) => {
                      const style = getItemStyle(item);
                      const canDrag = item.type === 'event' || item.type === 'task';
                      
                      const content = (
                        <div
                          onClick={() => handleEventClick(item)}
                          className={cn(
                            "group relative flex w-full items-center gap-4 rounded-2xl border border-border/50 bg-card/50 p-4 text-left transition-all hover:bg-card hover:border-border hover:shadow-lg hover:-translate-y-0.5",
                            item.isCompleted && "opacity-60"
                          )}
                        >
                          {canDrag && (
                            <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                          )}
                          
                          <div className={cn(
                            "absolute left-0 top-3 bottom-3 w-1 rounded-r-full",
                            item.type === 'task' ? (item.isCompleted ? "bg-gray-500" : "bg-primary") :
                            item.type === 'habit' ? (item.isCompleted ? "bg-green-500" : "bg-orange-500") :
                            item.subType === 'focus' ? "bg-purple-500" :
                            item.subType === 'meeting' ? "bg-blue-500" :
                            item.subType === 'personal' ? "bg-green-500" :
                            item.subType === 'routine' ? "bg-orange-500" :
                            "bg-muted-foreground"
                          )} />

                          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", style.bg)}>
                            <span className={style.text}>{getItemIcon(item)}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className={cn("font-medium truncate text-foreground", item.isCompleted && "line-through")}>
                              {item.title}
                            </h4>
                            {item.startTime && (
                              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5" />
                                  {formatHour(item.startTime.toISOString())}
                                  {item.endTime && ` - ${formatHour(item.endTime.toISOString())}`}
                                  {getDuration(item) && <span className="opacity-50">({getDuration(item)}h)</span>}
                                </span>
                              </div>
                            )}
                          </div>

                          {item.type === 'habit' && (
                            <div className={cn(
                              "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors",
                              item.isCompleted 
                                ? "bg-green-500 border-green-500" 
                                : "border-muted-foreground/30 hover:border-green-500/50"
                            )}>
                              {item.isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                            </div>
                          )}
                        </div>
                      );

                      if (canDrag) {
                        return (
                          <DraggableItem key={item.id} item={item} isDragging={activeId === item.id}>
                            {content}
                          </DraggableItem>
                        );
                      }

                      return <div key={item.id}>{content}</div>;
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed border-border/50 bg-muted/5">
                      <Sun className="h-10 w-10 text-muted-foreground/20 mb-3" />
                      <p className="text-muted-foreground">Dia livre!</p>
                      <Button variant="link" size="sm" onClick={() => handleAddEvent(selectedDay)} className="mt-2">
                        Planejar algo
                      </Button>
                    </div>
                  )}
                </DroppableDay>
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-4 border-t border-border/50 pt-4">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-primary/20">
                  <CheckSquare className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Tarefa</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-orange-500/20">
                  <Flame className="h-3.5 w-3.5 text-orange-400" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Hábito</span>
              </div>
              {Object.entries(blockTypeConfig).slice(0, 3).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <div key={type} className="flex items-center gap-2">
                    <div className={cn("p-1 rounded", config.bg)}>
                      <Icon className={cn("h-3.5 w-3.5", config.text)} />
                    </div>
                    <span className="text-xs font-medium capitalize text-muted-foreground">{type}</span>
                  </div>
                );
              })}
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

      {/* Drag Overlay */}
      <DragOverlay>
        {activeItem && (
          <div className="rounded-xl bg-card p-3 shadow-lg border border-primary/50 opacity-90">
            <p className="font-medium text-sm">{activeItem.title}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
