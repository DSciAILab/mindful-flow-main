import { useState, useEffect } from 'react';
import { Trophy, Star, Flame, Timer, Target, CheckSquare } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import { LevelProgressBar } from './LevelProgressBar';
import { AchievementsList } from './AchievementsList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Achievement, AchievementStats } from '@/types/gamification';
import { cn } from '@/lib/utils';

interface GamificationDashboardProps {
  stats: AchievementStats;
}

export function GamificationDashboard({ stats }: GamificationDashboardProps) {
  const { 
    userProgress, 
    getNextAchievements, 
    getAchievementProgress,
    isLoading 
  } = useGamification();
  
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);

  // Fetch all achievements for the list
  useEffect(() => {
    if (userProgress?.achievements) {
      // Get unique achievements from user + next achievements
      const achievementSet = new Map<string, Achievement>();
      
      userProgress.achievements.forEach(ua => {
        if (ua.achievement) {
          achievementSet.set(ua.achievement.id, ua.achievement);
        }
      });
      
      getNextAchievements(20).forEach(a => {
        achievementSet.set(a.id, a);
      });
      
      setAllAchievements(Array.from(achievementSet.values()));
    }
  }, [userProgress, getNextAchievements]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const nextAchievements = getNextAchievements(3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conquistas</h1>
          <p className="text-muted-foreground">
            Continue evoluindo e desbloqueando novas conquistas!
          </p>
        </div>
        <Trophy className="h-8 w-8 text-reward-gold" />
      </div>

      {/* Level Progress */}
      <LevelProgressBar progress={userProgress} showDetails />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                <CheckSquare className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.tasksCompleted}</p>
                <p className="text-xs text-muted-foreground">Tarefas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
                <Timer className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Math.floor(stats.focusMinutesTotal / 60)}h
                </p>
                <p className="text-xs text-muted-foreground">Tempo Focado</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.currentStreak}</p>
                <p className="text-xs text-muted-foreground">Streak Atual</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {userProgress?.totalPoints.toLocaleString() || 0}
                </p>
                <p className="text-xs text-muted-foreground">Pontos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Achievements */}
      {userProgress && userProgress.recentAchievements.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-reward-gold" />
              Conquistas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {userProgress.recentAchievements.slice(0, 5).map(ua => (
                <div
                  key={ua.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50"
                  style={{ borderLeft: `3px solid ${ua.achievement.color}` }}
                >
                  <span className="font-medium text-sm">{ua.achievement.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(ua.unlockedAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Achievements */}
      {nextAchievements.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Próximas Conquistas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {nextAchievements.map(achievement => {
                const progress = getAchievementProgress(achievement, stats);
                return (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-4 p-3 rounded-lg border border-border/50 bg-muted/30"
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{
                        background: `linear-gradient(135deg, ${achievement.color}20, ${achievement.color}40)`,
                        border: `1.5px solid ${achievement.color}`,
                      }}
                    >
                      <Trophy className="h-5 w-5" style={{ color: achievement.color }} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{achievement.title}</h4>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      {achievement.category !== 'special' && (
                        <div className="mt-1 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${progress}%`,
                              backgroundColor: achievement.color,
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: achievement.color }}
                      >
                        +{achievement.pointsReward} pts
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Achievements Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => setShowAllAchievements(!showAllAchievements)}
          className="gap-2"
        >
          <Trophy className="h-4 w-4" />
          {showAllAchievements ? 'Ocultar Todas' : 'Ver Todas as Conquistas'}
        </Button>
      </div>

      {/* All Achievements Grid */}
      {showAllAchievements && allAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Todas as Conquistas</CardTitle>
          </CardHeader>
          <CardContent>
            <AchievementsList
              achievements={allAchievements}
              userAchievements={userProgress?.achievements || []}
              stats={stats}
              getProgress={getAchievementProgress}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
