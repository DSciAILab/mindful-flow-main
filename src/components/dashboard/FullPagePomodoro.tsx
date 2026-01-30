import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Play,
  Pause,
  Check,
  Minimize2,
  Coffee,
  Target,
  Timer,
  Volume2,
  VolumeX,
  ChevronLeft,
} from "lucide-react";
import { useTimer } from "@/hooks/useTimer";
import { useTimerSounds } from "@/hooks/useTimerSounds";
import { useUserStats } from "@/hooks/useUserStats";

interface FullPagePomodoroProps {
  onExit: () => void;
  onMinimize?: () => void;
  onDone?: () => void;
}

export function FullPagePomodoro({
  onExit,
  onMinimize,
  onDone,
}: FullPagePomodoroProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const { playFocusEndSound, playBreakEndSound, settings, saveSettings } =
    useTimerSounds();
  const { stats, addFocusTime, addFocusSession } = useUserStats();

  const handleSessionComplete = (type: "focus" | "break") => {
    if (type === "focus") {
      playFocusEndSound();
      addFocusSession(); // Persist the session to stats
    } else {
      playBreakEndSound();
    }
  };

  const handleMinutePassed = () => {
    addFocusTime(1);
  };

  const timer = useTimer({
    onSessionComplete: handleSessionComplete,
    onMinutePassed: handleMinutePassed,
  });

  // Track if timer has been started at least once
  const handleStart = () => {
    if (!hasStarted) setHasStarted(true);
    timer.start();
  };

  // Show side buttons only when paused AFTER having started
  const showSideButtons = timer.isPaused && hasStarted;

  // Use stats.focusSessionsToday for persistent session count
  const totalSessions = stats.focusSessionsToday + timer.sessionsCompleted;

  // Prevent body scroll when fullscreen
  useEffect(() => {
    if (!isMinimized) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMinimized]);

  // Calculate circular progress
  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference - timer.progress * circumference;

  // Minimized floating widget
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-[100] animate-scale-in">
        <div className="rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl p-4">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl",
                timer.type === "focus" ? "bg-primary/20" : "bg-accent/20"
              )}
            >
              {timer.type === "focus" ? (
                <Target className="h-6 w-6 text-primary" />
              ) : (
                <Coffee className="h-6 w-6 text-accent" />
              )}
            </div>

            <div>
              <p className="text-2xl font-bold tabular-nums text-foreground">
                {timer.formattedTime}
              </p>
              <p className="text-xs text-muted-foreground">
                {timer.type === "focus" ? "Foco" : "Pausa"} • {totalSessions}{" "}
                sessões
              </p>
            </div>

            <div className="flex items-center gap-1 ml-2">
              {!timer.isRunning ? (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10"
                  onClick={timer.start}
                >
                  <Play className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10"
                  onClick={timer.pause}
                >
                  <Pause className="h-5 w-5" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10"
                onClick={() => setIsMinimized(false)}
              >
                <Target className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Mini progress bar */}
          <div className="h-1.5 w-full rounded-full bg-muted mt-3 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                timer.type === "focus" ? "bg-primary" : "bg-accent"
              )}
              style={{ width: `${timer.progress * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Fullscreen mode
  return (
    <div className="fixed inset-0 z-[100] bg-background animate-fade-in">
      {/* Background gradient */}
      <div
        className={cn(
          "absolute inset-0 transition-all duration-1000",
          timer.type === "focus"
            ? "bg-gradient-to-br from-primary/5 via-background to-primary/10"
            : "bg-gradient-to-br from-accent/5 via-background to-accent/10"
        )}
      />

      {/* Animated circles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={cn(
            "absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl opacity-20 animate-pulse",
            timer.type === "focus" ? "bg-primary" : "bg-accent"
          )}
          style={{ animationDuration: "4s" }}
        />
        <div
          className={cn(
            "absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-3xl opacity-15 animate-pulse",
            timer.type === "focus" ? "bg-primary" : "bg-accent"
          )}
          style={{ animationDuration: "6s", animationDelay: "2s" }}
        />
      </div>

      {/* Top bar - z-50 to be above content */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-50">
        <Button
          variant="ghost"
          onClick={onExit}
          className="text-muted-foreground hover:text-foreground hover:bg-foreground/10"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => saveSettings({ enabled: !settings.enabled })}
            className="text-muted-foreground hover:text-foreground hover:bg-foreground/10"
          >
            {settings.enabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(true)}
            className="text-muted-foreground hover:text-foreground hover:bg-foreground/10"
          >
            <Minimize2 className="h-4 w-4 mr-2" />
            Minimizar
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="relative h-full flex flex-col items-center justify-center px-4">
        {/* Mode indicator */}
        <div
          className="text-center mb-8 animate-fade-in"
          style={{ animationDelay: "100ms" }}
        >
          <div
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4",
              timer.type === "focus"
                ? "bg-primary/20 text-primary"
                : "bg-accent/20 text-accent"
            )}
          >
            {timer.type === "focus" ? (
              <Target className="h-5 w-5" />
            ) : (
              <Coffee className="h-5 w-5" />
            )}
            <span className="font-semibold">
              {timer.type === "focus" ? "Modo Foco" : "Modo Pausa"}
            </span>
          </div>
          <p className="text-muted-foreground">
            {totalSessions} sessões completadas hoje
          </p>
        </div>

        {/* Circular timer */}
        <div
          className="relative mb-8 animate-scale-in"
          style={{ animationDelay: "200ms" }}
        >
          <svg
            className="w-72 h-72 md:w-96 md:h-96"
            viewBox="0 0 320 320"
            style={{ transform: "rotate(-90deg)" }}
          >
            {/* Background circle */}
            <circle
              cx="160"
              cy="160"
              r="140"
              fill="none"
              strokeWidth="16"
              className="stroke-muted/30"
            />
            {/* Progress circle */}
            <circle
              cx="160"
              cy="160"
              r="140"
              fill="none"
              strokeWidth="20"
              strokeLinecap="round"
              className={cn(
                "transition-all duration-1000",
                timer.type === "focus" ? "stroke-primary" : "stroke-accent"
              )}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
              }}
            />
          </svg>

          {/* Time display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-7xl md:text-8xl font-bold tabular-nums text-foreground">
              {timer.formattedTime}
            </span>
            <span className="text-sm text-muted-foreground mt-2 uppercase tracking-wider">
              {timer.type === "focus" ? "Focus Time" : "Break Time"}
            </span>
          </div>
        </div>

        {/* Session indicators */}
        <div
          className="flex items-center gap-2 mb-8 animate-fade-in"
          style={{ animationDelay: "250ms" }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-3 h-3 rounded-full transition-all",
                i < totalSessions % 4
                  ? timer.type === "focus"
                    ? "bg-primary"
                    : "bg-accent"
                  : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Controls - Single button with expanding side buttons */}
        <div
          className="relative flex items-center justify-center gap-12 min-h-[120px] animate-fade-in"
          style={{ animationDelay: "300ms" }}
        >
          {/* Break/Focus Button (Left) - appears when paused after starting */}
          <div
            className={cn(
              "transition-all duration-500 transform",
              showSideButtons
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10 pointer-events-none absolute left-0"
            )}
          >
            <button
              onClick={() => {
                if (timer.type === "focus") {
                  timer.goToBreak();
                } else {
                  timer.skipToFocus();
                  timer.start();
                }
              }}
              className="flex flex-col items-center gap-3 group"
            >
              <div
                className={cn(
                  "w-14 h-14 rounded-full border flex items-center justify-center transition-all",
                  "bg-card border-border",
                  timer.type === "focus" ? "text-accent" : "text-primary",
                  timer.type === "focus"
                    ? "group-hover:border-accent/50 group-hover:bg-accent/10"
                    : "group-hover:border-primary/50 group-hover:bg-primary/10"
                )}
              >
                {timer.type === "focus" ? (
                  <Coffee className="h-5 w-5" />
                ) : (
                  <Target className="h-5 w-5" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors",
                  timer.type === "focus"
                    ? "group-hover:text-accent"
                    : "group-hover:text-primary"
                )}
              >
                {timer.type === "focus" ? "Break" : "Focus"}
              </span>
            </button>
          </div>

          {/* Main Play/Pause Button (Center) */}
          <button
            onClick={timer.isRunning ? timer.pause : handleStart}
            className={cn(
              "relative z-20 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-95",
              timer.isRunning
                ? "bg-transparent border-2 border-foreground/20 text-foreground hover:bg-foreground/10"
                : timer.type === "focus"
                ? "bg-primary text-primary-foreground hover:scale-105 shadow-primary/20"
                : "bg-accent text-accent-foreground hover:scale-105 shadow-accent/20"
            )}
          >
            {timer.isRunning ? (
              <Pause className="h-8 w-8 animate-in fade-in zoom-in duration-300" />
            ) : (
              <Play className="h-8 w-8 ml-1 animate-in fade-in zoom-in duration-300" />
            )}
          </button>

          {/* Done Button (Right) - appears when paused after starting */}
          <div
            className={cn(
              "transition-all duration-500 transform",
              showSideButtons
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10 pointer-events-none absolute right-0"
            )}
          >
            <button
              onClick={() => {
                timer.completeTask();
                onDone?.();
                timer.start();
              }}
              className="flex flex-col items-center gap-3 group"
            >
              <div
                className={cn(
                  "w-14 h-14 rounded-full border flex items-center justify-center transition-all",
                  "bg-card border-border text-green-500",
                  "group-hover:border-green-500/50 group-hover:bg-green-500/10"
                )}
              >
                <Check className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-green-500 transition-colors">
                Done
              </span>
            </button>
          </div>
        </div>

        {/* Hint text */}
        <p
          className="mt-6 text-sm text-muted-foreground animate-fade-in"
          style={{ animationDelay: "350ms" }}
        >
          {timer.isRunning
            ? "Mantenha o foco. Você está indo muito bem!"
            : timer.isPaused
            ? "Escolha uma ação ou continue"
            : timer.type === "focus"
            ? "Pronto para começar? Clique no play."
            : "Aproveite sua pausa. Levante, alongue-se, respire."}
        </p>

        {/* Quick stats */}
        <div
          className="mt-8 flex items-center gap-6 text-xs text-muted-foreground animate-fade-in"
          style={{ animationDelay: "400ms" }}
        >
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground">
              {totalSessions}
            </p>
            <p>Sessões</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground">
              {totalSessions * 25}
            </p>
            <p>Minutos</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground">
              {timer.totalBreakTime}
            </p>
            <p>Pausas (min)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
