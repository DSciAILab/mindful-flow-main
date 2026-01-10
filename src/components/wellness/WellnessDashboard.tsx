import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Droplets,
  Eye,
  PersonStanding,
  TrendingUp,
  Award,
  Lightbulb,
} from 'lucide-react';
import type { WellnessLog, ReminderType } from '@/types/wellness';
import { REMINDER_MESSAGES } from '@/types/wellness';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WellnessDashboardProps {
  todayLogs: WellnessLog[];
  getWeekLogs: () => Promise<WellnessLog[]>;
}

const healthTips = [
  '💡 Manter-se hidratado melhora a concentração em até 25%.',
  '💡 Alongar regularmente reduz tensão muscular e dores nas costas.',
  '💡 A regra 20-20-20 previne fadiga ocular digital.',
  '💡 Uma boa postura aumenta a energia e reduz o cansaço.',
  '💡 Pausas curtas frequentes são mais eficazes que pausas longas raras.',
  '💡 Caminhar 5 minutos a cada hora melhora a circulação.',
];

const iconMap: Record<ReminderType, React.ElementType> = {
  water: Droplets,
  stretch: PersonStanding,
  eyes: Eye,
  posture: PersonStanding,
  breathe: PersonStanding,
  walk: PersonStanding,
};

export function WellnessDashboard({ todayLogs, getWeekLogs }: WellnessDashboardProps) {
  const [weekLogs, setWeekLogs] = useState<WellnessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTip, setCurrentTip] = useState(0);

  // Fetch week logs
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const logs = await getWeekLogs();
      setWeekLogs(logs);
      setLoading(false);
    };
    fetchLogs();
  }, [getWeekLogs]);

  // Rotate health tips
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % healthTips.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Calculate today's stats
  const todayStats = useMemo(() => {
    const stats: Record<ReminderType, number> = {
      water: 0,
      stretch: 0,
      eyes: 0,
      posture: 0,
      breathe: 0,
      walk: 0,
    };

    todayLogs
      .filter((log) => log.action === 'completed')
      .forEach((log) => {
        stats[log.reminderType]++;
      });

    return stats;
  }, [todayLogs]);

  // Calculate week data for chart
  const weekData = useMemo(() => {
    const days: { date: Date; count: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const count = weekLogs.filter(
        (log) =>
          log.action === 'completed' && isSameDay(new Date(log.loggedAt), dayStart)
      ).length;
      days.push({ date, count });
    }

    return days;
  }, [weekLogs]);

  // Calculate streak
  const streak = useMemo(() => {
    let currentStreak = 0;

    for (let i = 0; i < 30; i++) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const hasActivity = weekLogs.some(
        (log) =>
          log.action === 'completed' && isSameDay(new Date(log.loggedAt), dayStart)
      );

      if (hasActivity) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }

    return currentStreak;
  }, [weekLogs]);

  const maxCount = Math.max(...weekData.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Today's Summary */}
      <div className="rounded-2xl border border-border/50 bg-card p-4">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Resumo de Hoje
        </h3>

        <div className="grid grid-cols-4 gap-3">
          {(['water', 'stretch', 'eyes', 'posture'] as ReminderType[]).map((type) => {
            const Icon = iconMap[type];
            const reminder = REMINDER_MESSAGES[type];
            const count = todayStats[type];

            return (
              <div
                key={type}
                className="flex flex-col items-center gap-2 rounded-lg bg-muted/50 p-3"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${reminder.color}20` }}
                >
                  <Icon className="h-5 w-5" style={{ color: reminder.color }} />
                </div>
                <span className="text-2xl font-bold">{count}</span>
                <span className="text-xs text-muted-foreground text-center">
                  {reminder.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Week Chart */}
      <div className="rounded-2xl border border-border/50 bg-card p-4">
        <h3 className="font-semibold text-foreground mb-4">Últimos 7 Dias</h3>

        {loading ? (
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            Carregando...
          </div>
        ) : (
          <div className="flex items-end justify-between gap-2 h-32">
            {weekData.map((day, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <div
                  className={cn(
                    'w-full rounded-t-md transition-all',
                    day.count > 0 ? 'bg-primary' : 'bg-muted'
                  )}
                  style={{
                    height: `${Math.max((day.count / maxCount) * 100, 8)}%`,
                    minHeight: '8px',
                  }}
                />
                <span className="text-xs text-muted-foreground">
                  {format(day.date, 'EEE', { locale: ptBR })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Streak & Achievements */}
      <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/20">
            <Award className="h-7 w-7 text-amber-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Sequência atual</p>
            <p className="text-2xl font-bold text-foreground">
              {streak} {streak === 1 ? 'dia' : 'dias'}
            </p>
            {streak >= 7 && (
              <p className="text-xs text-amber-600 font-medium">
                🔥 Você está em chamas! Continue assim!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Health Tip */}
      <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground animate-in fade-in duration-500">
            {healthTips[currentTip]}
          </p>
        </div>
      </div>
    </div>
  );
}
