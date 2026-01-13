import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { 
  Target, 
  Zap, 
  ChevronRight, 
  Sparkles,
  Clock,
  CheckCircle2,
  Heart,
  Droplet,
  Dumbbell,
  BookOpen,
  Pill,
  Star,
  Sun,
  Moon,
  Flame,
  Briefcase
} from "lucide-react";
import type { Task, Habit } from "@/types";
import type { DailyMission, MorningCheckin } from "@/types/dailyMission";

interface DailyMissionCardProps {
  mission: DailyMission;
  onTaskComplete: (taskId: string) => void;
  onHabitComplete: (habitId: string) => void;
  onViewAll: () => void;
  onSelectTask?: (task: Task) => void;
}

const priorityColors: Record<string, string> = {
  urgent: "border-l-priority-urgent",
  high: "border-l-priority-high",
  low: "border-l-priority-low",
};

const getHabitIcon = (iconName?: string) => {
  const map: Record<string, React.ElementType> = {
    heart: Heart,
    droplet: Droplet,
    water: Droplet,
    dumbbell: Dumbbell,
    gym: Dumbbell,
    book: BookOpen,
    pill: Pill,
    medication: Pill,
    star: Star,
    sun: Sun,
    moon: Moon,
    flame: Flame,
    fire: Flame,
    work: Briefcase,
    check: CheckCircle2,
  };

  const Icon = map[iconName?.toLowerCase() || 'check'] || CheckCircle2;
  return <Icon className="h-4 w-4" />;
};

export function DailyMissionCard({
  mission,
  onTaskComplete,
  onHabitComplete,
  onViewAll,
  onSelectTask,
}: DailyMissionCardProps) {
  // Calculate progress
  const progress = useMemo(() => {
    const totalTasks = mission.tasks.length;
    const completedTasks = mission.tasks.filter((t) => t.completedAt).length;
    const totalHabits = mission.habits.length;
    const completedHabits = mission.habits.filter(
      (h) => h.completedDays?.[new Date().toISOString().split('T')[0]]
    ).length;

    const total = totalTasks + totalHabits;
    const completed = completedTasks + completedHabits;

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [mission.tasks, mission.habits]);

  // Get energy icon and color
  const energyInfo = useMemo(() => {
    const level = mission.checkin?.energyLevel || 3;
    if (level <= 2) {
      return { color: "text-amber-500", label: "Energia baixa" };
    } else if (level <= 3) {
      return { color: "text-blue-500", label: "Energia moderada" };
    } else {
      return { color: "text-green-500", label: "Energia alta" };
    }
  }, [mission.checkin]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-background p-6 shadow-card">
      {/* Background decoration */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
      <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />

      {/* Header */}
      <div className="relative mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">
              Sua Missão de Hoje
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className={cn("h-4 w-4", energyInfo.color)} />
              <span>{energyInfo.label}</span>
              <span className="text-muted-foreground/50">•</span>
              <Clock className="h-4 w-4" />
              <span>{mission.suggestedFocusTime}min foco</span>
            </div>
          </div>
        </div>

        {/* Progress circle */}
        <div className="flex flex-col items-center">
          <div className="relative h-14 w-14">
            <svg className="h-14 w-14 -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="24"
                strokeWidth="4"
                fill="none"
                className="stroke-muted"
              />
              <circle
                cx="28"
                cy="28"
                r="24"
                strokeWidth="4"
                fill="none"
                className="stroke-primary transition-all duration-500"
                strokeDasharray={`${(progress / 100) * 151} 151`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
              {progress}%
            </span>
          </div>
        </div>
      </div>

      {/* Motivational message */}
      <div className="mb-6 flex items-center gap-2 rounded-lg bg-muted/50 p-3">
        <Sparkles className="h-4 w-4 shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">
          {mission.motivationalMessage}
        </p>
      </div>

      {/* Tasks list */}
      {mission.tasks.length > 0 && (
        <div className="mb-4 space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Tarefas prioritárias
          </h3>
          {mission.tasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                "group flex items-center gap-3 rounded-xl border-l-4 bg-muted/30 p-4 transition-all hover:bg-muted/50",
                priorityColors[task.priority],
                task.completedAt && "opacity-60"
              )}
            >
              <Checkbox
                checked={!!task.completedAt}
                onCheckedChange={() => onTaskComplete(task.id)}
                className="h-6 w-6 rounded-full"
              />
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => onSelectTask?.(task)}
              >
                <p
                  className={cn(
                    "font-medium",
                    task.completedAt && "line-through text-muted-foreground"
                  )}
                >
                  {task.title}
                </p>
                {task.estimatedMinutes && (
                  <p className="text-xs text-muted-foreground">
                    ~{task.estimatedMinutes} min
                  </p>
                )}
              </div>
              {task.completedAt && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Habits section */}
      {mission.habits.length > 0 && (
        <div className="mb-4 space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Hábitos do dia
          </h3>
          <div className="flex flex-wrap gap-2">
            {mission.habits.map((habit) => {
              const todayKey = new Date().toISOString().split('T')[0];
              const isCompleted = habit.completedDays?.[todayKey];
              
              return (
                <button
                  key={habit.id}
                  onClick={() => onHabitComplete(habit.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all",
                    isCompleted
                      ? "bg-green-500/20 text-green-600 dark:text-green-400"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className={cn(isCompleted ? "text-green-600" : "text-muted-foreground")}>
                    {getHabitIcon(habit.icon)}
                  </span>
                  <span>{habit.title}</span>
                  {isCompleted && <CheckCircle2 className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* View all button */}
      <Button
        variant="ghost"
        onClick={onViewAll}
        className="w-full justify-between text-muted-foreground hover:text-foreground"
      >
        Ver todas as tarefas
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
