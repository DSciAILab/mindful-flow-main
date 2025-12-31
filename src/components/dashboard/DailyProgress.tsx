import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, Target, Flame, TrendingUp } from "lucide-react";
import type { UserStats } from "@/types";

interface DailyProgressProps {
  stats: UserStats;
  dailyGoals: {
    tasks: number;
    focusMinutes: number;
  };
}

export function DailyProgress({ stats, dailyGoals }: DailyProgressProps) {
  const taskProgress = Math.min((stats.tasksCompletedToday / dailyGoals.tasks) * 100, 100);
  const focusProgress = Math.min((stats.focusMinutesToday / dailyGoals.focusMinutes) * 100, 100);

  const getMotivationalMessage = () => {
    if (taskProgress >= 100 && focusProgress >= 100) {
      return { icon: TrendingUp, text: "Dia INCRÍVEL! Você arrasou!" };
    } else if (taskProgress >= 75 || focusProgress >= 75) {
      return { icon: Flame, text: "Quase lá! Continue assim!" };
    } else if (taskProgress >= 50 || focusProgress >= 50) {
      return { icon: Target, text: "Ótimo progresso! Você consegue!" };
    } else if (taskProgress >= 25 || focusProgress >= 25) {
      return { icon: CheckCircle2, text: "Bom começo! Um passo de cada vez." };
    }
    return { icon: Target, text: "Novo dia, novas conquistas!" };
  };

  const motivation = getMotivationalMessage();
  const MotivationIcon = motivation.icon;

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-foreground">
          <TrendingUp className="h-5 w-5 text-primary" />
          Progresso de Hoje
        </h3>
        <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2 py-1">
          <Flame className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary">{stats.currentStreak} dias</span>
        </div>
      </div>

      {/* Motivational message */}
      <div className="mb-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 p-3">
        <div className="flex items-center gap-2">
          <MotivationIcon className="h-5 w-5 text-primary" />
          <p className="text-sm font-medium text-foreground">
            {motivation.text}
          </p>
        </div>
      </div>

      {/* Progress metrics */}
      <div className="space-y-4">
        {/* Tasks completed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-status-completed" />
              <span className="font-medium text-foreground">Tarefas</span>
            </div>
            <span className="text-muted-foreground">
              {stats.tasksCompletedToday}/{dailyGoals.tasks}
            </span>
          </div>
          <Progress value={taskProgress} className="h-2" />
        </div>

        {/* Focus time */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">Tempo de Foco</span>
            </div>
            <span className="text-muted-foreground">
              {stats.focusMinutesToday}/{dailyGoals.focusMinutes} min
            </span>
          </div>
          <Progress value={focusProgress} className="h-2" />
        </div>

        {/* Level progress */}
        <div className="mt-4 rounded-xl bg-reward-gold/10 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-reward-gold" />
              <span className="text-sm font-medium text-foreground">Nível {stats.level}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {stats.totalPoints} pontos
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
