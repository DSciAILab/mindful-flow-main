import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Droplets,
  Eye,
  PersonStanding,
  Wind,
  Footprints,
  X,
  Clock,
  Check,
} from 'lucide-react';
import type { WellnessReminder, ReminderType } from '@/types/wellness';

interface WellnessReminderToastProps {
  reminder: WellnessReminder;
  onComplete: () => void;
  onSnooze: (minutes: number) => void;
  onDismiss: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  Droplets,
  Eye,
  PersonStanding,
  Wind,
  Footprints,
  Stretch: PersonStanding, // Fallback for stretch
};

export function WellnessReminderToast({
  reminder,
  onComplete,
  onSnooze,
  onDismiss,
}: WellnessReminderToastProps) {
  const IconComponent = iconMap[reminder.icon] || Droplets;
  const progressRef = useRef<HTMLDivElement>(null);

  // Auto-dismiss progress animation
  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.width = '100%';
      // Trigger animation after mount
      requestAnimationFrame(() => {
        if (progressRef.current) {
          progressRef.current.style.width = '0%';
        }
      });
    }
  }, []);

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300',
        'w-full max-w-sm overflow-hidden rounded-2xl border border-border/50',
        'bg-card/95 backdrop-blur-lg shadow-2xl'
      )}
    >
      {/* Progress bar for auto-dismiss */}
      <div className="h-1 w-full bg-muted/30">
        <div
          ref={progressRef}
          className="h-full transition-all duration-[30000ms] ease-linear"
          style={{ backgroundColor: reminder.color, width: '100%' }}
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Animated icon */}
          <div
            className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl animate-pulse"
            style={{ backgroundColor: `${reminder.color}20` }}
          >
            <IconComponent
              className="h-7 w-7"
              style={{ color: reminder.color }}
            />
            {/* Ripple effect */}
            <div
              className="absolute inset-0 rounded-xl animate-ping opacity-20"
              style={{ backgroundColor: reminder.color }}
            />
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-foreground">
                {reminder.title}
              </h3>
              <button
                onClick={onDismiss}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {reminder.message}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex items-center gap-2">
          <Button
            onClick={onComplete}
            className="flex-1 gap-2"
            style={{ backgroundColor: reminder.color }}
          >
            <Check className="h-4 w-4" />
            Feito
          </Button>
          <Button
            variant="outline"
            onClick={() => onSnooze(10)}
            className="gap-2"
          >
            <Clock className="h-4 w-4" />
            10 min
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
