"use client";

import { cn } from "@/lib/utils";

interface PomodoroIndicatorsProps {
  totalSessions?: number;
  completedSessions: number;
}

export const PomodoroIndicators = ({ totalSessions = 4, completedSessions }: PomodoroIndicatorsProps) => {
  return (
    <div className="flex gap-2 justify-center mb-8">
      {Array.from({ length: totalSessions }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "w-3 h-3 rounded-full transition-colors duration-300",
            index < completedSessions
              ? "bg-primary" // Concluído
              : "bg-muted-foreground/30" // Pendente
          )}
        />
      ))}
    </div>
  );
};