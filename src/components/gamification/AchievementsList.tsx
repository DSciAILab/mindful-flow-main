import { useState, useMemo } from 'react';
import { 
  Trophy, CheckCircle, Rocket, Timer, Target, Flame, Calendar, Star,
  Award, Sunrise, Moon, Heart, Footprints, Lock, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { Achievement, UserAchievement, AchievementStats, AchievementCategory } from '@/types/gamification';
import { cn } from '@/lib/utils';

interface AchievementsListProps {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  stats: AchievementStats;
  getProgress: (achievement: Achievement, stats: AchievementStats) => number;
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
  Lock,
};

const categoryLabels: Record<AchievementCategory, string> = {
  tasks: 'Tarefas',
  focus: 'Foco',
  habits: 'Hábitos',
  streaks: 'Sequências',
  special: 'Especiais',
};

const categoryColors: Record<AchievementCategory, string> = {
  tasks: '#3B82F6',
  focus: '#06B6D4',
  habits: '#A855F7',
  streaks: '#F97316',
  special: '#EC4899',
};

type SortOption = 'recent' | 'category' | 'progress';

export function AchievementsList({
  achievements,
  userAchievements,
  stats,
  getProgress,
}: AchievementsListProps) {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('category');

  const unlockedCodes = useMemo(
    () => new Set(userAchievements.map(ua => ua.achievement.code)),
    [userAchievements]
  );

  const unlockedDates = useMemo(
    () => new Map(userAchievements.map(ua => [ua.achievement.code, ua.unlockedAt])),
    [userAchievements]
  );

  const filteredAndSorted = useMemo(() => {
    let filtered = achievements;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }

    // Filter out secret achievements that aren't unlocked
    filtered = filtered.filter(a => !a.isSecret || unlockedCodes.has(a.code));

    // Sort
    return [...filtered].sort((a, b) => {
      const aUnlocked = unlockedCodes.has(a.code);
      const bUnlocked = unlockedCodes.has(b.code);

      switch (sortBy) {
        case 'recent':
          if (aUnlocked && bUnlocked) {
            const aDate = unlockedDates.get(a.code)?.getTime() || 0;
            const bDate = unlockedDates.get(b.code)?.getTime() || 0;
            return bDate - aDate;
          }
          return aUnlocked ? -1 : bUnlocked ? 1 : 0;
        case 'category':
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
          }
          return aUnlocked === bUnlocked ? 0 : aUnlocked ? -1 : 1;
        case 'progress':
          if (!aUnlocked && !bUnlocked) {
            return getProgress(b, stats) - getProgress(a, stats);
          }
          return aUnlocked === bUnlocked ? 0 : aUnlocked ? -1 : 1;
        default:
          return 0;
      }
    });
  }, [achievements, selectedCategory, sortBy, unlockedCodes, unlockedDates, stats, getProgress]);

  const categories: (AchievementCategory | 'all')[] = ['all', 'tasks', 'focus', 'habits', 'streaks', 'special'];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="text-xs"
              style={
                selectedCategory === cat && cat !== 'all'
                  ? { backgroundColor: categoryColors[cat as AchievementCategory] }
                  : undefined
              }
            >
              {cat === 'all' ? 'Todas' : categoryLabels[cat]}
            </Button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="text-sm bg-muted/50 border border-border rounded-lg px-2 py-1"
          >
            <option value="category">Por Categoria</option>
            <option value="recent">Recentes</option>
            <option value="progress">Por Progresso</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>
          <strong className="text-foreground">{userAchievements.length}</strong> de{' '}
          {achievements.filter(a => !a.isSecret).length} conquistadas
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSorted.map(achievement => {
          const isUnlocked = unlockedCodes.has(achievement.code);
          const unlockedDate = unlockedDates.get(achievement.code);
          const progress = !isUnlocked ? getProgress(achievement, stats) : 100;
          const IconComponent = iconMap[achievement.icon] || Trophy;

          return (
            <div
              key={achievement.id}
              className={cn(
                "relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-200",
                isUnlocked
                  ? "bg-card border-border/50 shadow-soft"
                  : "bg-muted/30 border-border/30"
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                  isUnlocked ? "shadow-md" : "opacity-50"
                )}
                style={{
                  background: isUnlocked
                    ? `linear-gradient(135deg, ${achievement.color}20, ${achievement.color}40)`
                    : 'rgba(0,0,0,0.1)',
                  border: `2px solid ${isUnlocked ? achievement.color : 'rgba(0,0,0,0.2)'}`,
                }}
              >
                {achievement.isSecret && !isUnlocked ? (
                  <Lock className="h-6 w-6 text-muted-foreground" />
                ) : (
                  <IconComponent
                    className="h-6 w-6"
                    style={{ color: isUnlocked ? achievement.color : 'gray' }}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3
                  className={cn(
                    "font-semibold text-sm",
                    isUnlocked ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {achievement.isSecret && !isUnlocked ? '???' : achievement.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {achievement.isSecret && !isUnlocked
                    ? 'Complete para descobrir!'
                    : achievement.description}
                </p>

                {/* Progress or Date */}
                {isUnlocked ? (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">
                      {unlockedDate?.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span
                      className="text-xs font-medium"
                      style={{ color: achievement.color }}
                    >
                      +{achievement.pointsReward} pts
                    </span>
                  </div>
                ) : (
                  achievement.category !== 'special' && (
                    <div className="mt-2">
                      <Progress value={progress} className="h-1.5" />
                      <span className="text-xs text-muted-foreground mt-1">
                        {Math.round(progress)}%
                      </span>
                    </div>
                  )
                )}
              </div>

              {/* Category Badge */}
              <div
                className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{
                  backgroundColor: `${categoryColors[achievement.category]}20`,
                  color: categoryColors[achievement.category],
                }}
              >
                {categoryLabels[achievement.category]}
              </div>
            </div>
          );
        })}
      </div>

      {filteredAndSorted.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Nenhuma conquista encontrada nesta categoria.</p>
        </div>
      )}
    </div>
  );
}
