import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Droplets,
  Eye,
  PersonStanding,
  Wind,
  Footprints,
} from 'lucide-react';
import type { ReminderType, WellnessLog } from '@/types/wellness';
import { REMINDER_MESSAGES } from '@/types/wellness';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WellnessQuickActionsProps {
  todayLogs: WellnessLog[];
  onLogAction: (type: ReminderType) => void;
  compact?: boolean;
}

const actionConfig: { type: ReminderType; icon: React.ElementType; label: string }[] = [
  { type: 'water', icon: Droplets, label: 'Água' },
  { type: 'stretch', icon: PersonStanding, label: 'Alongar' },
  { type: 'eyes', icon: Eye, label: 'Olhos' },
  { type: 'posture', icon: PersonStanding, label: 'Postura' },
];

export function WellnessQuickActions({
  todayLogs,
  onLogAction,
  compact = false,
}: WellnessQuickActionsProps) {
  // Get counts and last action times
  const stats = useMemo(() => {
    const result: Record<ReminderType, { count: number; lastTime: Date | null }> = {} as any;

    for (const action of actionConfig) {
      const logs = todayLogs.filter(
        (log) => log.reminderType === action.type && log.action === 'completed'
      );
      result[action.type] = {
        count: logs.length,
        lastTime: logs.length > 0 ? logs[0].loggedAt : null,
      };
    }

    return result;
  }, [todayLogs]);

  return (
    <TooltipProvider>
      <div
        className={cn(
          'flex items-center gap-2 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-2',
          compact ? 'flex-wrap justify-center' : 'justify-between'
        )}
      >
        {actionConfig.map((action) => {
          const Icon = action.icon;
          const reminder = REMINDER_MESSAGES[action.type];
          const stat = stats[action.type];

          return (
            <Tooltip key={action.type}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size={compact ? 'icon' : 'sm'}
                  onClick={() => onLogAction(action.type)}
                  className={cn(
                    'relative group transition-all hover:scale-105',
                    !compact && 'gap-2'
                  )}
                  style={
                    {
                      '--action-color': reminder.color,
                    } as React.CSSProperties
                  }
                >
                  <div
                    className="flex items-center justify-center rounded-lg p-1.5 transition-colors group-hover:bg-[var(--action-color)]/20"
                  >
                    <Icon
                      className="h-4 w-4 transition-colors group-hover:text-[var(--action-color)]"
                      style={{ color: stat.count > 0 ? reminder.color : undefined }}
                    />
                  </div>
                  
                  {!compact && (
                    <span className="text-xs font-medium">{action.label}</span>
                  )}

                  {/* Count badge */}
                  {stat.count > 0 && (
                    <span
                      className={cn(
                        'absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center',
                        'rounded-full text-[10px] font-bold text-white',
                        compact ? '-top-0.5 -right-0.5 h-3.5 w-3.5 text-[9px]' : ''
                      )}
                      style={{ backgroundColor: reminder.color }}
                    >
                      {stat.count}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="font-medium">{reminder.title}</p>
                <p className="text-xs text-muted-foreground">
                  {stat.count > 0 ? (
                    <>
                      {stat.count}x hoje • Último:{' '}
                      {stat.lastTime
                        ? formatDistanceToNow(stat.lastTime, {
                            addSuffix: true,
                            locale: ptBR,
                          })
                        : '-'}
                    </>
                  ) : (
                    'Nenhum registro hoje'
                  )}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
