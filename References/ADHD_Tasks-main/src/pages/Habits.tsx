"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabaseDb } from "@/lib/supabase";
import { useSession } from "@/integrations/supabase/auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Layout from "@/components/Layout";
import HabitItem from "@/components/habits/HabitItem";
import { Habit } from "@/components/habits/types";
import { HabitsPageSkeleton } from "@/components/LoadingSkeletons";
import { format, differenceInCalendarDays, addDays, subDays, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Project } from "@/lib/supabase/projects"; // NEW IMPORT

const calculateStreak = (checkDates: string[]): number => {
  if (checkDates.length === 0) return 0;

  const sortedDates = checkDates.map(d => new Date(d)).sort((a, b) => b.getTime() - a.getTime());
  const today = new Date();
  const mostRecentCheck = sortedDates[0];

  if (differenceInCalendarDays(today, mostRecentCheck) > 1) {
    return 0;
  }

  let streak = 1;
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const currentDay = sortedDates[i];
    const nextDay = sortedDates[i + 1];
    if (differenceInCalendarDays(currentDay, nextDay) === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

const Habits = () => {
  const { user, isLoading } = useSession();
  const userId = user?.id;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [habitItems, setHabitItems] = useState<Habit[]>([]);
  const [booleanChecks, setBooleanChecks] = useState<{ habit_id: string; check_date: string }[]>([]);
  const [quantifiableEntries, setQuantifiableEntries] = useState<{ habit_id: string; entry_date: string; value: number }[]>([]);
  const [allBooleanChecks, setAllBooleanChecks] = useState<{ habit_id: string; check_date: string }[]>([]);
  const [allQuantifiableEntries, setAllQuantifiableEntries] = useState<{ habit_id: string; entry_date: string; value: number }[]>([]);
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [projectsList, setProjectsList] = useState<Project[]>([]); // NEW: Agora é uma lista de objetos Project
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Form state
  const [habitType, setHabitType] = useState<'boolean' | 'quantifiable'>('boolean');
  const [title, setTitle] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null); // NEW: Usar ID do projeto
  const [newProjectNameInput, setNewProjectNameInput] = useState(""); // NEW: Para o input do combobox
  const [hashtags, setHashtags] = useState("");
  const [goalValue, setGoalValue] = useState<number | "">("");
  const [goalUnit, setGoalUnit] = useState("");
  const [incrementValue, setIncrementValue] = useState<number | "">("");
  const [isProjectComboboxOpen, setIsProjectComboboxOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (userId) {
      const [habits, bChecks, qEntries, allBChecks, allQEntries, allProjects] = await Promise.all([
        supabaseDb.getHabits(userId),
        supabaseDb.getBooleanHabitChecksForWeek(userId, currentDate),
        supabaseDb.getQuantifiableEntriesForWeek(userId, currentDate),
        supabaseDb.getAllBooleanHabitChecks(userId),
        supabaseDb.getAllQuantifiableEntries(userId),
        supabaseDb.getProjects(userId), // NEW: Buscar a lista completa de projetos
      ]);
      setHabitItems(habits);
      setBooleanChecks(bChecks);
      setQuantifiableEntries(qEntries);
      setAllBooleanChecks(allBChecks);
      setAllQuantifiableEntries(allQEntries);
      setProjectsList(allProjects); // NEW: Define a lista de objetos Project
    }
  }, [userId, currentDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const newStreaks: Record<string, number> = {};
    for (const habit of habitItems) {
      if (habit.type === 'boolean') {
        const checks = allBooleanChecks.filter(c => c.habit_id === habit.id).map(c => c.check_date);
        newStreaks[habit.id] = calculateStreak(checks);
      } else if (habit.type === 'quantifiable') {
        const entries = allQuantifiableEntries.filter(e => e.habit_id === habit.id && e.value >= (habit.goal_value || 0)).map(e => e.entry_date);
        const uniqueDates = [...new Set(entries)];
        newStreaks[habit.id] = calculateStreak(uniqueDates);
      }
    }
    setStreaks(newStreaks);
  }, [habitItems, allBooleanChecks, allQuantifiableEntries]);

  const resetForm = () => {
    setTitle("");
    setSelectedProjectId(null); // Resetar ID
    setNewProjectNameInput(""); // Resetar input
    setHashtags("");
    setHabitType("boolean");
    setGoalValue("");
    setGoalUnit("");
    setIncrementValue("");
    setEditingHabit(null);
    setIsProjectComboboxOpen(false);
  };

  const handleOpenDialog = (habit: Habit | null = null) => {
    if (habit) {
      setEditingHabit(habit);
      setTitle(habit.title);
      setSelectedProjectId(habit.project_id || null); // Atualizar ID do projeto
      setNewProjectNameInput(projectsList.find(p => p.id === habit.project_id)?.name || ""); // Preencher input com nome
      setHashtags(habit.hashtags.join(" ") || "");
      setHabitType(habit.type);
      setGoalValue(habit.goal_value || "");
      setGoalUnit(habit.goal_unit || "");
      setIncrementValue(habit.increment_value || "");
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSaveHabit = async () => {
    if (!userId || !title.trim()) return toast.error("O título é obrigatório.");

    let finalProjectId = selectedProjectId;
    // Se o usuário digitou um novo nome de projeto no combobox, precisamos criá-lo
    if (newProjectNameInput && !selectedProjectId) {
      const existingProject = projectsList.find(p => p.name.toLowerCase() === newProjectNameInput.toLowerCase());
      if (existingProject) {
        finalProjectId = existingProject.id;
      } else {
        // CORRIGIDO: Passando todos os campos opcionais como null
        const newProject = await supabaseDb.addProject(userId, { name: newProjectNameInput, description: null, woop_wish: null, woop_outcome: null, woop_obstacle: null, woop_plan: null, smart_specific: null, smart_measurable: null, smart_achievable: null, smart_relevant: null, smart_time_bound: null });
        if (newProject) {
          finalProjectId = newProject.id;
          toast.success(`Novo projeto "${newProject.name}" criado!`);
          loadData(); // Recarregar para atualizar a lista de projetos
        } else {
          toast.error("Falha ao criar novo projeto.");
          return;
        }
      }
    }

    const habitData: Partial<Habit> = {
      title: title.trim(),
      project_id: finalProjectId, // Usar finalProjectId
      hashtags: hashtags.split(" ").filter(tag => tag.trim() !== ""),
      type: habitType,
    };

    if (habitType === 'quantifiable') {
      if (!goalValue || !goalUnit.trim() || !incrementValue) {
        return toast.error("Para hábitos quantificáveis, a meta, unidade e valor de incremento são obrigatórios.");
      }
      habitData.goal_value = Number(goalValue);
      habitData.goal_unit = goalUnit.trim();
      habitData.increment_value = Number(incrementValue);
    }

    const promise = editingHabit
      ? supabaseDb.updateHabit(userId, editingHabit.id, habitData)
      : supabaseDb.addHabit(userId, habitData as any);

    const result = await promise;
    if (result) {
      toast.success(`Hábito ${editingHabit ? 'atualizado' : 'criado'} com sucesso!`);
      setIsDialogOpen(false);
      loadData();
    } else {
      toast.error(`Falha ao ${editingHabit ? 'atualizar' : 'criar'} o hábito.`);
    }
  };

  const handleDeleteHabit = async (habitToRemove: Habit) => {
    if (!userId) return;
    if (await supabaseDb.deleteHabit(userId, habitToRemove.id)) {
      loadData();
      toast.info(`Hábito "${habitToRemove.title}" deletado.`);
    } else {
      toast.error("Falha ao deletar hábito.");
    }
  };

  const handleToggleBooleanCheck = async (habitId: string, date: Date) => {
    if (!userId) return;
    const dateString = format(date, 'yyyy-MM-dd');
    const isChecked = booleanChecks.some(c => c.habit_id === habitId && format(new Date(c.check_date), 'yyyy-MM-dd') === dateString);
    if (await supabaseDb.setBooleanHabitCheckForDate(userId, habitId, dateString, !isChecked)) {
      loadData();
    } else {
      toast.error("Falha ao atualizar o hábito.");
    }
  };

  const handleAddQuantifiableEntry = async (habitId: string, value: number, date: Date) => {
    if (!userId) return;
    if (await supabaseDb.addQuantifiableEntry(userId, habitId, value, date)) {
      loadData();
    } else {
      toast.error("Falha ao registrar entrada.");
    }
  };

  const handleDeleteLastQuantifiableEntry = async (habitId: string, date: Date) => {
    if (!userId) return;
    if (await supabaseDb.deleteLastQuantifiableEntry(userId, habitId, date)) {
      loadData();
    } else {
      toast.error("Falha ao desfazer a última entrada.");
    }
  };

  const handlePreviousWeek = () => setCurrentDate(subDays(currentDate, 7));
  const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const handleGoToToday = () => setCurrentDate(new Date());

  if (isLoading) return <HabitsPageSkeleton />;

  const headerActions = <Button onClick={() => handleOpenDialog()}><Plus className="mr-2 h-4 w-4" />Adicionar Hábito</Button>;
  const weekDisplay = `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'dd MMM', { locale: ptBR })} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'dd MMM', { locale: ptBR })}`;

  const currentProjectName = projectsList.find(p => p.id === selectedProjectId)?.name || newProjectNameInput;

  return (
    <Layout headerActions={headerActions} onHabitAdded={loadData}>
      <div className="p-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Seus Hábitos</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePreviousWeek}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" onClick={handleGoToToday} className="hidden sm:block">{weekDisplay}</Button>
                <Button variant="outline" onClick={handleGoToToday} className="block sm:hidden">Hoje</Button>
                <Button variant="outline" size="icon" onClick={handleNextWeek}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {habitItems.length === 0 ? (
              <p className="text-muted-foreground">Acompanhe e construa seus hábitos. Use "--" para adicionar um hábito.</p>
            ) : (
              <ul className="space-y-4">
                {habitItems.map((item) => (
                  <HabitItem
                    key={item.id}
                    habit={item}
                    booleanChecks={booleanChecks}
                    quantifiableEntries={quantifiableEntries}
                    allBooleanChecks={allBooleanChecks}
                    allQuantifiableEntries={allQuantifiableEntries}
                    streak={streaks[item.id] || 0}
                    onToggleBooleanCheck={handleToggleBooleanCheck}
                    onAddQuantifiableEntry={handleAddQuantifiableEntry}
                    onDeleteLastQuantifiableEntry={handleDeleteLastQuantifiableEntry}
                    onEdit={handleOpenDialog}
                    onDelete={handleDeleteHabit}
                    displayDate={currentDate}
                    projectsList={projectsList} // Passar projectsList
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-full sm:max-w-[540px]"> {/* Ajustado para ser full width em telas pequenas */}
          <DialogHeader>
            <DialogTitle>{editingHabit ? "Editar Hábito" : "Adicionar Novo Hábito"}</DialogTitle>
            <DialogDescription>Preencha os detalhes do seu hábito.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="habitType">Tipo de Hábito</Label>
              <Select value={habitType} onValueChange={(v) => setHabitType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="boolean">Marcar como concluído</SelectItem>
                  <SelectItem value="quantifiable">Registrar quantidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Ler 10 páginas" />
            </div>
            {habitType === 'quantifiable' && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1 grid gap-2">
                    <Label htmlFor="goalValue">Meta</Label>
                    <Input id="goalValue" type="number" value={goalValue} onChange={(e) => setGoalValue(Number(e.target.value))} placeholder="2000" />
                  </div>
                  <div className="col-span-1 grid gap-2">
                    <Label htmlFor="goalUnit">Unidade</Label>
                    <Input id="goalUnit" value={goalUnit} onChange={(e) => setGoalUnit(e.target.value)} placeholder="ml" />
                  </div>
                  <div className="col-span-1 grid gap-2">
                    <Label htmlFor="incrementValue">Incremento</Label>
                    <Input id="incrementValue" type="number" value={incrementValue} onChange={(e) => setIncrementValue(Number(e.target.value))} placeholder="250" />
                  </div>
                </div>
              </>
            )}
            <div className="grid gap-2">
              <Label htmlFor="project">Projeto</Label>
              <Popover open={isProjectComboboxOpen} onOpenChange={setIsProjectComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isProjectComboboxOpen}
                    className="w-full justify-between"
                  >
                    {currentProjectName || "Selecione ou crie um projeto..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Buscar ou criar projeto..."
                      value={newProjectNameInput}
                      onValueChange={setNewProjectNameInput}
                    />
                    <CommandEmpty>
                      {newProjectNameInput ? `Criar "${newProjectNameInput}"` : "Nenhum projeto encontrado."}
                    </CommandEmpty>
                    <CommandGroup>
                      {projectsList.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={p.name}
                          onSelect={(currentValue) => {
                            const selected = projectsList.find(proj => proj.name.toLowerCase() === currentValue.toLowerCase());
                            setSelectedProjectId(selected?.id || null);
                            setNewProjectNameInput(selected?.name || "");
                            setIsProjectComboboxOpen(false);
                          }}
                        >
                          {p.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hashtags">Tags</Label>
              <Input id="hashtags" value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="Ex: leitura mindfulness" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleSaveHabit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Habits;