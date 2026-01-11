import { useState, useMemo } from "react";
import { format, isToday, isSameDay, subDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Target, Flame, Info, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useHabits } from "@/hooks/useHabits";
import { HabitCard } from "@/components/habits/HabitCard";
import { HabitContributionGraph } from "@/components/habits/HabitContributionGraph";
import { HabitStats } from "@/components/habits/HabitStats";
import { HabitFormModal } from "@/components/habits/HabitFormModal";
import { ArchiveHabitModal } from "@/components/habits/ArchiveHabitModal";
import { ArchivedHabitsSection } from "@/components/habits/ArchivedHabitsSection";
import type { Habit, HabitArchiveStatus } from "@/types";

export function HabitTracker() {
  const { 
    habits,
    archivedHabits,
    loading, 
    toggleHabit, 
    addHabit, 
    updateHabit,
    deleteHabit,
    archiveHabit,
    restoreHabit,
    getHabitStats,
    getArchivedHabitStats,
    getHabitsForDate,
    canAddHabit,
    remainingHabits,
    MAX_HABITS
  } = useHabits();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);
  const [archivingHabit, setArchivingHabit] = useState<Habit | null>(null);

  // Get habits for the selected date
  const visibleHabits = useMemo(() => {
    return getHabitsForDate(selectedDate);
  }, [getHabitsForDate, selectedDate]);

  // Get stats (always for today/overall context)
  const stats = useMemo(() => getHabitStats(), [getHabitStats]);

  // Handle toggle for selected date
  const handleToggle = async (habitId: string) => {
    await toggleHabit(habitId, selectedDate);
  };

  // Date navigation
  const navigateDay = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1));
  };

  const resetToToday = () => {
    setSelectedDate(new Date());
  };

  // Handle edit
  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsFormModalOpen(true);
  };

  // Handle archive (opens modal instead of direct delete)
  const handleArchive = (habit: Habit) => {
    setArchivingHabit(habit);
  };

  // Handle archive confirm
  const handleArchiveConfirm = async (
    habitId: string, 
    status: HabitArchiveStatus, 
    reason?: string
  ) => {
    return await archiveHabit(habitId, status, reason);
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

  const isSelectedToday = isToday(selectedDate);

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

      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-muted/20 p-2 rounded-xl border border-border/40">
        <Button variant="ghost" size="icon" onClick={() => navigateDay('prev')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm md:text-base capitalize">
            {isSelectedToday ? "Hoje," : ""} {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
          </span>
          {!isSelectedToday && (
            <Button variant="ghost" size="sm" onClick={resetToToday} className="h-6 text-xs px-2 ml-2 bg-primary/10 text-primary hover:bg-primary/20">
              Voltar para Hoje
            </Button>
          )}
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigateDay('next')}
          disabled={isSelectedToday} // Future handling could be enabled if needed, but usually limited to today
          className={cn(isSelectedToday && "invisible")}
        >
          <ChevronRight className="h-5 w-5" />
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
      {visibleHabits.length === 0 && habits.length === 0 ? (
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
          {/* Stats - Only show on Today view for clarity, or keep always? Keeping always for motivation. */}
          <HabitStats stats={stats} />

          {/* Habit Cards */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              {isSelectedToday ? "Hábitos de Hoje" : `Hábitos de ${format(selectedDate, "dd/MM", { locale: ptBR })}`}
              {!isSelectedToday && (
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Visualização Retroativa
                </span>
              )}
            </h2>
            
            {visibleHabits.length === 0 ? (
               <div className="text-center py-8 text-muted-foreground text-sm">
                 Nenhum hábito ativo nesta data.
               </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {visibleHabits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    onToggle={handleToggle}
                    onEdit={handleEdit}
                    onDelete={() => handleArchive(habit)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Contribution Graph */}
          {isSelectedToday && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Histórico de Contribuições
              </h2>
              <HabitContributionGraph habits={habits} period="90days" />
            </div>
          )}
        </>
      )}

      {/* Archived Habits Section */}
      <ArchivedHabitsSection
        archivedHabits={archivedHabits}
        getArchivedHabitStats={getArchivedHabitStats}
        onRestore={restoreHabit}
        canRestore={canAddHabit}
      />

      {/* Form Modal */}
      <HabitFormModal
        isOpen={isFormModalOpen}
        onClose={handleModalClose}
        onSave={handleSave}
        habit={editingHabit}
        canAddHabit={canAddHabit}
        remainingHabits={remainingHabits}
      />

      {/* Archive Modal */}
      <ArchiveHabitModal
        habit={archivingHabit}
        isOpen={!!archivingHabit}
        onClose={() => setArchivingHabit(null)}
        onArchive={handleArchiveConfirm}
      />
    </div>
  );
}

