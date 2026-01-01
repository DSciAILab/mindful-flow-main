"use client";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Função para buscar todos os dados do usuário de várias tabelas
const fetchAllUserData = async (userId: string) => {
  const [
    tasks,
    notes,
    habits,
    boolean_habit_checks,
    quantifiable_habit_entries,
    quotes,
    weekly_reviews,
    mood_logs,
    time_logs,
    task_interruptions,
    scheduled_blocks,
    recurring_tasks,
  ] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', userId),
    supabase.from('notes').select('*').eq('user_id', userId),
    supabase.from('habits').select('*').eq('user_id', userId),
    supabase.from('boolean_habit_checks').select('*').eq('user_id', userId),
    supabase.from('quantifiable_habit_entries').select('*').eq('user_id', userId),
    supabase.from('quotes').select('*').eq('user_id', userId),
    supabase.from('weekly_reviews').select('*').eq('user_id', userId),
    supabase.from('mood_logs').select('*').eq('user_id', userId),
    supabase.from('time_logs').select('*').eq('user_id', userId),
    supabase.from('task_interruptions').select('*').eq('user_id', userId),
    supabase.from('scheduled_blocks').select('*').eq('user_id', userId),
    supabase.from('recurring_tasks').select('*').eq('user_id', userId),
  ]);

  // Verificando erros em cada busca
  const results = {
    tasks, notes, habits, boolean_habit_checks, quantifiable_habit_entries,
    quotes, weekly_reviews, mood_logs, time_logs, task_interruptions,
    scheduled_blocks, recurring_tasks
  };

  for (const [key, value] of Object.entries(results)) {
    if (value.error) {
      throw new Error(`Erro ao buscar dados de '${key}': ${value.error.message}`);
    }
  }

  return {
    tasks: tasks.data,
    notes: notes.data,
    habits: habits.data,
    boolean_habit_checks: boolean_habit_checks.data,
    quantifiable_habit_entries: quantifiable_habit_entries.data,
    quotes: quotes.data,
    weekly_reviews: weekly_reviews.data,
    mood_logs: mood_logs.data,
    time_logs: time_logs.data,
    task_interruptions: task_interruptions.data,
    scheduled_blocks: scheduled_blocks.data,
    recurring_tasks: recurring_tasks.data,
  };
};

// Função para exportar os dados como um arquivo JSON
export const exportData = async (userId: string) => {
  const loadingToast = toast.loading("Exportando seus dados...");
  try {
    const data = await fetchAllUserData(userId);
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `dyad_backup_${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Backup exportado com sucesso!", { id: loadingToast });
  } catch (error: any) {
    console.error("Falha na exportação:", error);
    toast.error(`Falha na exportação: ${error.message}`, { id: loadingToast });
  }
};

// Função para restaurar os dados a partir de um arquivo JSON
export const restoreData = async (file: File) => {
  if (!file) {
    toast.error("Nenhum arquivo selecionado.");
    return;
  }

  const confirmation = window.confirm(
    "AVISO: A restauração substituirá TODOS os seus dados atuais pelos dados do arquivo de backup. Esta ação não pode ser desfeita. Deseja continuar?"
  );

  if (!confirmation) {
    toast.info("Restauração cancelada.");
    return;
  }

  const loadingToast = toast.loading("Restaurando dados... O aplicativo será recarregado ao concluir.");

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // Validar a estrutura básica do backup
    if (!data.tasks || !data.notes || !data.habits) {
      throw new Error("Arquivo de backup inválido ou corrompido.");
    }

    const { error } = await supabase.functions.invoke('restore-backup', {
      body: data,
    });

    if (error) {
      throw new Error(`Erro da Edge Function: ${error.message}`);
    }

    toast.success("Dados restaurados com sucesso! O aplicativo será recarregado.", {
      id: loadingToast,
      duration: 5000,
    });

    // Recarrega a página para refletir os novos dados
    setTimeout(() => {
      window.location.reload();
    }, 2000);

  } catch (error: any) {
    console.error("Falha na restauração:", error);
    toast.error(`Falha na restauração: ${error.message}`, { id: loadingToast });
  }
};