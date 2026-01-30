import { Card, CardContent } from "@/components/ui/card";
import { Inbox, CheckCircle2, Clock } from "lucide-react";

interface InboxStatsProps {
  stats: {
    waiting: number;
    capturedToday: number;
    processedToday: number;
  };
}

export function InboxStats({ stats }: InboxStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3 mb-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
      {/* Waiting Items */}
      <Card className="border-border/50 bg-gradient-to-br from-orange-500/10 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-500/20 p-2.5 text-orange-500">
              <Inbox className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Aguardando
              </p>
              <p className="text-2xl font-bold">
                {stats.waiting}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Captured Today */}
      <Card className="border-border/50 bg-gradient-to-br from-blue-500/10 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/20 p-2.5 text-blue-500">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Capturados Hoje
              </p>
              <p className="text-2xl font-bold">
                {stats.capturedToday}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processed Today */}
      <Card className="border-border/50 bg-gradient-to-br from-green-500/10 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-500/20 p-2.5 text-green-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Processados Hoje
              </p>
              <p className="text-2xl font-bold">
                {stats.processedToday}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
