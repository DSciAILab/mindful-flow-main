import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Pause, 
  XCircle,
  Calendar,
  Flame,
  TrendingUp,
  CheckCircle2,
  RotateCcw,
  Archive,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Habit, HabitArchiveStatus } from "@/types";

interface ArchivedHabitStats {
  totalDays: number;
  totalCompleted: number;
  completionRate: number;
  longestStreak: number;
  startDate: Date;
  endDate: Date;
  activeDays: number;
}

interface ArchivedHabitsSectionProps {
  archivedHabits: Habit[];
  getArchivedHabitStats: (habit: Habit) => ArchivedHabitStats;
  onRestore: (habitId: string) => Promise<boolean>;
  canRestore: boolean;
}

// Icon map for archive status
const statusConfig: Record<HabitArchiveStatus, { 
  icon: typeof Trophy; 
  label: string; 
  color: string;
  bgColor: string;
}> = {
  completed: { 
    icon: Trophy, 
    label: 'Objetivo Alcançado', 
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10'
  },
  paused: { 
    icon: Pause, 
    label: 'Pausado', 
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  },
  cancelled: { 
    icon: XCircle, 
    label: 'Encerrado', 
    color: 'text-muted-foreground',
    bgColor: 'bg-muted'
  },
};

// Icon map for habits
const iconMap: Record<string, typeof Trophy> = {
  trophy: Trophy,
  flame: Flame,
  check: CheckCircle2,
};

export function ArchivedHabitsSection({ 
  archivedHabits, 
  getArchivedHabitStats,
  onRestore,
  canRestore
}: ArchivedHabitsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);

  if (archivedHabits.length === 0) {
    return null;
  }

  const handleRestore = async (habitId: string) => {
    setIsRestoring(habitId);
    await onRestore(habitId);
    setIsRestoring(null);
  };

  return (
    <>
      {/* Collapsible Section */}
      <div className="space-y-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left group"
        >
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">
              Hábitos Arquivados
            </h2>
            <span className="text-sm text-muted-foreground">
              ({archivedHabits.length})
            </span>
          </div>
          <div className="text-muted-foreground group-hover:text-foreground transition-colors">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="grid gap-3 sm:grid-cols-2 animate-fade-in">
            {archivedHabits.map((habit) => {
              const stats = getArchivedHabitStats(habit);
              const status = habit.archiveStatus || 'cancelled';
              const config = statusConfig[status];
              const StatusIcon = config.icon;

              return (
                <div
                  key={habit.id}
                  className={cn(
                    "relative p-4 rounded-xl border cursor-pointer transition-all",
                    "bg-card/50 border-border/50 hover:bg-card hover:border-border"
                  )}
                  onClick={() => setSelectedHabit(habit)}
                >
                  {/* Status Badge */}
                  <div className={cn(
                    "absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                    config.bgColor, config.color
                  )}>
                    <StatusIcon className="h-3 w-3" />
                    <span className="hidden sm:inline">{config.label}</span>
                  </div>

                  {/* Habit Info */}
                  <div className="flex items-start gap-3">
                    <div 
                      className="h-10 w-10 rounded-xl flex items-center justify-center opacity-60"
                      style={{ backgroundColor: `${habit.color}20` }}
                    >
                      <Flame className="h-5 w-5" style={{ color: habit.color }} />
                    </div>
                    <div className="flex-1 min-w-0 pr-16">
                      <h3 className="font-medium text-foreground truncate">
                        {habit.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {stats.totalCompleted} dias completados
                      </p>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>{stats.completionRate}% taxa</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Flame className="h-3 w-3" />
                      <span>{stats.longestStreak} dias streak</span>
                    </div>
                  </div>

                  {/* Reason if exists */}
                  {habit.archiveReason && (
                    <p className="mt-2 text-xs text-muted-foreground italic truncate">
                      "{habit.archiveReason}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <ArchivedHabitDetailModal
        habit={selectedHabit}
        stats={selectedHabit ? getArchivedHabitStats(selectedHabit) : null}
        isOpen={!!selectedHabit}
        onClose={() => setSelectedHabit(null)}
        onRestore={handleRestore}
        canRestore={canRestore}
        isRestoring={isRestoring === selectedHabit?.id}
      />
    </>
  );
}

// Detail Modal Component
interface ArchivedHabitDetailModalProps {
  habit: Habit | null;
  stats: ArchivedHabitStats | null;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (habitId: string) => Promise<void>;
  canRestore: boolean;
  isRestoring: boolean;
}

function ArchivedHabitDetailModal({
  habit,
  stats,
  isOpen,
  onClose,
  onRestore,
  canRestore,
  isRestoring
}: ArchivedHabitDetailModalProps) {
  if (!habit || !stats) return null;

  const status = habit.archiveStatus || 'cancelled';
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div 
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${habit.color}20` }}
            >
              <Flame className="h-5 w-5" style={{ color: habit.color }} />
            </div>
            <div>
              <span className="block">{habit.title}</span>
              <span className={cn(
                "text-sm font-normal flex items-center gap-1",
                config.color
              )}>
                <StatusIcon className="h-3.5 w-3.5" />
                {config.label}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Period */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {format(stats.startDate, "dd MMM yyyy", { locale: ptBR })} — {format(stats.endDate, "dd MMM yyyy", { locale: ptBR })}
            </span>
            <span className="text-foreground font-medium">
              ({stats.activeDays} dias)
            </span>
          </div>

          {/* Reason */}
          {habit.archiveReason && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-sm italic">"{habit.archiveReason}"</p>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={CheckCircle2}
              label="Dias Completados"
              value={stats.totalCompleted}
              color="text-green-500"
            />
            <StatCard
              icon={TrendingUp}
              label="Taxa de Conclusão"
              value={`${stats.completionRate}%`}
              color="text-blue-500"
            />
            <StatCard
              icon={Flame}
              label="Maior Streak"
              value={`${stats.longestStreak} dias`}
              color="text-orange-500"
            />
            <StatCard
              icon={Calendar}
              label="Período Ativo"
              value={`${stats.activeDays} dias`}
              color="text-purple-500"
            />
          </div>

          {/* Completion Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso Geral</span>
              <span className="font-medium">{stats.completionRate}%</span>
            </div>
            <Progress value={stats.completionRate} className="h-2" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          {canRestore ? (
            <Button 
              onClick={() => onRestore(habit.id)}
              disabled={isRestoring}
            >
              {isRestoring ? (
                "Restaurando..."
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restaurar Hábito
                </>
              )}
            </Button>
          ) : (
            <Button disabled title="Limite de 5 hábitos ativos">
              <RotateCcw className="mr-2 h-4 w-4" />
              Limite Atingido
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Stat Card Component
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: typeof Trophy; 
  label: string; 
  value: string | number; 
  color: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn("h-4 w-4", color)} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className="text-lg font-bold text-foreground">{value}</span>
    </div>
  );
}
