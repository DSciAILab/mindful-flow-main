import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Play, 
  Pause, 
  X, 
  Minimize2,
  Maximize2,
  Coffee,
  CheckCircle,
  Timer,
  ChevronUp
} from "lucide-react";
import type { Task } from "@/types";

interface FocusTimerProps {
  formattedTime: string;
  progress: number;
  isRunning: boolean;
  isPaused: boolean;
  type: 'focus' | 'break';
  sessionsCompleted: number;
  selectedTask: Task | null;
  onStart: () => void;
  onPause: () => void;
  onDone: () => void;
  onBreak: () => void;
  onClearTask: () => void;
}

export function FocusTimer({
  formattedTime,
  progress,
  isRunning,
  isPaused,
  type,
  sessionsCompleted,
  selectedTask,
  onStart,
  onPause,
  onDone,
  onBreak,
  onClearTask,
}: FocusTimerProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

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

  // Close options when clicking outside or after action
  const handleAction = (action: () => void) => {
    action();
    setShowOptions(false);
  };

  if (!selectedTask) return null;

  // Minimized floating widget
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-[100] animate-scale-in">
        <div className="rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-lg p-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              type === 'focus' ? "bg-primary/20" : "bg-accent/20"
            )}>
              {type === 'focus' ? (
                <Timer className="h-5 w-5 text-primary" />
              ) : (
                <Coffee className="h-5 w-5 text-accent" />
              )}
            </div>
            
            <div>
              <p className="text-xl font-bold tabular-nums text-foreground">
                {formattedTime}
              </p>
              <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                {selectedTask.title}
              </p>
            </div>

            <div className="flex items-center gap-1 ml-2">
              {!isRunning ? (
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onStart}>
                  <Play className="h-4 w-4" />
                </Button>
              ) : (
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onPause}>
                  <Pause className="h-4 w-4" />
                </Button>
              )}
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8" 
                onClick={() => setIsMinimized(false)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Mini progress bar */}
          <div className="h-1 w-full rounded-full bg-muted mt-2 overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                type === 'focus' ? "bg-primary" : "bg-accent"
              )}
              style={{ width: `${progress}%` }}
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
          "absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse",
          type === 'focus' ? "bg-primary" : "bg-accent"
        )} style={{ animationDuration: '4s' }} />
        <div className={cn(
          "absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15 animate-pulse",
          type === 'focus' ? "bg-primary" : "bg-accent"
        )} style={{ animationDuration: '6s', animationDelay: '2s' }} />
      </div>

      {/* Top bar - only minimize button */}
      <div className="absolute top-4 left-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setIsMinimized(true)}
          className="text-muted-foreground hover:text-foreground"
        >
          <Minimize2 className="h-4 w-4 mr-2" />
          Minimizar
        </Button>
      </div>

      {/* Main content */}
      <div className="relative h-full flex flex-col items-center justify-center px-4">
        {/* Task title */}
        <div className="text-center mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {type === 'focus' ? 'Focando em' : 'Pausa'}
          </p>
          <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground max-w-lg">
            {selectedTask.title}
          </h1>
        </div>

        {/* Circular progress */}
        <div className="relative mb-8 animate-scale-in" style={{ animationDelay: '200ms' }}>
          <svg className="w-64 h-64 md:w-80 md:h-80 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-muted/30"
            />
            {/* Progress circle */}
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              className={cn(
                "transition-all duration-1000",
                type === 'focus' ? "text-primary" : "text-accent"
              )}
              style={{ 
                strokeDasharray: '283%',
                strokeDashoffset: `${283 * (1 - progress / 100)}%`
              }}
            />
          </svg>
          
          {/* Time display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl md:text-7xl font-bold tabular-nums text-foreground">
              {formattedTime}
            </span>
            <span className="text-sm text-muted-foreground mt-2">
              {sessionsCompleted} sessões hoje
            </span>
          </div>
        </div>

        {/* Single main button + expandable options */}
        <div className="relative animate-fade-in" style={{ animationDelay: '300ms' }}>
          {/* Options menu - appears above the main button */}
          {showOptions && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 animate-fade-in">
              <div className="flex items-center gap-3 bg-card/90 backdrop-blur-xl rounded-2xl p-3 border border-border/50 shadow-lg">
                {type === 'focus' && (
                  <>
                    <Button 
                      onClick={() => handleAction(onBreak)} 
                      variant="outline"
                      className="rounded-xl"
                    >
                      <Coffee className="mr-2 h-4 w-4" />
                      Pausa
                    </Button>
                    
                    <Button 
                      onClick={() => handleAction(onDone)} 
                      variant="outline"
                      className="rounded-xl text-green-500 border-green-500/30 hover:bg-green-500/10"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Concluir
                    </Button>
                  </>
                )}

                <Button 
                  onClick={() => handleAction(onClearTask)} 
                  variant="outline"
                  className="rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <X className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </div>
              
              {/* Arrow pointing down */}
              <div className="flex justify-center">
                <ChevronUp className="h-5 w-5 text-muted-foreground rotate-180" />
              </div>
            </div>
          )}

          {/* Main action button */}
          <Button 
            onClick={() => {
              if (showOptions) {
                setShowOptions(false);
              } else if (!isRunning) {
                onStart();
              } else {
                setShowOptions(true);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowOptions(!showOptions);
            }}
            size="lg"
            className={cn(
              "h-20 w-20 rounded-full text-lg shadow-xl transition-all duration-300",
              "hover:scale-105 active:scale-95",
              showOptions && "ring-4 ring-primary/30",
              type === 'focus' 
                ? "bg-primary hover:bg-primary/90" 
                : "bg-accent hover:bg-accent/90"
            )}
          >
            {!isRunning ? (
              <Play className="h-8 w-8 ml-1" />
            ) : showOptions ? (
              <X className="h-8 w-8" />
            ) : (
              <Pause className="h-8 w-8" />
            )}
          </Button>

          {/* Hint text */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            {!isRunning 
              ? (isPaused ? 'Toque para continuar' : 'Toque para iniciar')
              : (showOptions ? 'Toque para fechar' : 'Toque para ver opções')
            }
          </p>
        </div>

        {/* Motivational message */}
        <p className="mt-8 text-muted-foreground text-center max-w-md animate-fade-in" style={{ animationDelay: '400ms' }}>
          {type === 'focus' 
            ? "Mantenha o foco. Você está fazendo um ótimo trabalho!"
            : "Aproveite sua pausa. Levante, alongue-se, respire fundo."
          }
        </p>
      </div>
    </div>
  );
}
