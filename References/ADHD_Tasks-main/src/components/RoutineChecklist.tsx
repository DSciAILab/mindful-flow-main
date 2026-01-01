"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
// import { ParsedTask } from "@/utils/taskParser"; // Removido: não é mais necessário
import { Habit } from "@/components/habits/types"; // Importado: nova tipagem
import { supabaseDb } from "@/lib/supabase";
import { useSession } from "@/integrations/supabase/auth";
import { toast } from "sonner";

interface RoutineChecklistProps {
  habits: Habit[]; // CORRIGIDO: Tipo alterado para Habit[]
}

const RoutineChecklist = ({ habits }: RoutineChecklistProps) => {
  const { user } = useSession();
  const userId = user?.id;

  const [checkedStates, setCheckedStates] = useState<Record<string, boolean>>({});

  // Filtra apenas os hábitos booleanos
  const booleanHabits = habits.filter(h => h.type === 'boolean'); // CORRIGIDO: Removido 'as any'

  useEffect(() => {
    const loadChecks = async () => {
      if (userId) {
        const loadedChecks = await supabaseDb.loadBooleanHabitChecks(userId);
        setCheckedStates(loadedChecks);
      }
    };
    loadChecks();
  }, [userId, habits]);

  const handleCheck = async (habitId: string, isChecked: boolean) => {
    if (!userId) {
      toast.error("Você precisa estar logado para marcar hábitos.");
      return;
    }

    setCheckedStates((prev) => ({ ...prev, [habitId]: isChecked }));

    const success = await supabaseDb.saveBooleanHabitCheck(userId, habitId, isChecked);
    if (!success) {
      toast.error("Falha ao salvar o estado do hábito.");
      setCheckedStates((prev) => ({ ...prev, [habitId]: !isChecked }));
    }
  };

  const sortedHabits = [...booleanHabits].sort((a, b) => {
    const aChecked = checkedStates[a.id] || false;
    const bChecked = checkedStates[b.id] || false;
    if (aChecked && !bChecked) return 1;
    if (!aChecked && bChecked) return -1;
    return 0;
  });

  return (
    <Card className="mx-4 mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Rotina da Manhã</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sortedHabits.length === 0 ? (
          <p className="text-muted-foreground">Nenhum hábito de 'marcar' definido. Adicione na aba "Hábitos".</p>
        ) : (
          sortedHabits.map((habit) => (
            <div key={habit.id} className="flex items-center space-x-2">
              <Checkbox
                id={`habit-${habit.id}`}
                checked={checkedStates[habit.id] || false}
                onCheckedChange={(checked) => handleCheck(habit.id, checked as boolean)}
              />
              <Label
                htmlFor={`habit-${habit.id}`}
                className={cn("text-base", (checkedStates[habit.id] || false) && "line-through text-muted-foreground")}
              >
                {habit.title}
              </Label>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default RoutineChecklist;