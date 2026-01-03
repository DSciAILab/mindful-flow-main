import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ChevronLeft, 
  ChevronRight, 
  Target, 
  CheckCircle2,
  Circle,
  Plus,
  CalendarDays,
  Flower2,
  Sun,
  Leaf,
  Snowflake,
  Trash2,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnnualGoals, AnnualGoalInput } from "@/hooks/useAnnualGoals";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useHabits } from "@/hooks/useHabits";
import { LIFE_AREAS } from "@/lib/lifeAreas";

const quarters = [
  { id: 1, name: 'Q1', months: 'Jan - Mar', icon: Flower2, color: 'text-pink-500' },
  { id: 2, name: 'Q2', months: 'Abr - Jun', icon: Sun, color: 'text-yellow-500' },
  { id: 3, name: 'Q3', months: 'Jul - Set', icon: Leaf, color: 'text-orange-500' },
  { id: 4, name: 'Q4', months: 'Out - Dez', icon: Snowflake, color: 'text-blue-400' },
];

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function YearAtGlance() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<AnnualGoalInput>>({
    title: '',
    year: new Date().getFullYear(),
  });
  
  const { goals, loading, stats, addGoal, toggleComplete, deleteGoal } = useAnnualGoals(year);
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const { habits } = useHabits();

  const currentMonth = new Date().getMonth();
  const currentQuarter = Math.floor(currentMonth / 3) + 1;

  // Get tasks/habits count by area
  const getAreaStats = (areaId: string) => {
    const areaTasks = tasks.filter(t => {
      const project = projects.find(p => p.id === t.projectId);
      return project?.areaId === areaId;
    });
    const areaHabits = habits.filter(h => h.projectId && projects.find(p => p.id === h.projectId)?.areaId === areaId);
    return {
      tasks: areaTasks.length,
      habits: areaHabits.length,
    };
  };

  const handleCreateGoal = async () => {
    if (!newGoal.title?.trim()) return;
    
    await addGoal({
      title: newGoal.title.trim(),
      description: newGoal.description,
      year,
      quarter: newGoal.quarter,
      areaId: newGoal.areaId,
      projectId: newGoal.projectId,
    });
    
    setNewGoal({ title: '', year });
    setIsModalOpen(false);
  };

  const getAreaInfo = (areaId?: string) => {
    if (!areaId) return null;
    return LIFE_AREAS.find(a => a.id === areaId);
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-card">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
            <CalendarDays className="h-5 w-5 text-primary" />
            Visão Anual
          </h3>
          <p className="text-sm text-muted-foreground">Seus objetivos e marcos do ano</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={() => setYear(year - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-16 text-center font-display text-xl font-bold text-foreground">
            {year}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={() => setYear(year + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Year progress */}
      <div className="mb-6 rounded-xl bg-muted/30 p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progresso do Ano</span>
          <span className="font-semibold text-foreground">{stats.progress}% completo</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${stats.progress}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          {months.map((m, i) => (
            <span 
              key={m} 
              className={cn(
                "hidden sm:inline",
                i === currentMonth && year === new Date().getFullYear() && "font-bold text-primary"
              )}
            >
              {m.slice(0, 1)}
            </span>
          ))}
        </div>
      </div>

      {/* Quarters */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {quarters.map((q) => {
          const quarterStats = stats.byQuarter.find(qs => qs.quarter === q.id);
          const isCurrent = q.id === currentQuarter && year === new Date().getFullYear();
          const Icon = q.icon;

          return (
            <div
              key={q.id}
              className={cn(
                "rounded-xl border p-4 transition-all duration-200",
                isCurrent 
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                  : "border-border/50 bg-muted/20 hover:bg-muted/40"
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <Icon className={cn("h-6 w-6", q.color)} />
                {isCurrent && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    Atual
                  </span>
                )}
              </div>
              <h4 className="font-semibold text-foreground">{q.name}</h4>
              <p className="mb-2 text-xs text-muted-foreground">{q.months}</p>
              <div className="flex items-center gap-1 text-xs">
                <CheckCircle2 className="h-3 w-3 text-status-completed" />
                <span className="text-muted-foreground">
                  {quarterStats?.completed || 0}/{quarterStats?.total || 0} metas
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Goals list */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="flex items-center gap-2 font-semibold text-foreground">
            <Target className="h-4 w-4 text-primary" />
            Metas do Ano ({stats.total})
          </h4>
          <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Nova Meta
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : goals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/50 p-8 text-center">
            <Target className="mx-auto h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground">Nenhuma meta definida para {year}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Criar primeira meta
            </Button>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {goals.map((goal) => {
              const area = getAreaInfo(goal.areaId);
              const project = projects.find(p => p.id === goal.projectId);
              const isCompleted = goal.status === 'completed';

              return (
                <div
                  key={goal.id}
                  className={cn(
                    "group flex items-start gap-3 rounded-xl p-3 transition-all duration-200",
                    isCompleted 
                      ? "bg-status-completed/10" 
                      : "bg-muted/30 hover:bg-muted/50"
                  )}
                >
                  <button onClick={() => toggleComplete(goal.id)} className="mt-0.5">
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-status-completed" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium",
                      isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                    )}>
                      {goal.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      {goal.quarter && (
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                          Q{goal.quarter}
                        </span>
                      )}
                      {area && (
                        <span 
                          className="rounded-md px-1.5 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: `${area.color}20`, color: area.color }}
                        >
                          {area.icon} {area.name}
                        </span>
                      )}
                      {project && (
                        <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                          📁 {project.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteGoal(goal.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Goal Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Nova Meta Anual
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="goal-title">Título *</Label>
              <Input
                id="goal-title"
                value={newGoal.title || ''}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                placeholder="Ex: Correr uma maratona"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal-desc">Descrição</Label>
              <Textarea
                id="goal-desc"
                value={newGoal.description || ''}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                placeholder="Detalhes da meta (opcional)"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Trimestre</Label>
                <Select 
                  value={newGoal.quarter?.toString() || 'any'} 
                  onValueChange={(v) => setNewGoal({ ...newGoal, quarter: v === 'any' ? undefined : parseInt(v) as 1|2|3|4 })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Qualquer</SelectItem>
                    <SelectItem value="1">Q1 (Jan-Mar)</SelectItem>
                    <SelectItem value="2">Q2 (Abr-Jun)</SelectItem>
                    <SelectItem value="3">Q3 (Jul-Set)</SelectItem>
                    <SelectItem value="4">Q4 (Out-Dez)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Área da Vida</Label>
                <Select 
                  value={newGoal.areaId || 'none'} 
                  onValueChange={(v) => setNewGoal({ ...newGoal, areaId: v === 'none' ? undefined : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {LIFE_AREAS.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        <span style={{ color: area.color }}>{area.icon}</span> {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Vincular a Projeto</Label>
              <Select 
                value={newGoal.projectId || 'none'} 
                onValueChange={(v) => setNewGoal({ ...newGoal, projectId: v === 'none' ? undefined : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar projeto..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum projeto</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                        {p.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateGoal} disabled={!newGoal.title?.trim()}>
              Criar Meta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
