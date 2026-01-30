import { Trophy, Flame, Target, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { HabitWithStats } from "@/types";

interface HabitStatsProps {
  stats: {
    totalHabits: number;
    completedToday: number;
    averageCompletionRate: number;
    longestCurrentStreak: number;
    longestOverallStreak: number;
    perfectDays: number;
    mostConsistentHabit: HabitWithStats | null;
  };
  customLabel?: string;
}

export function HabitStats({ stats, customLabel }: HabitStatsProps) {
  if (stats.totalHabits === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Today's Progress */}
      <Card className="border-border/50 bg-gradient-to-br from-primary/10 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/20 p-2.5 text-primary">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {customLabel || "Hoje"}
              </p>
              <p className="text-2xl font-bold">
                {stats.completedToday}/{stats.totalHabits}
              </p>
              <p className="text-xs text-muted-foreground">
                hábitos completados
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Longest Streak */}
      <Card className="border-border/50 bg-gradient-to-br from-orange-500/10 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-500/20 p-2.5 text-orange-500">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Maior Sequência
              </p>
              <p className="text-2xl font-bold">
                {stats.longestCurrentStreak} dias
              </p>
              <p className="text-xs text-muted-foreground">
                recorde: {stats.longestOverallStreak} dias
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completion Rate */}
      <Card className="border-border/50 bg-gradient-to-br from-green-500/10 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-500/20 p-2.5 text-green-500">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Taxa de Conclusão
              </p>
              <p className="text-2xl font-bold">
                {stats.averageCompletionRate}%
              </p>
              <p className="text-xs text-muted-foreground">
                últimos 30 dias
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Perfect Days */}
      <Card className="border-border/50 bg-gradient-to-br from-purple-500/10 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-500/20 p-2.5 text-purple-500">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Dias Perfeitos
              </p>
              <p className="text-2xl font-bold">
                {stats.perfectDays}
              </p>
              <p className="text-xs text-muted-foreground">
                todos os hábitos feitos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Most Consistent Habit */}
      {stats.mostConsistentHabit && (
        <Card className="border-border/50 sm:col-span-2 lg:col-span-4">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div 
                className="rounded-xl p-2.5"
                style={{ backgroundColor: `${stats.mostConsistentHabit.color}20` }}
              >
                <Calendar 
                  className="h-5 w-5" 
                  style={{ color: stats.mostConsistentHabit.color }}
                />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Hábito Mais Consistente
                </p>
                <p className="text-lg font-bold">
                  {stats.mostConsistentHabit.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.mostConsistentHabit.completionRate}% de conclusão • 
                  {stats.mostConsistentHabit.streak.currentStreak} dias de sequência
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
