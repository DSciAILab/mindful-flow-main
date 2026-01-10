import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Sprout, Leaf, TreeDeciduous, Trees, Mountain, Flame, Zap, Sword, Crown, Sun,
  ArrowRight, Sparkles
} from 'lucide-react';
import type { Level } from '@/types/gamification';
import { cn } from '@/lib/utils';

interface LevelUpModalProps {
  previousLevel: Level | null;
  newLevel: Level | null;
  isOpen: boolean;
  onClose: () => void;
}

// Map icon names to components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sprout,
  Leaf,
  TreeDeciduous,
  Trees,
  Mountain,
  Flame,
  Zap,
  Sword,
  Crown,
  Sun,
};

const motivationalMessages = [
  'Você está evoluindo! Continue assim! 🚀',
  'Incrível! Seu esforço está valendo a pena! 💪',
  'Nível acima! Você é imparável! ⚡',
  'Uau! Sua dedicação é inspiradora! 🌟',
  'Fenomenal! Continue quebrando barreiras! 🔥',
];

export function LevelUpModal({
  previousLevel,
  newLevel,
  isOpen,
  onClose,
}: LevelUpModalProps) {
  const [showAnimation, setShowAnimation] = useState(false);
  const [message] = useState(
    () => motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
  );

  useEffect(() => {
    if (isOpen) {
      setShowAnimation(true);
    } else {
      setShowAnimation(false);
    }
  }, [isOpen]);

  if (!previousLevel || !newLevel) return null;

  const PreviousIcon = iconMap[previousLevel.icon] || Sprout;
  const NewIcon = iconMap[newLevel.icon] || Sprout;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg border-none bg-transparent shadow-none overflow-visible">
        <div className="relative flex flex-col items-center justify-center py-8 px-6">
          {/* Sparkles Animation */}
          {showAnimation && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-sparkle"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                  }}
                >
                  <Sparkles
                    className="h-3 w-3"
                    style={{ color: newLevel.color }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Background Glow */}
          <div
            className="absolute inset-0 rounded-3xl opacity-30 blur-3xl animate-pulse"
            style={{ backgroundColor: newLevel.color }}
          />

          {/* Card */}
          <div className="relative z-10 flex flex-col items-center bg-card/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-border/50 animate-in zoom-in-95 duration-500">
            {/* Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span 
                className="px-4 py-1 text-xs font-semibold uppercase tracking-wider text-white rounded-full shadow-lg"
                style={{ background: `linear-gradient(135deg, ${newLevel.color}, ${previousLevel.color})` }}
              >
                Level Up!
              </span>
            </div>

            {/* Level Transition */}
            <div className="mt-6 flex items-center gap-4">
              {/* Previous Level */}
              <div className="flex flex-col items-center opacity-50">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${previousLevel.color}20, ${previousLevel.color}40)`,
                    border: `2px solid ${previousLevel.color}`,
                  }}
                >
                  <PreviousIcon
                    className="h-8 w-8"
                    style={{ color: previousLevel.color }}
                  />
                </div>
                <span className="mt-2 text-sm font-medium text-muted-foreground">
                  Nível {previousLevel.level}
                </span>
              </div>

              {/* Arrow */}
              <ArrowRight className="h-6 w-6 text-muted-foreground animate-pulse" />

              {/* New Level */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-20 w-20 items-center justify-center rounded-full shadow-xl",
                    showAnimation && "animate-bounce-subtle"
                  )}
                  style={{
                    background: `linear-gradient(135deg, ${newLevel.color}30, ${newLevel.color}60)`,
                    border: `3px solid ${newLevel.color}`,
                    boxShadow: `0 0 30px ${newLevel.color}50`,
                  }}
                >
                  <NewIcon
                    className="h-10 w-10"
                    style={{ color: newLevel.color }}
                  />
                </div>
                <span
                  className="mt-2 text-sm font-bold"
                  style={{ color: newLevel.color }}
                >
                  Nível {newLevel.level}
                </span>
              </div>
            </div>

            {/* New Title */}
            <h2 className="mt-6 text-2xl font-bold text-foreground text-center">
              {newLevel.title}
            </h2>

            {/* Motivational Message */}
            <p className="mt-3 text-sm text-muted-foreground text-center max-w-xs">
              {message}
            </p>

            {/* Points Info */}
            <div className="mt-4 text-xs text-muted-foreground">
              {newLevel.minPoints.toLocaleString()}+ pontos alcançados
            </div>

            {/* Continue Button */}
            <Button
              className="mt-6"
              style={{
                background: `linear-gradient(135deg, ${newLevel.color}, ${newLevel.color}CC)`,
              }}
              onClick={onClose}
            >
              Continuar Evoluindo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
