import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, X, Timer, Droplets, Target, Coffee, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task, WellnessReminder } from "@/types";

interface TimerWidgetProps {
  formattedTime: string;
  progress: number;
  isRunning: boolean;
  isPaused: boolean;
  type: 'focus' | 'break';
  sessionsCompleted: number;
  totalBreakTime: number;
  selectedTask: Task | null;
  onStart: () => void;
  onPause: () => void;
  onDone: () => void;
  onBreak: () => void;
  onClearTask: () => void;
}

const wellnessReminders: WellnessReminder[] = [
  { id: '1', type: 'water', message: 'Hora de beber água!', icon: 'water' },
  { id: '2', type: 'stretch', message: 'Levante e alongue-se!', icon: 'stretch' },
  { id: '3', type: 'breathe', message: 'Respire fundo 3 vezes', icon: 'breathe' },
  { id: '4', type: 'walk', message: 'Dê uma volta rápida', icon: 'walk' },
  { id: '5', type: 'eyes', message: 'Descanse os olhos - olhe longe', icon: 'eyes' },
];

export function TimerWidget({
  formattedTime,
  progress,
  isRunning,
  isPaused,
  type,
  sessionsCompleted,
  totalBreakTime,
  selectedTask,
  onStart,
  onPause,
  onDone,
  onBreak,
  onClearTask,
}: TimerWidgetProps) {
  const currentReminder = wellnessReminders[sessionsCompleted % wellnessReminders.length];
  const circumference = 2 * Math.PI * 88;
  const strokeDashoffset = circumference - (progress * circumference);

  const taskTimeProgress = selectedTask?.estimatedMinutes 
    ? Math.min((selectedTask.timeSpentMinutes / selectedTask.estimatedMinutes) * 100, 100)
    : null;

  const formatBreakTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-foreground">
          {type === 'focus' ? (
            <Target className="h-5 w-5 text-primary" />
          ) : (
            <Coffee className="h-5 w-5 text-accent" />
          )}
          {type === 'focus' ? 'Foco' : 'Pausa'}
        </h3>
        <div className="flex items-center gap-3">
          {totalBreakTime > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Pausas: {formatBreakTime(totalBreakTime)}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Sessões:</span>
            <span className="rounded-md bg-accent/20 px-2 py-0.5 text-xs font-semibold text-accent">
              {sessionsCompleted}
            </span>
          </div>
        </div>
      </div>

      {/* Selected task display */}
      {selectedTask ? (
        <div className="mb-4 animate-fade-in rounded-xl bg-primary/10 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground line-clamp-2">
                {selectedTask.title}
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Timer className="h-3 w-3" />
                <span>{selectedTask.timeSpentMinutes} min gastos</span>
                {selectedTask.estimatedMinutes && (
                  <span>/ {selectedTask.estimatedMinutes} min estimados</span>
                )}
              </div>
              {taskTimeProgress !== null && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div 
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${taskTimeProgress}%` }}
                  />
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClearTask}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-4 rounded-xl border-2 border-dashed border-border bg-muted/20 p-4 text-center">
          <Timer className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">
            Selecione uma tarefa
          </p>
          <p className="text-xs text-muted-foreground/70">
            Clique no botão play ao lado de uma tarefa
          </p>
        </div>
      </div>

      {/* Timer circle */}
      <div className="relative mx-auto mb-3 h-48 w-48">
        <svg className="h-full w-full -rotate-90 transform">
          <circle
            cx="96"
            cy="96"
            r="88"
            fill="none"
            strokeWidth="8"
            className="stroke-muted"
          />
          <circle
            cx="96"
            cy="96"
            r="88"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transition: 'stroke-dashoffset 1s linear',
            }}
            className={cn(
              type === 'focus' ? 'stroke-primary' : 'stroke-accent',
              !selectedTask && 'opacity-30'
            )}
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn(
            "font-display text-4xl font-bold",
            selectedTask ? "text-foreground" : "text-muted-foreground"
          )}>
            {formattedTime}
          </span>
          <span className="text-sm text-muted-foreground">
            {type === 'focus' ? 'FOCUS' : 'BREAK'}
          </span>
        </div>
      </div>

      {/* Pomodoro Session Indicators */}
      {selectedTask && (() => {
        // Calculate total sessions needed (25min per session)
        const pomodoroLength = 25; // minutes per Pomodoro
        const totalSessionsNeeded = selectedTask.estimatedMinutes 
          ? Math.ceil(selectedTask.estimatedMinutes / pomodoroLength)
          : 4; // default to 4 if no estimate
        
        // Limit to max 8 sessions for visual clarity
        const displaySessions = Math.min(totalSessionsNeeded, 8);
        
        return (
          <div className="mb-6 flex items-center justify-center gap-2">
            {Array.from({ length: displaySessions }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition-all duration-300",
                  index < sessionsCompleted
                    ? "bg-primary scale-110 shadow-lg shadow-primary/50"
                    : "bg-muted"
                )}
              />
            ))}
          </div>
        );
      })()}

      {/* Controls - Simplified */}
      <div className="flex flex-col items-center gap-3">
        {/* Main button: Start or Pause */}
        {!isRunning && !isPaused ? (
          <Button
            variant={type === 'focus' ? 'default' : 'calm'}
            size="xl"
            onClick={onStart}
            disabled={!selectedTask}
            className="min-w-40"
          >
            <Play className="mr-2 h-5 w-5" />
            Iniciar
          </Button>
        ) : isRunning ? (
          <Button
            variant="glass"
            size="xl"
            onClick={onPause}
            className="min-w-40"
          >
            <Pause className="mr-2 h-5 w-5" />
            Pausar
          </Button>
        ) : (
          <>
            {/* Paused state - show smaller Done and Break buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="default"
                size="lg"
                onClick={onDone}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Concluir
              </Button>
              <Button
                variant="calm"
                size="lg"
                onClick={onBreak}
                className="gap-2"
              >
                <Coffee className="h-4 w-4" />
                Pausa
              </Button>
            </div>
            {/* Resume button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onStart}
              className="text-muted-foreground"
            >
              <Play className="mr-1 h-4 w-4" />
              Continuar
            </Button>
          </>
        )}
      </div>

      {/* Wellness reminder */}
      {type === 'break' && selectedTask && (
        <div className="mt-4 animate-fade-in rounded-xl bg-accent/10 p-3">
          <div className="flex items-center gap-3">
            <Droplets className="h-6 w-6 text-accent" />
            <div>
              <p className="text-sm font-medium text-accent">{currentReminder.message}</p>
              <p className="text-xs text-muted-foreground">Cuide de você durante a pausa</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
