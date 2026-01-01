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
    const { noteId, content } = await req.json();
    if (!noteId || !content) {
      throw new Error('As propriedades "noteId" e "content" são obrigatórias.');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Faltando cabeçalho de autorização');
    }

    // Usar a SERVICE_ROLE_KEY para ter permissão de escrita na tabela
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Gerar o embedding para o conteúdo da nota
    const embeddingResponse = await supabaseAdmin.functions.invoke('generate-embedding', {
      body: { text: content },
    });

    if (embeddingResponse.error) {
      throw embeddingResponse.error;
    }
    const embedding = embeddingResponse.data.embedding;

    // 2. Atualizar a nota no banco de dados com o novo embedding
    const { error: updateError } = await supabaseAdmin
      .from('notes')
      .update({ embedding: embedding })
      .eq('id', noteId);

    if (updateError) {
      throw updateError;
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