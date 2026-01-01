// @ts-nocheck
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectName, deleteItems } = await req.json();
    if (!projectName) {
      throw new Error('O nome do projeto é obrigatório.');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Faltando cabeçalho de autorização');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    
    const { data: { user } } = await supabaseAdmin.auth.getUser();
    if (!user) {
      throw new Error('Usuário inválido');
    }

    if (deleteItems) {
      // Excluir itens
      const { error: tasksError } = await supabaseAdmin.from('tasks').delete().eq('user_id', user.id).eq('project', projectName);
      if (tasksError) throw tasksError;
      const { error: notesError } = await supabaseAdmin.from('notes').delete().eq('user_id', user.id).eq('project', projectName);
      if (notesError) throw notesError;
    } else {
      // Desassociar itens
      const { error: tasksError } = await supabaseAdmin.from('tasks').update({ project: null }).eq('user_id', user.id).eq('project', projectName);
      if (tasksError) throw tasksError;
      const { error: notesError } = await supabaseAdmin.from('notes').update({ project: null }).eq('user_id', user.id).eq('project', projectName);
      if (notesError) throw notesError;
    }

    return new Response(JSON.stringify({ success: true }), {
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