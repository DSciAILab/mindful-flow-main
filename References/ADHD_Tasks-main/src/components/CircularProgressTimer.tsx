"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface CircularProgressTimerProps {
  timeLeft: number;
  totalDuration: number;
  isBreak: boolean;
  isOvertime: boolean;
  overtimeTaken: number;
  isBreakGracePeriod: boolean;
  isTaskGracePeriod: boolean; // NEW PROP
  taskOvertimeTaken: number; // NEW PROP
  isTaskOvertime: boolean; // NEW PROP
  children: React.ReactNode;
}

const VIEWBOX_SIZE = 550;
const STROKE_WIDTH = 36;
const RADIUS = (VIEWBOX_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const CircularProgressTimer = ({ timeLeft, totalDuration, isBreak, isOvertime, overtimeTaken, isBreakGracePeriod, isTaskGracePeriod, taskOvertimeTaken, isTaskOvertime, children }: CircularProgressTimerProps) => {
  void overtimeTaken; // Suprime o aviso TS6133, indicando que a prop é intencionalmente não usada diretamente aqui.
  void taskOvertimeTaken; // Suprime o aviso TS6133, indicando que a prop é intencionalmente não usada diretamente aqui.

  let progress = 0;
  let strokeDashoffset = CIRCUMFERENCE;
  let strokeColorClass = "stroke-primary"; // Default for pomodoro
  let animationClass = ""; // Nova variável para a classe de animação
  let inlineStyle: React.CSSProperties = {}; // Para variáveis CSS

  if (isTaskOvertime) { // NEW: Task overtime (red)
    strokeColorClass = "stroke-red-500";
    animationClass = "animate-overtime-pulse";
    strokeDashoffset = CIRCUMFERENCE;
    inlineStyle = { '--circumference': `${CIRCUMFERENCE}px` } as React.CSSProperties;
  } else if (isTaskGracePeriod) { // NEW: Task grace period (yellow)
    strokeColorClass = "stroke-yellow-500";
    progress = (totalDuration - timeLeft) / totalDuration; // totalDuration here is 10s for grace period
    strokeDashoffset = CIRCUMFERENCE * (1 - progress);
    animationClass = "transition-all duration-1000 ease-linear";
  } else if (isOvertime) {
    strokeColorClass = "stroke-red-500";
    animationClass = "animate-overtime-pulse"; // Aplica a animação keyframe
    strokeDashoffset = CIRCUMFERENCE; // O keyframe vai controlar o preenchimento a partir do vazio
    inlineStyle = { '--circumference': `${CIRCUMFERENCE}px` } as React.CSSProperties; // Passa a circunferência como variável CSS
  } else if (isBreakGracePeriod) { // NEW: Yellow for grace period
    strokeColorClass = "stroke-yellow-500";
    progress = (totalDuration - timeLeft) / totalDuration; // totalDuration here is 20s for grace period
    strokeDashoffset = CIRCUMFERENCE * (1 - progress);
    animationClass = "transition-all duration-1000 ease-linear";
  } else if (isBreak) { // Nominal break (green)
    strokeColorClass = "stroke-green-500";
    progress = (totalDuration - timeLeft) / totalDuration;
    strokeDashoffset = CIRCUMFERENCE * (1 - progress);
    animationClass = "transition-all duration-1000 ease-linear";
  } else if (totalDuration > 0) { // Pomodoro (primary color)
    progress = (totalDuration - timeLeft) / totalDuration;
    strokeDashoffset = CIRCUMFERENCE * (1 - progress);
    animationClass = "transition-all duration-1000 ease-linear";
  } else {
    // Caso totalDuration seja 0 (e não seja overtime), o círculo deve estar vazio ou estático.
    progress = 0;
    strokeDashoffset = CIRCUMFERENCE;
    animationClass = ""; // Sem animação para estados iniciais/indefinidos
  }

  return (
    <div className="relative w-full h-full">
      <svg width="100%" height="100%" viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} className="-rotate-90">
        {/* Background Circle */}
        <circle
          cx={VIEWBOX_SIZE / 2}
          cy={VIEWBOX_SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE_WIDTH}
          className="stroke-muted"
          fill="transparent"
        />
        {/* Progress Circle */}
        <circle
          cx={VIEWBOX_SIZE / 2}
          cy={VIEWBOX_SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE_WIDTH}
          fill="transparent"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn(
            animationClass, // Aplica a classe de animação aqui
            strokeColorClass
          )}
          style={inlineStyle} // Aplica o estilo inline para a variável CSS
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export default CircularProgressTimer;