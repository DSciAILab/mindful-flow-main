"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ParsedTask } from "@/utils/taskParser";
import { Clock, Zap, PauseCircle, Copy, XCircle } from "lucide-react"; // NEW: Import XCircle
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CompletedTabProps {
  tasksCompleted: ParsedTask[];
  completedTasksStats: Record<string, { totalTime: number; interruptions: number; totalBreakTime: number }>;
  onDuplicate: (task: ParsedTask) => void;
}

const CompletedTab = ({ tasksCompleted, completedTasksStats, onDuplicate }: CompletedTabProps) => {
  return (
    <div className="mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          {tasksCompleted.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma tarefa realizada ou cancelada.</p>
          ) : (
            <ul className="space-y-2">
              {tasksCompleted.map((item) => {
                const stats = completedTasksStats[item.id];
                const totalMinutes = stats ? Math.round(stats.totalTime / 60) : 0;
                const interruptionCount = stats ? stats.interruptions : 0;
                const totalBreakMinutes = stats ? Math.round(stats.totalBreakTime / 60) : 0;
                const completionDate = item.updated_at ? format(parseISO(item.updated_at), "dd/MM/yyyy", { locale: ptBR }) : "Data desconhecida";
                const isCancelled = item.status === 'cancelled';

                return (
                  <li key={item.id} className={cn(
                    "flex items-center justify-between p-2 border rounded-md",
                    "opacity-70 transition-opacity duration-500 ease-in-out",
                    isCancelled 
                      ? "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200" 
                      : "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                  )}>
                    <div className="flex items-center gap-2 flex-wrap">
                      {isCancelled && <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />}
                      <span className={cn("font-medium", !isCancelled && "line-through")}>{item.title}</span>
                      <span className="text-xs opacity-80 ml-2">({completionDate})</span>
                      {isCancelled && <span className="text-xs uppercase font-bold border px-1 rounded border-red-300 dark:border-red-700">Cancelada</span>}
                      
                      {item.project && <span className="text-xs opacity-80 ml-2">@{item.project}</span>}
                      
                      {/* Stats - Show for both completed and cancelled */}
                      {totalMinutes > 0 && (
                        <div className="flex items-center gap-1 text-xs opacity-80" title={`Tempo total: ${totalMinutes} minutos`}>
                          <Clock className="h-3 w-3" />
                          <span>{totalMinutes}m</span>
                        </div>
                      )}
                      {interruptionCount > 0 && (
                        <div className="flex items-center gap-1 text-xs opacity-80" title={`Interrupções: ${interruptionCount}`}>
                          <Zap className="h-3 w-3" />
                          <span>{interruptionCount}</span>
                        </div>
                      )}
                      {totalBreakMinutes > 0 && (
                        <div className="flex items-center gap-1 text-xs opacity-80" title={`Tempo de Pausa: ${totalBreakMinutes} minutos`}>
                          <PauseCircle className="h-3 w-3" />
                          <span>{totalBreakMinutes}m</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs ml-4 flex-shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => onDuplicate(item)} className={cn(isCancelled ? "text-red-800 dark:text-red-200" : "text-green-700 dark:text-green-300")}>
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Duplicar tarefa</span>
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompletedTab;