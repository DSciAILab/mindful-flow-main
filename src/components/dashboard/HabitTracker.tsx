import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Plus, Target, Flame, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useHabits } from "@/hooks/useHabits";
import { HabitCard } from "@/components/habits/HabitCard";
import { HabitContributionGraph } from "@/components/habits/HabitContributionGraph";
import { HabitStats } from "@/components/habits/HabitStats";
import { HabitFormModal } from "@/components/habits/HabitFormModal";
import type { Habit } from "@/types";

export function HabitTracker() {
  const { 
    habits,
    habitsWithStats, 
    loading, 
    toggleHabit, 
    addHabit, 
    updateHabit,
    deleteHabit,
    getHabitStats,
    canAddHabit,
    remainingHabits,
    MAX_HABITS
  } = useHabits();
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);

  // Get stats
  const stats = useMemo(() => getHabitStats(), [getHabitStats]);

  // Handle toggle for today
  const handleToggle = async (habitId: string) => {
    await toggleHabit(habitId, new Date());
  };

  // Handle edit
  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsFormModalOpen(true);
  };

  // Handle delete
  const handleDelete = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (habit && confirm(`Arquivar "${habit.title}"? O histórico será preservado.`)) {
      await deleteHabit(habitId);
    }
  };

  // Handle save (create or update)
  const handleSave = async (habitData: Partial<Habit>) => {
    if (editingHabit) {
      // Update existing habit
      const success = await updateHabit(editingHabit.id, habitData);
      if (success) {
        setEditingHabit(undefined);
        // Return a mock habit to signal success (the actual update is in state)
        return editingHabit;
      }
      return null;
    } else {
      // Create new habit
      return await addHabit(habitData);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsFormModalOpen(false);
    setEditingHabit(undefined);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-24 bg-muted rounded-2xl" />
          <div className="h-24 bg-muted rounded-2xl" />
        </div>
        <div className="h-32 bg-muted rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <Flame className="h-8 w-8 text-primary" />
            Meus Hábitos
          </h1>
          <p className="text-muted-foreground mt-1">
            Construa consistência dia após dia
          </p>
        </div>
        <Button onClick={() => setIsFormModalOpen(true)} disabled={!canAddHabit}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Hábito
        </Button>
      </div>

      {/* TDAH-friendly limit info */}
      {habits.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>
            {habits.filter(h => h.isActive).length}/{MAX_HABITS} hábitos ativos
            {remainingHabits > 0 && remainingHabits <= 2 && (
              <span className="text-amber-500 ml-1">
                (você pode adicionar mais {remainingHabits})
              </span>
            )}
            {!canAddHabit && (
              <span className="text-amber-500 ml-1">
                — Foco é poder! 🎯
              </span>
            )}
          </span>
        </div>
      )}

      {/* Empty state */}
      {habitsWithStats.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/50 bg-card/50 p-12 text-center">
          <Target className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhum hábito cadastrado
          </h3>
          <p className="text-muted-foreground mb-4">
            Comece criando seu primeiro hábito para acompanhar seu progresso.
          </p>
          <Button onClick={() => setIsFormModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Primeiro Hábito
          </Button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <HabitStats stats={stats} />

          {/* Habit Cards */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Hábitos de Hoje
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {habitsWithStats.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>

          {/* Contribution Graph */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Histórico de Contribuições
            </h2>
            <HabitContributionGraph habits={habits} period="90days" />
          </div>
        </>
      )}

      {/* Form Modal */}
      <HabitFormModal
        isOpen={isFormModalOpen}
        onClose={handleModalClose}
        onSave={handleSave}
        habit={editingHabit}
        canAddHabit={canAddHabit}
        remainingHabits={remainingHabits}
      />
    </div>
  );
}
