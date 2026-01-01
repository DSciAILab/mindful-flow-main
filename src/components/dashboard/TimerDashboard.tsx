import { useUserStats } from '@/hooks/useUserStats';
import { useTasks } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';
import { 
  Clock, 
  Target, 
  Flame, 
  TrendingUp,
  Calendar,
  CheckCircle2
} from 'lucide-react';

interface TimerDashboardProps {
  className?: string;
}

export function TimerDashboard({ className }: TimerDashboardProps) {
  const { stats } = useUserStats();
  const { tasks } = useTasks();

  const completedTasks = tasks.filter(t => t.status === 'done');
  const todayTasks = completedTasks.filter(t => {
    if (!t.completedAt) return false;
    const today = new Date();
    const completedDate = new Date(t.completedAt);
    return completedDate.toDateString() === today.toDateString();
  });

  // Calculate weekly data (mock for now - would need actual session tracking)
  const weekData = [
    { day: 'Seg', minutes: 45 },
    { day: 'Ter', minutes: 60 },
    { day: 'Qua', minutes: 30 },
    { day: 'Qui', minutes: 90 },
    { day: 'Sex', minutes: 75 },
    { day: 'Sáb', minutes: 20 },
    { day: 'Dom', minutes: stats.focusMinutesToday },
  ];

  const maxMinutes = Math.max(...weekData.map(d => d.minutes), 60);
  const totalWeekMinutes = weekData.reduce((acc, d) => acc + d.minutes, 0);
  const avgMinutes = Math.round(totalWeekMinutes / 7);

  const statCards = [
    {
      icon: Clock,
      label: 'Foco Hoje',
      value: `${stats.focusMinutesToday}`,
      unit: 'min',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      icon: CheckCircle2,
      label: 'Tarefas Concluídas',
      value: `${stats.tasksCompletedToday}`,
      unit: 'hoje',
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      icon: Flame,
      label: 'Streak',
      value: `${stats.currentStreak}`,
      unit: 'dias',
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      icon: Target,
      label: 'Pontos',
      value: `${stats.totalPoints}`,
      unit: 'pts',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm"
          >
            <div className={cn("mb-3 inline-flex rounded-xl p-2.5", stat.bg)}>
              <stat.icon className={cn("h-5 w-5", stat.color)} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">
                {stat.value}
              </span>
              <span className="text-sm text-muted-foreground">
                {stat.unit}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Weekly Chart */}
      <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">
              Esta Semana
            </h3>
            <p className="text-sm text-muted-foreground">
              {totalWeekMinutes} min total • {avgMinutes} min/dia média
            </p>
          </div>
          <div className="flex items-center gap-2 text-primary">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">+12%</span>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="flex h-32 items-end justify-between gap-2">
          {weekData.map((data, i) => {
            const height = (data.minutes / maxMinutes) * 100;
            const isToday = i === weekData.length - 1;
            
            return (
              <div key={data.day} className="flex flex-1 flex-col items-center gap-2">
                <div 
                  className="relative w-full"
                  style={{ height: '100px' }}
                >
                  <div
                    className={cn(
                      "absolute bottom-0 w-full rounded-t-md transition-all duration-500",
                      isToday 
                        ? "bg-primary" 
                        : "bg-primary/30 hover:bg-primary/50"
                    )}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className={cn(
                  "text-xs",
                  isToday ? "font-medium text-foreground" : "text-muted-foreground"
                )}>
                  {data.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">
            Tarefas Recentes
          </h3>
        </div>

        {todayTasks.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhuma tarefa concluída hoje ainda
          </p>
        ) : (
          <div className="space-y-3">
            {todayTasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-xl bg-muted/30 p-3"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-foreground">
                    {task.title}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {task.timeSpentMinutes} min
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
