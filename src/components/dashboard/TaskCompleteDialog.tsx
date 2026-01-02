import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCompleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle?: string;
  xpEarned?: number;
  sessionsCompleted?: number;
}

export function TaskCompleteDialog({
  isOpen,
  onClose,
  taskTitle,
  xpEarned = 10,
  sessionsCompleted = 1,
}: TaskCompleteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-none bg-gradient-to-br from-gray-900 to-gray-800 p-0 overflow-hidden">
        <div className="relative px-8 py-12 text-center">
          {/* Animated Check Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              {/* Animated ring */}
              <div className="absolute inset-0 animate-ping">
                <div className="h-32 w-32 rounded-full bg-emerald-500/20" />
              </div>
              
              {/* Main icon */}
              <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/50">
                <CheckCircle2 className="h-16 w-16 text-white animate-scale-in" />
                
                {/* Highlight effect */}
                <div className="absolute top-6 left-6 h-8 w-8 rounded-full bg-white/30 blur-sm" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="mb-2 text-4xl font-bold text-white animate-fade-in">
            Well done!
          </h2>

          {/* Subtitle */}
          <div className="mb-6 flex items-center justify-center gap-2 text-2xl font-semibold text-gray-200 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <span>Task Complete!</span>
            <Trophy className="h-7 w-7 text-amber-400" />
          </div>

          {/* Task Title (if provided) */}
          {taskTitle && (
            <p className="mb-4 text-gray-400 animate-fade-in" style={{ animationDelay: '200ms' }}>
              "{taskTitle}"
            </p>
          )}

          {/* Stats */}
          <div className="mb-8 space-y-2 animate-fade-in" style={{ animationDelay: '300ms' }}>
            {/* XP earned */}
            <div className="flex items-center justify-center gap-2 text-xl text-emerald-400">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                <span className="text-sm font-bold">+</span>
              </div>
              <span className="font-semibold">You earned +{xpEarned} XP</span>
            </div>

            {/* Sessions completed */}
            {sessionsCompleted > 0 && (
              <p className="text-sm text-gray-400">
                {sessionsCompleted} Pomodoro session{sessionsCompleted > 1 ? 's' : ''} completed
              </p>
            )}
          </div>

          {/* Finish Button */}
          <Button
            onClick={onClose}
            size="lg"
            className={cn(
              "w-full bg-gray-700 text-white hover:bg-gray-600",
              "text-lg font-semibold py-6 rounded-2xl",
              "animate-fade-in"
            )}
            style={{ animationDelay: '400ms' }}
          >
            Finish
          </Button>

          {/* Decorative elements */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {/* Confetti particles */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${20 + i * 10}%`,
                  top: '-10%',
                  animationDelay: `${i * 100}ms`,
                  animationDuration: `${2 + i * 0.2}s`,
                }}
              >
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    i % 3 === 0 && "bg-emerald-400",
                    i % 3 === 1 && "bg-amber-400",
                    i % 3 === 2 && "bg-blue-400"
                  )}
                />
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
