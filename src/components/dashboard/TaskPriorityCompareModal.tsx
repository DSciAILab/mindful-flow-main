import { useState, useCallback, useMemo } from "react";
import { X, ChevronLeft, ChevronRight, Trophy, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";
import { Button } from "@/components/ui/button";

interface TaskPriorityCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onComplete: (sortedTaskIds: string[]) => void;
}

interface ComparisonPair {
  left: Task;
  right: Task;
}

// Tournament-based comparison sort
function useTournamentSort(tasks: Task[]) {
  const [comparisons, setComparisons] = useState<Map<string, Set<string>>>(new Map());
  const [currentPair, setCurrentPair] = useState<ComparisonPair | null>(null);
  const [pendingPairs, setPendingPairs] = useState<ComparisonPair[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Initialize tournament
  const initialize = useCallback(() => {
    if (tasks.length < 2) {
      setIsComplete(true);
      return;
    }

    const pairs: ComparisonPair[] = [];
    // Create initial pairs for all tasks that need comparison
    for (let i = 0; i < tasks.length; i++) {
      for (let j = i + 1; j < tasks.length; j++) {
        pairs.push({ left: tasks[i], right: tasks[j] });
      }
    }
    
    // Shuffle pairs for variety
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }

    setPendingPairs(pairs.slice(1));
    setCurrentPair(pairs[0] || null);
    setComparisons(new Map());
    setCompletedCount(0);
    setIsComplete(false);
  }, [tasks]);

  // Record a comparison result (left wins means left > right in priority)
  const recordComparison = useCallback((winnerId: string, loserId: string) => {
    setComparisons(prev => {
      const newMap = new Map(prev);
      if (!newMap.has(winnerId)) {
        newMap.set(winnerId, new Set());
      }
      newMap.get(winnerId)!.add(loserId);
      return newMap;
    });

    setCompletedCount(prev => prev + 1);

    // Move to next pair
    if (pendingPairs.length > 0) {
      setCurrentPair(pendingPairs[0]);
      setPendingPairs(prev => prev.slice(1));
    } else {
      setCurrentPair(null);
      setIsComplete(true);
    }
  }, [pendingPairs]);

  // Get sorted task IDs based on comparisons
  const getSortedIds = useCallback((): string[] => {
    // Count wins for each task
    const winCounts = new Map<string, number>();
    tasks.forEach(t => winCounts.set(t.id, 0));
    
    comparisons.forEach((losers, winnerId) => {
      winCounts.set(winnerId, (winCounts.get(winnerId) || 0) + losers.size);
    });

    // Sort by win count (descending)
    return tasks
      .map(t => ({ id: t.id, wins: winCounts.get(t.id) || 0 }))
      .sort((a, b) => b.wins - a.wins)
      .map(t => t.id);
  }, [tasks, comparisons]);

  const totalPairs = useMemo(() => {
    const n = tasks.length;
    return (n * (n - 1)) / 2;
  }, [tasks.length]);

  return {
    currentPair,
    completedCount,
    totalPairs,
    isComplete,
    initialize,
    recordComparison,
    getSortedIds,
  };
}

