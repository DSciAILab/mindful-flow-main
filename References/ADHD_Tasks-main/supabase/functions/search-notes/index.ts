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

    // 1. Gerar embedding para a consulta de busca
    const embeddingResponse = await supabaseClient.functions.invoke('generate-embedding', {
      body: { text: query },
    });

    if (embeddingResponse.error) {
      throw embeddingResponse.error;
    }
    const queryEmbedding = embeddingResponse.data.embedding;

    // 2. Chamar a função do banco de dados para encontrar notas similares (agora com busca híbrida)
    const { data: notes, error: matchError } = await supabaseClient.rpc('match_notes', {
      query_embedding: queryEmbedding,
      query_text: query, // Passando o texto original da busca
      match_threshold: 0.70, // Limiar de similaridade
      match_count: 15, // Aumentar um pouco o limite para acomodar ambos os tipos de busca
    });

    if (matchError) {
      throw matchError;
    }

    return new Response(JSON.stringify({ notes }), {
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