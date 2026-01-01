"use client";

import { useState } from "react";
import { Habit } from "./types";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Flame, Undo2, History } from "lucide-react";
import { isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, format, getDate, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { ProgressCircle } from "@/components/habits/ProgressCircle";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import HabitCalendar from "./HabitCalendar";
import { cn } from "@/lib/utils";
import { Project } from "@/lib/supabase/projects"; // NEW IMPORT

interface QuantifiableHabitViewProps {
  habit: Habit;
  quantifiableEntries: { habit_id: string; entry_date: string; value: number }[];
  allQuantifiableEntries: { habit_id: string; entry_date: string; value: number }[];
  streak: number;
  onAddQuantifiableEntry: (habitId: string, value: number, date: Date) => void;
  onDeleteLastQuantifiableEntry: (habitId: string, date: Date) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habit: Habit) => void;
  displayDate: Date;
  allBooleanChecks: { habit_id: string; check_date: string }[];
  projectsList: Project[]; // NEW PROP
}

const QuantifiableHabitView = ({ habit, quantifiableEntries, allQuantifiableEntries, streak, onAddQuantifiableEntry, onDeleteLastQuantifiableEntry, onEdit, onDelete, displayDate, allBooleanChecks, projectsList }: QuantifiableHabitViewProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const weekStart = startOfWeek(displayDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(displayDate, { weekStartsOn: 1 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const relevantEntries = quantifiableEntries.filter(e => e.habit_id === habit.id);
  
  const selectedDayTotal = relevantEntries
    .filter(e => isSameDay(new Date(e.entry_date), selectedDate))
    .reduce((sum, entry) => sum + Number(entry.value), 0);

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
          </div>
          <div className="flex items-center space-x-1">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon">
                <History className="h-4 w-4" />
                <span className="sr-only">Ver histórico</span>
              </Button>
            </CollapsibleTrigger>
            <Button variant="ghost" size="icon" onClick={() => onEdit(habit)}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(habit)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="grid grid-cols-7 gap-2 text-center">
            {daysInWeek.map((day, index) => {
              const dayTotal = relevantEntries
                .filter(e => isSameDay(new Date(e.entry_date), day))
                .reduce((sum, entry) => sum + Number(entry.value), 0);
              const percentage = habit.goal_value ? (dayTotal / habit.goal_value) * 100 : 0;
              const isSelected = isSameDay(day, selectedDate);
              return (
                <div key={index} className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => setSelectedDate(day)}>
                  <span className="text-xs text-muted-foreground uppercase">{format(day, 'EEE')}</span>
                  <div className={cn(isSelected && "ring-2 ring-primary rounded-full")}>
                    <ProgressCircle percentage={percentage} isToday={isToday(day)}>
                      {getDate(day)}
                    </ProgressCircle>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col items-center gap-2 pl-4">
            <Button onClick={() => onAddQuantifiableEntry(habit.id, habit.increment_value || 1, selectedDate)}>
              +{habit.increment_value} {habit.goal_unit}
            </Button>
            <Button variant="outline" size="icon" onClick={() => onDeleteLastQuantifiableEntry(habit.id, selectedDate)}>
              <Undo2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground text-right font-semibold">
          Total ({format(selectedDate, 'dd/MM', { locale: ptBR })}): {selectedDayTotal} / {habit.goal_value} {habit.goal_unit}
        </p>

        <CollapsibleContent>
          <HabitCalendar habit={habit} allChecks={allBooleanChecks} allEntries={allQuantifiableEntries} />
        </CollapsibleContent>
      </li>
    </Collapsible>
  );
};

export default QuantifiableHabitView;