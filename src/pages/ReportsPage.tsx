import { BarChart3 } from "lucide-react";
import { TimerDashboard } from "@/components/dashboard/TimerDashboard";

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="mb-2 flex items-center gap-3 font-display text-2xl font-semibold text-foreground md:text-3xl">
          <BarChart3 className="h-8 w-8 text-primary" />
          Estatísticas de Foco
        </h1>
        <p className="text-muted-foreground">
          Acompanhe seu progresso e produtividade
        </p>
      </div>
      <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
        <TimerDashboard />
      </div>
    </div>
  );
}
