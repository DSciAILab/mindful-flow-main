import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Check, ChevronRight, SkipForward, X } from 'lucide-react';
import { STRETCH_EXERCISES, type StretchExercise } from '@/types/wellness';

interface StretchGuideProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function StretchGuide({ isOpen, onComplete, onSkip }: StretchGuideProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPaused, setIsPaused] = useState(false);

  const currentExercise = STRETCH_EXERCISES[currentIndex];
  const totalExercises = STRETCH_EXERCISES.length;
  const overallProgress = ((currentIndex) / totalExercises) * 100;

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setTimeLeft(STRETCH_EXERCISES[0].durationSeconds);
      setIsPaused(false);
    }
  }, [isOpen]);

  // Timer countdown
  useEffect(() => {
    if (!isOpen || isPaused) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Move to next exercise or complete
          if (currentIndex < totalExercises - 1) {
            setCurrentIndex((i) => i + 1);
            return STRETCH_EXERCISES[currentIndex + 1].durationSeconds;
          } else {
            onComplete();
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isPaused, currentIndex, totalExercises, onComplete]);

  const handleNext = useCallback(() => {
    if (currentIndex < totalExercises - 1) {
      setCurrentIndex((i) => i + 1);
      setTimeLeft(STRETCH_EXERCISES[currentIndex + 1].durationSeconds);
    } else {
      onComplete();
    }
  }, [currentIndex, totalExercises, onComplete]);

  const exerciseProgress = currentExercise
    ? ((currentExercise.durationSeconds - timeLeft) / currentExercise.durationSeconds) * 100
    : 0;

  if (!currentExercise) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onSkip()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Guia de Alongamento</span>
            <span className="text-sm font-normal text-muted-foreground">
              {currentIndex + 1}/{totalExercises}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Overall progress */}
        <Progress value={overallProgress} className="h-1" />

        {/* Exercise content */}
        <div className="mt-4 text-center">
          {/* Icon */}
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-400/20 to-emerald-500/20">
            <span className="text-5xl animate-bounce">{currentExercise.icon}</span>
          </div>

          {/* Exercise name */}
          <h3 className="text-2xl font-bold text-foreground">
            {currentExercise.name}
          </h3>

          {/* Description */}
          <p className="mt-2 text-muted-foreground">
            {currentExercise.description}
          </p>

          {/* Timer */}
          <div className="mt-6 relative">
            <div
              className={cn(
                'mx-auto flex h-20 w-20 items-center justify-center rounded-full',
                'border-4 transition-colors',
                timeLeft <= 5 ? 'border-orange-500' : 'border-green-500'
              )}
            >
              <span className="text-3xl font-bold tabular-nums">{timeLeft}</span>
            </div>
            {/* Circular progress */}
            <svg className="absolute inset-0 -rotate-90 mx-auto h-20 w-20">
              <circle
                cx="40"
                cy="40"
                r="36"
                strokeWidth="4"
                fill="none"
                className="stroke-muted/30"
              />
              <circle
                cx="40"
                cy="40"
                r="36"
                strokeWidth="4"
                fill="none"
                className="stroke-green-500 transition-all duration-1000"
                strokeDasharray={`${(exerciseProgress / 100) * 226} 226`}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={onSkip}
            className="text-muted-foreground"
          >
            <X className="mr-2 h-4 w-4" />
            Pular tudo
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? 'Continuar' : 'Pausar'}
            </Button>

            <Button onClick={handleNext} className="gap-2">
              {currentIndex < totalExercises - 1 ? (
                <>
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Concluir
                  <Check className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
