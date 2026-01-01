"use client";

import { cn } from "@/lib/utils";

interface ProgressCircleProps {
  percentage: number;
  children: React.ReactNode;
  isToday?: boolean;
}

export const ProgressCircle = ({ percentage, children, isToday = false }: ProgressCircleProps) => {
  const cleanPercentage = Math.min(100, Math.max(0, percentage));

  // Se a meta for atingida ou ultrapassada, mostra um círculo verde sólido como o hábito booleano
  if (cleanPercentage >= 100) {
    return (
      <div className="relative h-8 w-8">
        <div
          className={cn(
            "h-8 w-8 flex items-center justify-center rounded-full text-sm font-semibold transition-colors bg-green-500 text-white",
            isToday && "ring-2 ring-primary"
          )}
        >
          {children}
        </div>
      </div>
    );
  }

  // Lógica original do círculo de progresso para porcentagens menores que 100
  const circumference = 2 * Math.PI * 14; // 2 * pi * raio
  const strokeDashoffset = circumference - (cleanPercentage / 100) * circumference;

  const getColorClass = () => {
    if (cleanPercentage === 0) return "stroke-muted";
    if (cleanPercentage < 40) return "stroke-red-500";
    if (cleanPercentage < 70) return "stroke-yellow-500";
    return "stroke-green-500"; // Para 70-99%
  };

  return (
    <div className="relative h-8 w-8">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 32 32">
        <circle
          className="stroke-muted/50"
          cx="16"
          cy="16"
          r="14"
          strokeWidth="3"
          fill="transparent"
        />
        <circle
          className={cn("transition-all duration-500", getColorClass())}
          cx="16"
          cy="16"
          r="14"
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className={cn(
        "absolute inset-0 flex items-center justify-center text-sm font-semibold",
        isToday && "ring-2 ring-primary rounded-full"
      )}>
        {children}
      </div>
    </div>
  );
};