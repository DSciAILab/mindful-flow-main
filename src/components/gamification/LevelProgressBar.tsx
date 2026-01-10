import { 
  Sprout, Leaf, TreeDeciduous, Trees, Mountain, Flame, Zap, Sword, Crown, Sun
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { UserProgress } from '@/types/gamification';
import { cn } from '@/lib/utils';

interface LevelProgressBarProps {
  progress: UserProgress | null;
  showDetails?: boolean;
  compact?: boolean;
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

export function LevelProgressBar({
  progress,
  showDetails = true,
  compact = false,
}: LevelProgressBarProps) {
  if (!progress) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5">
        <Sprout className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  const { currentLevel, nextLevel, totalPoints, pointsToNextLevel, progressPercent } = progress;
  const CurrentIcon = iconMap[currentLevel.icon] || Sprout;
  const NextIcon = nextLevel ? iconMap[nextLevel.icon] || Sprout : null;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {/* Current Level Icon */}
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{
            background: `linear-gradient(135deg, ${currentLevel.color}20, ${currentLevel.color}40)`,
            border: `1.5px solid ${currentLevel.color}`,
          }}
        >
          <CurrentIcon className="h-4 w-4" style={{ color: currentLevel.color }} />
        </div>

        {/* Progress Bar */}
        <div className="flex-1 min-w-[100px]">
          <div className="flex items-center justify-between text-xs mb-0.5">
            <span className="font-medium" style={{ color: currentLevel.color }}>
              Nível {currentLevel.level}
            </span>
            {nextLevel && (
              <span className="text-muted-foreground">
                {Math.round(progressPercent)}%
              </span>
            )}
          </div>
          <Progress
            value={progressPercent}
            className="h-1.5"
            style={
              {
                '--progress-color': currentLevel.color,
              } as React.CSSProperties
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl bg-card border border-border/50 p-4", !showDetails && "p-3")}>
      <div className="flex items-center gap-4">
        {/* Current Level Icon */}
        <div
          className={cn(
            "flex items-center justify-center rounded-xl shadow-md",
            showDetails ? "h-14 w-14" : "h-10 w-10"
          )}
          style={{
            background: `linear-gradient(135deg, ${currentLevel.color}20, ${currentLevel.color}50)`,
            border: `2px solid ${currentLevel.color}`,
          }}
        >
          <CurrentIcon
            className={cn(showDetails ? "h-7 w-7" : "h-5 w-5")}
            style={{ color: currentLevel.color }}
          />
        </div>

        {/* Progress Info */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">
                {currentLevel.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                Nível {currentLevel.level}
              </p>
            </div>
            {showDetails && (
              <div className="text-right">
                <p className="text-sm font-semibold" style={{ color: currentLevel.color }}>
                  {totalPoints.toLocaleString()} pts
                </p>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-2">
            <Progress
              value={progressPercent}
              className="h-2"
              style={
                {
                  '--progress-color': currentLevel.color,
                } as React.CSSProperties
              }
            />
            {showDetails && nextLevel && (
              <div className="flex items-center justify-between mt-1.5 text-xs text-muted-foreground">
                <span>{pointsToNextLevel} pts para próximo nível</span>
                <div className="flex items-center gap-1">
                  <span>{nextLevel.title}</span>
                  {NextIcon && (
                    <NextIcon className="h-3 w-3" style={{ color: nextLevel.color }} />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
