"use client";

import { Habit } from "./types";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Flame, History } from "lucide-react";
import { isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, format, getDate, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import HabitCalendar from "./HabitCalendar";
import { Project } from "@/lib/supabase/projects"; // NEW IMPORT

interface BooleanHabitViewProps {
  habit: Habit;
  booleanChecks: { habit_id: string; check_date: string }[];
  allBooleanChecks: { habit_id: string; check_date: string }[];
  streak: number;
  onToggleBooleanCheck: (habitId: string, date: Date) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habit: Habit) => void;
  displayDate: Date;
  allQuantifiableEntries: { habit_id: string; entry_date: string; value: number }[];
  projectsList: Project[]; // NEW PROP
}

const BooleanHabitView = ({ habit, booleanChecks, allBooleanChecks, streak, onToggleBooleanCheck, onEdit, onDelete, displayDate, allQuantifiableEntries, projectsList }: BooleanHabitViewProps) => {
  const weekStart = startOfWeek(displayDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(displayDate, { weekStartsOn: 1 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const relevantChecks = booleanChecks.filter(c => c.habit_id === habit.id);

  const currentProjectName = projectsList.find(p => p.id === habit.project_id)?.name || null;

  return (
    <Collapsible asChild>
      <li className="flex flex-col p-3 border rounded-md bg-secondary space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-foreground font-medium">{habit.title}</span>
            {streak > 1 && (
              <Badge variant="outline" className="flex items-center gap-1 text-orange-500 border-orange-500">
                <Flame className="h-4 w-4" />
                {streak} dias
              </Badge>
            )}
            {currentProjectName && <span className="text-xs text-muted-foreground">@{currentProjectName}</span>}
            {habit.hashtags.map((tag, tagIndex) => (
              <span key={tagIndex} className="text-xs text-muted-foreground">#{tag}</span>
            ))}
          </div>
          <div className="flex items-center space-x-1">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon">
                <History className="h-4 w-4" />
                <span className="sr-only">Ver histórico</span>
              </Button>
            </CollapsibleTrigger>
            <Button variant="ghost" size="icon" onClick={() => onEdit(habit)}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Editar hábito</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(habit)}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Deletar hábito</span>
            </Button>
          </div>
        </div>
        
        <div className="flex justify-start">
          <div className="grid grid-cols-7 gap-2 text-center">
            {daysInWeek.map((day, index) => {
              const isCompleted = relevantChecks.some(check => isSameDay(new Date(check.check_date), day));
              return (
                <div key={index} className="flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground uppercase">
                    {format(day, 'EEE')}
                  </span>
                  <button
                    onClick={() => onToggleBooleanCheck(habit.id, day)}
                    className={cn(
                      "h-8 w-8 flex items-center justify-center rounded-full text-sm font-semibold transition-colors",
                      isCompleted ? "bg-green-500 text-white hover:bg-green-600" : "bg-muted hover:bg-muted-foreground/20",
                      isToday(day) && "ring-2 ring-primary"
                    )}
                  >
                    {getDate(day)}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <CollapsibleContent>
          <HabitCalendar habit={habit} allChecks={allBooleanChecks} allEntries={allQuantifiableEntries} />
        </CollapsibleContent>
      </li>
    </Collapsible>
  );
};

export default BooleanHabitView;