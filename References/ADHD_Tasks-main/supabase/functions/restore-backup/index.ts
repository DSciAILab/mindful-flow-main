// @ts-nocheck
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tabelas com UUID primary keys (preservar ID original)
const TABLES_WITH_UUID_IDS = [
  'tasks', 'notes', 'habits', 'quotes', 'scheduled_blocks', 'recurring_tasks'
];

// Tabelas com BIGINT auto-increment primary keys (gerar novo ID)
const TABLES_WITH_BIGINT_IDS = [
  'boolean_habit_checks', 'quantifiable_habit_entries', 'weekly_reviews', 'mood_logs', 'time_logs', 'task_interruptions'
];

// Todas as tabelas a serem gerenciadas pelo backup/restauração
const TABLES_TO_MANAGE = [...TABLES_WITH_UUID_IDS, ...TABLES_WITH_BIGINT_IDS];

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Faltando cabeçalho de autorização');
    }

    // Usar a SERVICE_ROLE_KEY para ter permissão de escrita/deleção
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseAdmin.auth.getUser();
    if (!user) {
      throw new Error('Usuário inválido');
    }

    const backupData = await req.json();

    // --- Transação de Restauração ---

    // 1. Deletar todos os dados existentes do usuário nas tabelas gerenciadas
    // Deletar em ordem inversa para evitar problemas de chave estrangeira
    for (const table of [...TABLES_TO_MANAGE].reverse()) {
      const { error: deleteError } = await supabaseAdmin
        .from(table)
        .delete()
        .eq('user_id', user.id);
      
      if (deleteError) {
        throw new Error(`Erro ao limpar a tabela '${table}': ${deleteError.message}`);
      }
    }

    // 2. Inserir os novos dados do backup
    // Inserir em ordem para respeitar as chaves estrangeiras (ex: habits antes de checks)
    for (const table of TABLES_TO_MANAGE) {
      const dataToInsert = backupData[table];
      if (dataToInsert && dataToInsert.length > 0) {
        const sanitizedData = dataToInsert.map(item => {
          const newItem = { ...item, user_id: user.id }; // Garante que o user_id está correto
          
          // Remove o ID se for uma tabela com BIGINT auto-incrementável
          if (TABLES_WITH_BIGINT_IDS.includes(table)) {
            delete newItem.id;
          }
          // Para tabelas com UUID, o ID original é preservado
          
          return newItem;
        });

        const { error: insertError } = await supabaseAdmin
          .from(table)
          .insert(sanitizedData);

        if (insertError) {
          throw new Error(`Erro ao inserir na tabela '${table}': ${insertError.message}`);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, message: "Restauração concluída com sucesso." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});