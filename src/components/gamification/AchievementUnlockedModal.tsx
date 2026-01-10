import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Trophy, CheckCircle, Rocket, Timer, Target, Flame, Calendar, Star,
  Award, Sunrise, Moon, Heart, Footprints, Sparkles
} from 'lucide-react';
import type { Achievement } from '@/types/gamification';
import { cn } from '@/lib/utils';

interface AchievementUnlockedModalProps {
  achievement: Achievement | null;
  isOpen: boolean;
  onClose: () => void;
}

// Map icon names to components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Trophy,
  CheckCircle,
  Rocket,
  Timer,
  Target,
  Flame,
  Calendar,
  Star,
  Award,
  Sunrise,
  Moon,
  Heart,
  Footprints,
  Sparkles,
};

export function AchievementUnlockedModal({
  achievement,
  isOpen,
  onClose,
}: AchievementUnlockedModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
    }
  }, [isOpen, onClose]);

  if (!achievement) return null;

  const IconComponent = iconMap[achievement.icon] || Trophy;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-none bg-transparent shadow-none overflow-visible">
        <div className="relative flex flex-col items-center justify-center py-8 px-6">
          {/* Confetti Animation */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: '-10px',
                    animationDelay: `${Math.random() * 0.5}s`,
                    animationDuration: `${1 + Math.random()}s`,
                  }}
                >
                  <Sparkles
                    className="h-4 w-4"
                    style={{ color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#A855F7', '#3B82F6'][i % 5] }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Background Glow */}
          <div
            className="absolute inset-0 rounded-3xl opacity-20 blur-3xl"
            style={{ backgroundColor: achievement.color }}
          />

          {/* Card */}
          <div className="relative z-10 flex flex-col items-center bg-card/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-border/50 animate-in zoom-in-95 duration-300">
            {/* Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1 text-xs font-semibold uppercase tracking-wider bg-gradient-warm text-white rounded-full shadow-lg">
                Nova Conquista!
              </span>
            </div>

            {/* Icon */}
            <div
              className={cn(
                "mt-4 flex h-24 w-24 items-center justify-center rounded-full shadow-xl animate-bounce-subtle"
              )}
              style={{
                background: `linear-gradient(135deg, ${achievement.color}20, ${achievement.color}40)`,
                border: `3px solid ${achievement.color}`,
              }}
            >
              <IconComponent
                className="h-12 w-12"
                style={{ color: achievement.color }}
              />
            </div>

            {/* Title */}
            <h2 className="mt-6 text-2xl font-bold text-foreground text-center">
              {achievement.title}
            </h2>

            {/* Description */}
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-xs">
              {achievement.description}
            </p>

            {/* Points Reward */}
            {achievement.pointsReward > 0 && (
              <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-reward-gold/10 border border-reward-gold/30">
                <Star className="h-5 w-5 text-reward-gold" />
                <span className="text-lg font-bold text-reward-gold">
                  +{achievement.pointsReward} pontos
                </span>
              </div>
            )}

            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              className="mt-6 text-muted-foreground"
              onClick={onClose}
            >
              Continuar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
