import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { QuoteDisplay } from '@/components/dashboard/QuoteDisplay';
import { cn } from '@/lib/utils';
import { 
  Play, 
  Pause, 
  Check, 
  Coffee, 
  X, 
  Minimize2,
  Volume2,
  VolumeX
} from 'lucide-react';
import type { Task } from '@/types';

interface FocusModeProps {
  isOpen: boolean;
  onClose: () => void;
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
}

export function FocusMode({
  isOpen,
  onClose,
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
}: FocusModeProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Auto-hide controls after 3 seconds of inactivity
  useEffect(() => {
    if (!isRunning) {
      setShowControls(true);
      return;
    }

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
  }, [isRunning]);

  if (!isOpen) return null;

  const isBreak = type === 'break';
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference * (1 - progress / 100);

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center transition-colors duration-500",
        isBreak 
          ? "bg-gradient-to-br from-teal-900 to-emerald-950" 
          : "bg-gradient-to-br from-slate-900 to-slate-950"
      )}
    >
      {/* Header - Always visible */}
      <div 
        className={cn(
          "absolute left-0 right-0 top-0 flex items-center justify-between p-4 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white/70 hover:bg-white/10 hover:text-white"
        >
          <Minimize2 className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="text-white/70 hover:bg-white/10 hover:text-white"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Quote */}
      <div 
        className={cn(
          "w-full max-w-lg px-6 text-center transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-60"
        )}
      >
        <QuoteDisplay 
          className="bg-white/5 text-white [&_blockquote]:text-white [&_cite]:text-white/60" 
          intervalSeconds={45}
          showRefreshButton
        />
      </div>

      {/* Task Title */}
      {selectedTask && (
        <h2 
          className={cn(
            "mt-6 text-2xl font-bold text-white/90 transition-opacity duration-300 md:text-3xl",
            showControls ? "opacity-100" : "opacity-80"
          )}
        >
          {selectedTask.title}
        </h2>
      )}

      {/* Timer Circle */}
      <div className="relative my-8 flex items-center justify-center">
        {/* Background circle */}
        <svg 
          className="h-64 w-64 -rotate-90 transform md:h-80 md:w-80"
          viewBox="0 0 260 260"
        >
          <circle
            cx="130"
            cy="130"
            r="120"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
          />
          <circle
            cx="130"
            cy="130"
            r="120"
            fill="none"
            stroke={isBreak ? "#10b981" : "#6366f1"}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000"
          />
        </svg>
        
        {/* Timer text */}
        <div className="absolute flex flex-col items-center">
          <span className="font-mono text-6xl font-bold tracking-tighter text-white md:text-7xl">
            {formattedTime}
          </span>
          <span className="mt-2 text-sm uppercase tracking-widest text-white/60">
            {isBreak ? 'Pausa' : 'Foco'}
          </span>
        </div>
      </div>

      {/* Session indicators */}
      <div className="mb-6 flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 w-8 rounded-full transition-colors",
              i < (sessionsCompleted % 4) 
                ? "bg-primary" 
                : "bg-white/20"
            )}
          />
        ))}
      </div>

      {/* Controls */}
      <div 
        className={cn(
          "flex items-center gap-4 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Break/Focus toggle */}
        <Button
          size="icon"
          variant="secondary"
          onClick={onBreak}
          className="h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          {isBreak ? <Play className="h-5 w-5" /> : <Coffee className="h-5 w-5" />}
        </Button>

        {/* Play/Pause */}
        <Button
          size="icon"
          onClick={isRunning ? onPause : onStart}
          className={cn(
            "h-16 w-16 rounded-full shadow-xl transition-all",
            isRunning
              ? "bg-white/20 text-white hover:bg-white/30"
              : "bg-primary text-primary-foreground hover:scale-105 hover:bg-primary/90"
          )}
        >
          {isRunning ? (
            <Pause className="h-7 w-7 fill-current" />
          ) : (
            <Play className="ml-1 h-7 w-7 fill-current" />
          )}
        </Button>

        {/* Done */}
        <Button
          size="icon"
          variant="secondary"
          onClick={onDone}
          className="h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20"
          disabled={!selectedTask}
        >
          <Check className="h-5 w-5" />
        </Button>
      </div>

      {/* Labels */}
      <div 
        className={cn(
          "mt-4 flex items-center gap-12 text-xs text-white/50 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        <span>{isBreak ? 'Foco' : 'Pausa'}</span>
        <span>{isRunning ? 'Pausar' : 'Iniciar'}</span>
        <span>Concluir</span>
      </div>
    </div>
  );
}