export function TaskPriorityCompareModal({ 
  isOpen, 
  onClose, 
  tasks,
  onComplete 
}: TaskPriorityCompareModalProps) {
  const {
    currentPair,
    completedCount,
    totalPairs,
    isComplete,
    initialize,
    recordComparison,
    getSortedIds,
  } = useTournamentSort(tasks);

  const [hasStarted, setHasStarted] = useState(false);

  const handleStart = useCallback(() => {
    initialize();
    setHasStarted(true);
  }, [initialize]);

  const handleChoice = useCallback((winnerId: string, loserId: string) => {
    recordComparison(winnerId, loserId);
  }, [recordComparison]);

  const handleComplete = useCallback(() => {
    const sortedIds = getSortedIds();
    onComplete(sortedIds);
    setHasStarted(false);
    onClose();
  }, [getSortedIds, onComplete, onClose]);

  const handleClose = useCallback(() => {
    setHasStarted(false);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const progress = totalPairs > 0 ? (completedCount / totalPairs) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl mx-4 rounded-2xl border border-border bg-card p-6 shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">
                Priorizar Tarefas
              </h2>
              <p className="text-sm text-muted-foreground">
                Compare e ordene suas tarefas por importância
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {!hasStarted ? (
          /* Start Screen */
          <div className="text-center py-12">
            <Scale className="h-16 w-16 mx-auto text-primary/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Pronto para priorizar?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Você verá 2 tarefas por vez. Escolha qual é mais importante para você.
              Ao final, suas tarefas estarão ordenadas por prioridade.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {tasks.length} tarefas · ~{totalPairs} comparações
            </p>
            <Button onClick={handleStart} size="lg" className="px-8">
              Começar Priorização
            </Button>
          </div>
        ) : isComplete ? (
          /* Complete Screen */
          <div className="text-center py-12">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 mx-auto mb-4 shadow-lg">
              <Trophy className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Priorização Completa!
            </h3>
            <p className="text-muted-foreground mb-6">
              Suas tarefas foram ordenadas com base nas suas escolhas.
            </p>
            <Button onClick={handleComplete} size="lg" className="px-8">
              Aplicar Ordenação
            </Button>
          </div>
        ) : currentPair ? (
          /* Comparison Screen */
          <div>
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Comparação {completedCount + 1} de {totalPairs}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <p className="text-center text-lg font-medium mb-6">
              Qual tarefa é mais importante para você?
            </p>

            {/* Comparison Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Left Card */}
              <button
                onClick={() => handleChoice(currentPair.left.id, currentPair.right.id)}
                className={cn(
                  "group relative p-6 rounded-xl border-2 border-border bg-gradient-to-br from-muted/50 to-transparent transition-all hover:border-primary hover:shadow-lg hover:scale-[1.02] text-left"
                )}
              >
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronLeft className="h-6 w-6 text-primary" />
                </div>
                <div className="mb-3">
                  <span className={cn(
                    "inline-block px-2 py-0.5 rounded text-xs font-medium",
                    currentPair.left.priority === 'urgent' && "bg-red-500/20 text-red-500",
                    currentPair.left.priority === 'high' && "bg-orange-500/20 text-orange-500",
                    currentPair.left.priority === 'medium' && "bg-yellow-500/20 text-yellow-500",
                    currentPair.left.priority === 'low' && "bg-green-500/20 text-green-500",
                  )}>
                    {currentPair.left.priority}
                  </span>
                </div>
                <h4 className="font-semibold text-foreground mb-2 line-clamp-2">
                  {currentPair.left.title}
                </h4>
                {currentPair.left.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {currentPair.left.description}
                  </p>
                )}
                {currentPair.left.estimatedMinutes && (
                  <p className="text-xs text-muted-foreground mt-2">
                    ⏱️ {currentPair.left.estimatedMinutes} min
                  </p>
                )}
              </button>

              {/* Right Card */}
              <button
                onClick={() => handleChoice(currentPair.right.id, currentPair.left.id)}
                className={cn(
                  "group relative p-6 rounded-xl border-2 border-border bg-gradient-to-br from-muted/50 to-transparent transition-all hover:border-primary hover:shadow-lg hover:scale-[1.02] text-left"
                )}
              >
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="h-6 w-6 text-primary" />
                </div>
                <div className="mb-3">
                  <span className={cn(
                    "inline-block px-2 py-0.5 rounded text-xs font-medium",
                    currentPair.right.priority === 'urgent' && "bg-red-500/20 text-red-500",
                    currentPair.right.priority === 'high' && "bg-orange-500/20 text-orange-500",
                    currentPair.right.priority === 'medium' && "bg-yellow-500/20 text-yellow-500",
                    currentPair.right.priority === 'low' && "bg-green-500/20 text-green-500",
                  )}>
                    {currentPair.right.priority}
                  </span>
                </div>
                <h4 className="font-semibold text-foreground mb-2 line-clamp-2">
                  {currentPair.right.title}
                </h4>
                {currentPair.right.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {currentPair.right.description}
                  </p>
                )}
                {currentPair.right.estimatedMinutes && (
                  <p className="text-xs text-muted-foreground mt-2">
                    ⏱️ {currentPair.right.estimatedMinutes} min
                  </p>
                )}
              </button>
            </div>

            {/* Skip button */}
            <div className="text-center">
              <button
                onClick={handleClose}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar e fechar
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
