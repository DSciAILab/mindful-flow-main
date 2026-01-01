"use client";

import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Habit } from "./types";
import { Card } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile"; // NEW IMPORT

interface HabitCalendarProps {
  habit: Habit;
  allChecks: { habit_id: string; check_date: string }[]; // For boolean
  allEntries: { habit_id: string; entry_date: string; value: number }[]; // For quantifiable
}

const HabitCalendar = ({ habit, allChecks, allEntries }: HabitCalendarProps) => {
  const today = new Date();
  const isMobile = useIsMobile(); // NEW: Detecta se é mobile

  const completedDays: Date[] = [];
  const partialDays: Date[] = [];

  if (habit.type === 'boolean') {
    allChecks.forEach(check => {
      if (check.habit_id === habit.id) {
        // Adiciona 1 dia para corrigir o fuso horário do Supabase (UTC) para o local
        const localDate = new Date(check.check_date);
        localDate.setDate(localDate.getDate() + 1);
        completedDays.push(localDate);
      }
    });
  } else if (habit.type === 'quantifiable' && habit.goal_value) {
    const entriesByDate: Record<string, number> = {};
    allEntries.forEach(entry => {
      if (entry.habit_id === habit.id) {
        const dateKey = entry.entry_date;
        entriesByDate[dateKey] = (entriesByDate[dateKey] || 0) + entry.value;
      }
    });

    Object.entries(entriesByDate).forEach(([dateStr, total]) => {
      const localDate = new Date(dateStr);
      localDate.setDate(localDate.getDate() + 1);
      if (total >= habit.goal_value!) {
        completedDays.push(localDate);
      } else if (total > 0) {
        partialDays.push(localDate);
      }
    });
  }

  const modifiers = {
    completed: completedDays,
    partial: partialDays,
  };

  const modifiersStyles = {
    completed: {
      backgroundColor: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
    },
    partial: {
      backgroundColor: 'hsl(var(--secondary))',
      border: '2px solid hsl(var(--primary))',
    },
  };

  return (
    <Card className="p-2 mt-2 border-dashed flex justify-center">
      {/* NEW: 1 mês para mobile, 3 para desktop */}
      <DayPicker
        mode="multiple"
        min={0}
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        numberOfMonths={isMobile ? 1 : 3} 
        showOutsideDays
        captionLayout="dropdown-buttons"
        fromYear={today.getFullYear() - 1}
        toYear={today.getFullYear()}
        styles={{
          day: { borderRadius: '9999px', width: '2.5rem', height: '2.5rem' },
          caption_label: { fontSize: '1rem' },
        }}
      />
    </Card>
  );
};

export default HabitCalendar;