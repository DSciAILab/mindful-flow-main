import { Card, CardContent } from "@/components/ui/card";
import { CheckSquare, CheckCircle2, Trophy } from "lucide-react";

interface TaskStatsProps {
  stats: {
    pending: number;
    completedToday: number;
    totalCompleted: number;
  };
}

export function TaskStats({ stats }: TaskStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3 mb-6 animate-fade-in">
      {/* Pending Tasks */}
      <Card className="border-border/50 bg-gradient-to-br from-orange-500/10 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-500/20 p-2.5 text-orange-500">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Pendentes
              </p>
              <p className="text-2xl font-bold">
                {stats.pending}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completed Today */}
      <Card className="border-border/50 bg-gradient-to-br from-green-500/10 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-500/20 p-2.5 text-green-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Concluídas Hoje
              </p>
              <p className="text-2xl font-bold">
                {stats.completedToday}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Completed (or another metric) */}
      <Card className="border-border/50 bg-gradient-to-br from-blue-500/10 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/20 p-2.5 text-blue-500">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Concluído
              </p>
              <p className="text-2xl font-bold">
                {stats.totalCompleted}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
