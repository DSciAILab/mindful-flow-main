// @ts-nocheck
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Interfaces para tipagem dos dados
interface Task { id: string; title: string; status: string; project: string | null; description: string | null; updated_at: string; }
interface Note { content: string; project: string | null; }
interface Habit { id: string; title: string; }
interface HabitCheck { habit_id: string; check_date: string; }
interface TimeLog { task_id: string; duration_seconds: number; }
interface Interruption { task_id: string; }

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      throw new Error("A variável de ambiente GEMINI_API_KEY não está configurada.");
    }

    const { query } = await req.json();
    if (!query) {
      throw new Error('A propriedade "query" é obrigatória.');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Faltando cabeçalho de autorização');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Usuário inválido');
    }

    // --- Coleta de Dados Abrangente ---
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      { data: tasks, error: tasksError },
      { data: notes, error: notesError },
      { data: habits, error: habitsError },
      { data: habitChecks, error: habitChecksError },
      { data: timeLogs, error: timeLogsError },
      { data: interruptions, error: interruptionsError },
      { count: completedTodayCount, error: completedTodayError }
    ] = await Promise.all([
      supabaseClient.from('tasks').select('id, title, status, project, description, updated_at').eq('user_id', user.id).limit(50),
      supabaseClient.from('notes').select('content, project').eq('user_id', user.id).limit(20),
      supabaseClient.from('habits').select('id, title').eq('user_id', user.id),
      supabaseClient.from('daily_habit_checks').select('habit_id, check_date').eq('user_id', user.id),
      supabaseClient.from('time_logs').select('task_id, duration_seconds').eq('user_id', user.id),
      supabaseClient.from('task_interruptions').select('task_id').eq('user_id', user.id),
      supabaseClient.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'completed').gte('updated_at', todayStart.toISOString()),
    ]);

    if (tasksError || notesError || habitsError || habitChecksError || timeLogsError || interruptionsError || completedTodayError) {
        console.error("Erro ao buscar dados do Supabase:", { tasksError, notesError, habitsError, habitChecksError, timeLogsError, interruptionsError, completedTodayError });
        throw new Error("Falha ao buscar dados de contexto do usuário.");
    }

    // --- Processamento e Construção do Contexto ---
    const taskMap = new Map<string, Task>(tasks?.map(t => [t.id, t]));

    const timeLogsByTask = (timeLogs as TimeLog[]).reduce((acc, log) => {
      acc[log.task_id] = (acc[log.task_id] || 0) + log.duration_seconds;
      return acc;
    }, {} as Record<string, number>);

    const interruptionsByTask = (interruptions as Interruption[]).reduce((acc, interruption) => {
      acc[interruption.task_id] = (acc[interruption.task_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    let context = "### CONTEXTO DO USUÁRIO ###\n\n";
    context += `### Estatísticas de Hoje\n- Tarefas concluídas hoje: ${completedTodayCount || 0}\n\n`;

    if (tasks && tasks.length > 0) {
      context += "### Tarefas Atuais\n" + (tasks as Task[]).map(t => {
        const time = timeLogsByTask[t.id] ? `(Tempo focado: ${Math.round(timeLogsByTask[t.id] / 60)} min)` : '';
        const inter = interruptionsByTask[t.id] ? `(Interrupções: ${interruptionsByTask[t.id]})` : '';
        return `- ${t.title} (Status: ${t.status}) ${time} ${inter}`;
      }).join("\n") + "\n\n";
    }

    if (habits && habits.length > 0) {
      const checksByHabit = (habitChecks as HabitCheck[]).reduce((acc, check) => {
        if (!acc[check.habit_id]) acc[check.habit_id] = [];
        acc[check.habit_id].push(check.check_date);
        return acc;
      }, {} as Record<string, string[]>);

      context += "### Hábitos e Progresso\n" + (habits as Habit[]).map(h => {
        const checkCount = checksByHabit[h.id]?.length || 0;
        return `- ${h.title} (Concluído ${checkCount} vezes)`;
      }).join("\n") + "\n\n";
    }

    if (notes && notes.length > 0) {
      context += "### Anotações Recentes\n" + (notes as Note[]).map(n => `- ${n.content}`).join("\n") + "\n\n";
    }
    context += "### FIM DO CONTEXTO ###\n\n";

    const prompt = `Você é um assistente de produtividade pessoal chamado 'Dyad AI'. Sua função é analisar os dados do usuário e responder às perguntas dele de forma concisa e precisa. Use apenas os dados do contexto fornecido.

${context}

Pergunta do Usuário: ${query}
`;

    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error("Erro na API do Gemini:", errorBody);
      throw new Error(`Erro na API do Gemini: ${geminiResponse.status}. Detalhes: ${errorBody}`);
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates[0]?.content.parts[0]?.text || "Desculpe, não consegui gerar uma resposta.";

    return new Response(JSON.stringify({ response: responseText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro na Edge Function:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});