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
  ChevronLeft,
  Volume2,
  VolumeX
} from "lucide-react";
import type { Task } from "@/types";
import { useTimerSounds } from "@/hooks/useTimerSounds";
import { QuickDistractionCapture } from "@/components/distractions/QuickDistractionCapture";

interface FocusTimerProps {
  formattedTime: string;
  progress: number;
  isRunning: boolean;
  isPaused: boolean;
  type: 'focus' | 'break';
  sessionsCompleted: number;
  selectedTask: Task | null;
  focusSessionId?: string;
  onStart: () => void;
  onPause: () => void;
  onDone: () => void;
  onBreak: () => void;
  onClearTask: () => void;
  onSkipToFocus?: () => void;
  onCaptureDistraction?: (content: string) => void;
}

export function FocusTimer({
  formattedTime,
  progress,
  isRunning,
  isPaused,
  type,
  sessionsCompleted,
  selectedTask,
  focusSessionId,
  onStart,
  onPause,
  onDone,
  onBreak,
  onClearTask,
  onSkipToFocus,
  onCaptureDistraction,
}: FocusTimerProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const { settings, saveSettings } = useTimerSounds();
  const [showControls, setShowControls] = useState(true);

  // Auto-hide controls after 3 seconds of inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const handleActivity = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    handleActivity();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, []);

  // Track when timer has been started
  const handleStart = () => {
    if (!hasStarted) setHasStarted(true);
    onStart();
  };

  // Show side buttons only when paused AFTER having started
  const showSideButtons = isPaused && hasStarted;

  // Calculate circular progress
  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference - (progress * circumference);

  // Prevent body scroll when fullscreen
  useEffect(() => {
    if (selectedTask && !isMinimized) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedTask, isMinimized]);

  if (!selectedTask) return null;

  // Minimized floating widget
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-[100] animate-scale-in">
        <div className="rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl p-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              type === 'focus' ? "bg-primary/20" : "bg-accent/20"
            )}>
              {type === 'focus' ? (
                <Target className="h-6 w-6 text-primary" />
              ) : (
                <Coffee className="h-6 w-6 text-accent" />
              )}
            </div>
            
            <div>
              <p className="text-2xl font-bold tabular-nums text-foreground">
                {formattedTime}
              </p>
              <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                {selectedTask.title}
              </p>
            </div>

            <div className="flex items-center gap-1 ml-2">
              {!isRunning ? (
                <Button size="icon" variant="ghost" className="h-10 w-10" onClick={handleStart}>
                  <Play className="h-5 w-5" />
                </Button>
              ) : (
                <Button size="icon" variant="ghost" className="h-10 w-10" onClick={onPause}>
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
                type === 'focus' ? "bg-primary" : "bg-accent"
              )}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Fullscreen immersive mode
  return (
    <div className="fixed inset-0 z-[100] bg-background animate-fade-in">
      {/* Background gradient */}
      <div className={cn(
        "absolute inset-0 transition-all duration-1000",
        type === 'focus' 
          ? "bg-gradient-to-br from-primary/5 via-background to-primary/10"
          : "bg-gradient-to-br from-accent/5 via-background to-accent/10"
      )} />

      {/* Animated circles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={cn(
          "absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl opacity-20 animate-pulse",
          type === 'focus' ? "bg-primary" : "bg-accent"
        )} style={{ animationDuration: '4s' }} />
        <div className={cn(
          "absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-3xl opacity-15 animate-pulse",
          type === 'focus' ? "bg-primary" : "bg-accent"
        )} style={{ animationDuration: '6s', animationDelay: '2s' }} />
      </div>

      {/* Top bar - z-50 to be above content */}
      <div className={cn(
        "absolute top-4 left-4 right-4 flex items-center justify-between z-50 transition-opacity duration-300",
        showControls ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <Button 
          variant="ghost" 
          onClick={onClearTask}
          className="text-muted-foreground hover:text-foreground hover:bg-foreground/10"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Sair
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
        {/* Task title */}
        <div className="text-center mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4",
            type === 'focus' ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"
          )}>
            {type === 'focus' ? (
              <Target className="h-5 w-5" />
            ) : (
              <Coffee className="h-5 w-5" />
            )}
            <span className="font-semibold">
              {type === 'focus' ? 'Focando em' : 'Pausa'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground max-w-lg">
            {selectedTask.title}
          </h1>
          <p className="text-muted-foreground mt-2">
            {sessionsCompleted} sessões completadas
          </p>
        </div>

        {/* Circular progress */}
        <div className="relative mb-8 animate-scale-in" style={{ animationDelay: '200ms' }}>
          <svg 
            className="w-72 h-72 md:w-96 md:h-96" 
            viewBox="0 0 320 320"
            style={{ transform: 'rotate(-90deg)' }}
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
                type === 'focus' ? "stroke-primary" : "stroke-accent"
              )}
              style={{ 
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset
              }}
            />
          </svg>
          
          {/* Time display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-7xl md:text-8xl font-bold tabular-nums text-foreground">
              {formattedTime}
            </span>
            <span className="text-sm text-muted-foreground mt-2 uppercase tracking-wider">
              {type === 'focus' ? 'Focus Time' : 'Break Time'}
            </span>
          </div>
        </div>

        {/* Session indicators */}
        <div className="flex items-center gap-2 mb-8 animate-fade-in" style={{ animationDelay: '250ms' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div 
              key={i}
              className={cn(
                "w-3 h-3 rounded-full transition-all",
                i < sessionsCompleted % 4
                  ? type === 'focus' ? "bg-primary" : "bg-accent"
                  : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Controls - Single button with expanding side buttons */}
        <div className="relative flex items-center justify-center gap-12 min-h-[120px] animate-fade-in" style={{ animationDelay: '300ms' }}>
          
          {/* Break/Focus Button (Left) - appears when paused after starting */}
          <div className={cn(
            "transition-all duration-500 transform",
            showSideButtons 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 translate-y-10 pointer-events-none absolute left-0"
          )}>
            <button 
              onClick={type === 'focus' ? onBreak : (onSkipToFocus || onStart)}
              className="flex flex-col items-center gap-3 group"
            >
              <div className={cn(
                "w-14 h-14 rounded-full border flex items-center justify-center transition-all",
                "bg-card border-border",
                type === 'focus' ? "text-accent" : "text-primary",
                type === 'focus' 
                  ? "group-hover:border-accent/50 group-hover:bg-accent/10"
                  : "group-hover:border-primary/50 group-hover:bg-primary/10"
              )}>
                {type === 'focus' ? (
                  <Coffee className="h-5 w-5" />
                ) : (
                  <Target className="h-5 w-5" />
                )}
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors",
                type === 'focus' ? "group-hover:text-accent" : "group-hover:text-primary"
              )}>
                {type === 'focus' ? 'Break' : 'Focus'}
              </span>
            </button>
          </div>

          {/* Main Play/Pause Button (Center) */}
          <button 
            onClick={isRunning ? onPause : handleStart}
            className={cn(
              "relative z-20 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-95",
              isRunning 
                ? "bg-transparent border-2 border-foreground/20 text-foreground hover:bg-foreground/10" 
                : type === 'focus'
                  ? "bg-primary text-primary-foreground hover:scale-105 shadow-primary/20"
                  : "bg-accent text-accent-foreground hover:scale-105 shadow-accent/20"
            )}
          >
            {isRunning ? (
              <Pause className="h-8 w-8 animate-in fade-in zoom-in duration-300" />
            ) : (
              <Play className="h-8 w-8 ml-1 animate-in fade-in zoom-in duration-300" />
            )}
          </button>

          {/* Done Button (Right) - appears when paused after starting */}
          <div className={cn(
            "transition-all duration-500 transform",
            showSideButtons 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 translate-y-10 pointer-events-none absolute right-0"
          )}>
            <button 
              onClick={onDone}
              className="flex flex-col items-center gap-3 group"
            >
              <div className={cn(
                "w-14 h-14 rounded-full border flex items-center justify-center transition-all",
                "bg-card border-border text-green-500",
                "group-hover:border-green-500/50 group-hover:bg-green-500/10"
              )}>
                <Check className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-green-500 transition-colors">
                Done
              </span>
            </button>
          </div>
        </div>

        {/* Hint text */}
        <p className="mt-6 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '350ms' }}>
          {isRunning 
            ? "Mantenha o foco. Você está indo muito bem!"
            : showSideButtons
              ? "Escolha uma ação ou continue"
              : isPaused 
                ? "Toque para continuar"
                : "Pronto para começar? Clique no play."
          }
        </p>
      </div>

      {/* Quick Distraction Capture - Parking Lot */}
      {onCaptureDistraction && (
        <QuickDistractionCapture
          isVisible={type === 'focus' && !isMinimized}
          currentTaskId={selectedTask?.id}
          focusSessionId={focusSessionId}
          onCapture={onCaptureDistraction}
        />
      )}
    </div>
  );
}
