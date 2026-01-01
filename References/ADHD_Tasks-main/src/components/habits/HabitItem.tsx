"use client";

import BooleanHabitView from "./BooleanHabitView";
import QuantifiableHabitView from "./QuantifiableHabitView";
import { Habit } from "./types";
import { Project } from "@/lib/supabase/projects"; // NEW IMPORT

interface HabitItemProps {
  habit: Habit;
  booleanChecks: { habit_id: string; check_date: string }[];
  quantifiableEntries: { habit_id: string; entry_date: string; value: number }[];
  allBooleanChecks: { habit_id: string; check_date: string }[];
  allQuantifiableEntries: { habit_id: string; entry_date: string; value: number }[];
  streak: number;
  onToggleBooleanCheck: (habitId: string, date: Date) => void;
  onAddQuantifiableEntry: (habitId: string, value: number, date: Date) => void;
  onDeleteLastQuantifiableEntry: (habitId: string, date: Date) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habit: Habit) => void;
  displayDate: Date;
  projectsList: Project[]; // NEW PROP
}

const HabitItem = (props: HabitItemProps) => {
  if (props.habit.type === 'quantifiable') {
    return <QuantifiableHabitView {...props} />;
  }
  
  return <BooleanHabitView {...props} />;
};

export default HabitItem;