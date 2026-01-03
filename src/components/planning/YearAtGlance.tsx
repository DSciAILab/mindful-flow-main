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
  Loader2,
  Pencil,
  FolderKanban
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useAnnualGoals, AnnualGoalInput, AnnualGoal } from "@/hooks/useAnnualGoals";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useHabits } from "@/hooks/useHabits";
import { LIFE_AREAS } from "@/lib/lifeAreas";
import { QuarterCard } from "./QuarterCard";


const quarters = [
  { id: 1, name: 'Q1', months: 'Jan - Mar', icon: Flower2, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
  { id: 2, name: 'Q2', months: 'Abr - Jun', icon: Sun, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  { id: 3, name: 'Q3', months: 'Jul - Set', icon: Leaf, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  { id: 4, name: 'Q4', months: 'Out - Dez', icon: Snowflake, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
];

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function YearAtGlance() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<AnnualGoal | null>(null);
  const [newGoal, setNewGoal] = useState<Partial<AnnualGoalInput>>({
    title: '',
    year: new Date().getFullYear(),
  });
  
  const { goals, loading, stats, addGoal, updateGoal, toggleComplete, deleteGoal } = useAnnualGoals(year);
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

  const handleSaveGoal = async () => {
    if (!newGoal.title?.trim()) return;
    
    if (editingGoal) {
      // Update existing goal
      await updateGoal(editingGoal.id, {
        title: newGoal.title.trim(),
        description: newGoal.description,
        quarter: newGoal.quarter,
        areaId: newGoal.areaId,
      });
    } else {
      // Create new goal
      await addGoal({
        title: newGoal.title.trim(),
        description: newGoal.description,
        year,
        quarter: newGoal.quarter,
        areaId: newGoal.areaId,
      });
    }
    
    setNewGoal({ title: '', year });
    setEditingGoal(null);
    setIsModalOpen(false);
  };

  const handleCloseModal = () => {
    setNewGoal({ title: '', year });
    setEditingGoal(null);
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

      {/* Quarter Cards List */}
      <div className="space-y-4 mb-6">
        {quarters.map((q) => (
          <QuarterCard
            key={q.id}
            id={q.id}
            title={q.name}
            subtitle={q.months}
            icon={q.icon}
            color={q.color}
            bgColor={q.bgColor}
            goals={goals.filter(g => g.quarter === q.id)}
            projects={projects}
            isCurrent={q.id === currentQuarter && year === new Date().getFullYear()}
            onAddGoal={() => {
              setNewGoal({ title: '', year, quarter: q.id as 1 | 2 | 3 | 4 });
              setEditingGoal(null);
              setIsModalOpen(true);
            }}
            onEditGoal={(goal) => {
              setEditingGoal(goal);
              setNewGoal({
                title: goal.title,
                description: goal.description,
                quarter: goal.quarter,
                areaId: goal.areaId,
              });
              setIsModalOpen(true);
            }}
            onDeleteGoal={deleteGoal}
            onToggleComplete={toggleComplete}
          />
        ))}

        {/* General / Other Goals */}
        {goals.some(g => !g.quarter) && (
          <QuarterCard
            id="general"
            title="Geral / Anual"
            subtitle="Metas sem trimestre definido"
            icon={Target}
            color="text-gray-500"
            bgColor="bg-gray-500/10"
            goals={goals.filter(g => !g.quarter)}
            projects={projects}
            isCurrent={false}
            onAddGoal={() => {
              setNewGoal({ title: '', year, quarter: undefined });
              setEditingGoal(null);
              setIsModalOpen(true);
            }}
            onEditGoal={(goal) => {
              setEditingGoal(goal);
              setNewGoal({
                title: goal.title,
                description: goal.description,
                quarter: goal.quarter,
                areaId: goal.areaId,
              });
              setIsModalOpen(true);
            }}
            onDeleteGoal={deleteGoal}
            onToggleComplete={toggleComplete}
          />
        )}
      </div>

      {/* Create/Edit Goal Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {editingGoal ? 'Editar Meta' : 'Nova Meta Anual'}
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
                    {LIFE_AREAS.map((area) => {
                      const Icon = area.icon;
                      return (
                        <SelectItem key={area.id} value={area.id}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" style={{ color: area.color }} />
                            <span>{area.name}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button onClick={handleSaveGoal} disabled={!newGoal.title?.trim()}>
              {editingGoal ? 'Salvar' : 'Criar Meta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
