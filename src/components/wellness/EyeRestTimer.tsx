import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Eye, Check } from 'lucide-react';

interface EyeRestTimerProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function EyeRestTimer({ isOpen, onComplete }: EyeRestTimerProps) {
  const [timeLeft, setTimeLeft] = useState(20);
  const [isComplete, setIsComplete] = useState(false);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(20);
      setIsComplete(false);
    }
  }, [isOpen]);

  // Timer countdown
  useEffect(() => {
    if (!isOpen || isComplete) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsComplete(true);
          // Auto-close after showing completion
          setTimeout(() => {
            onComplete();
          }, 1500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isComplete, onComplete]);

  const progress = ((20 - timeLeft) / 20) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onComplete()}>
      <DialogContent
        className={cn(
          'sm:max-w-lg border-0 p-0 overflow-hidden',
          'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900'
        )}
      >
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-white">
          {/* Stars background effect */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))}
          </div>

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Icon */}
            <div
              className={cn(
                'mb-6 flex h-24 w-24 items-center justify-center rounded-full',
                'bg-gradient-to-br from-purple-500/30 to-violet-600/30',
                'transition-all duration-500',
                isComplete && 'scale-110 from-green-500/30 to-emerald-600/30'
              )}
            >
              {isComplete ? (
                <Check className="h-12 w-12 text-green-400 animate-in zoom-in duration-300" />
              ) : (
                <Eye className="h-12 w-12 text-purple-300 animate-pulse" />
              )}
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center mb-2">
              {isComplete ? 'Ótimo trabalho! 👀' : 'Regra 20-20-20'}
            </h2>

            {/* Subtitle */}
            <p className="text-purple-200/80 text-center max-w-xs mb-8">
              {isComplete
                ? 'Seus olhos agradecem!'
                : 'Olhe para algo a pelo menos 6 metros de distância'}
            </p>

            {/* Timer */}
            {!isComplete && (
              <div className="relative">
                {/* Outer ring */}
                <svg className="h-40 w-40 -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    strokeWidth="6"
                    fill="none"
                    className="stroke-white/10"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    strokeWidth="6"
                    fill="none"
                    className="stroke-purple-400 transition-all duration-1000"
                    strokeDasharray={`${(progress / 100) * 440} 440`}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Timer text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold tabular-nums">{timeLeft}</span>
                  <span className="text-sm text-purple-300/60 mt-1">segundos</span>
                </div>
              </div>
            )}

            {/* Completion animation */}
            {isComplete && (
              <div className="flex items-center gap-2 text-green-400 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <span className="text-lg">✨</span>
                <span className="font-medium">Descanso visual completo</span>
                <span className="text-lg">✨</span>
              </div>
            )}
          </div>

          {/* Tip at bottom */}
          {!isComplete && (
            <p className="absolute bottom-6 text-xs text-purple-300/50 text-center">
              Relaxe os olhos e pisque normalmente
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
