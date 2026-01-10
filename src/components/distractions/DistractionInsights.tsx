import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  Lightbulb, 
  TrendingDown, 
  TrendingUp, 
  Clock, 
  BarChart3 
} from 'lucide-react';
import type { Distraction } from '@/types/distractions';

interface DistractionInsightsProps {
  distractions: Distraction[];
}

export function DistractionInsights({ distractions }: DistractionInsightsProps) {
  const insights = useMemo(() => {
    if (distractions.length === 0) {
      return {
        total: 0,
        avgPerSession: 0,
        processedRate: 0,
        convertedToTaskRate: 0,
        peakHour: null,
        trend: 'stable' as const,
      };
    }

    // Group by session
    const sessionGroups = new Map<string, number>();
    distractions.forEach(d => {
      if (d.focusSessionId) {
        sessionGroups.set(
          d.focusSessionId,
          (sessionGroups.get(d.focusSessionId) || 0) + 1
        );
      }
    });

    const sessionCounts = Array.from(sessionGroups.values());
    const avgPerSession = sessionCounts.length > 0
      ? sessionCounts.reduce((a, b) => a + b, 0) / sessionCounts.length
      : 0;

    // Calculate rates
    const processed = distractions.filter(d => d.processed).length;
    const convertedToTask = distractions.filter(d => d.convertedToTaskId).length;
    const processedRate = (processed / distractions.length) * 100;
    const convertedToTaskRate = processed > 0 
      ? (convertedToTask / processed) * 100 
      : 0;

    // Peak hour
    const hourCounts = new Map<number, number>();
    distractions.forEach(d => {
      const hour = d.createdAt.getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });
    
    let peakHour: number | null = null;
    let maxCount = 0;
    hourCounts.forEach((count, hour) => {
      if (count > maxCount) {
        maxCount = count;
        peakHour = hour;
      }
    });

    // Trend (last 7 days vs previous 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const lastWeek = distractions.filter(d => d.createdAt >= sevenDaysAgo).length;
    const prevWeek = distractions.filter(
      d => d.createdAt >= fourteenDaysAgo && d.createdAt < sevenDaysAgo
    ).length;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (prevWeek > 0) {
      const change = ((lastWeek - prevWeek) / prevWeek) * 100;
      if (change > 20) trend = 'up';
      else if (change < -20) trend = 'down';
    }

    return {
      total: distractions.length,
      avgPerSession: Math.round(avgPerSession * 10) / 10,
      processedRate: Math.round(processedRate),
      convertedToTaskRate: Math.round(convertedToTaskRate),
      peakHour,
      trend,
    };
  }, [distractions]);

  const formatHour = (hour: number | null) => {
    if (hour === null) return '-';
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-amber-500" />
          Insights de Distrações
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total distractions */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Lightbulb className="h-3 w-3" />
              Total Capturado
            </div>
            <p className="text-2xl font-bold">{insights.total}</p>
          </div>

          {/* Average per session */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <BarChart3 className="h-3 w-3" />
              Média/Sessão
            </div>
            <p className="text-2xl font-bold">{insights.avgPerSession}</p>
          </div>

          {/* Peak hour */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Clock className="h-3 w-3" />
              Horário Pico
            </div>
            <p className="text-2xl font-bold">{formatHour(insights.peakHour)}</p>
          </div>

          {/* Trend */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              {insights.trend === 'up' ? (
                <TrendingUp className="h-3 w-3 text-amber-500" />
              ) : insights.trend === 'down' ? (
                <TrendingDown className="h-3 w-3 text-green-500" />
              ) : (
                <BarChart3 className="h-3 w-3" />
              )}
              Tendência
            </div>
            <p className={cn(
              "text-2xl font-bold",
              insights.trend === 'up' && "text-amber-500",
              insights.trend === 'down' && "text-green-500"
            )}>
              {insights.trend === 'up' && '↑'}
              {insights.trend === 'down' && '↓'}
              {insights.trend === 'stable' && '—'}
            </p>
          </div>
        </div>

        {/* Progress bars */}
        <div className="mt-4 space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Processadas</span>
              <span className="font-medium">{insights.processedRate}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${insights.processedRate}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Convertidas em Tarefas</span>
              <span className="font-medium">{insights.convertedToTaskRate}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${insights.convertedToTaskRate}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
