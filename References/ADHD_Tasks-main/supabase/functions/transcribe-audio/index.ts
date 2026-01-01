// @ts-nocheck
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEEPGRAM_API_KEY = Deno.env.get("DEEPGRAM_API_KEY");
const DEEPGRAM_URL = "https://api.deepgram.com/v1/listen?model=nova-2&language=pt-BR&smart_format=true";

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!DEEPGRAM_API_KEY) {
      throw new Error("A chave da API da Deepgram não está configurada. Por favor, adicione o segredo DEEPGRAM_API_KEY nas configurações da sua Edge Function.");
    }

    const deepgramResponse = await fetch(DEEPGRAM_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': req.headers.get('Content-Type') || 'audio/webm',
      },
      body: req.body,
    });

    if (!deepgramResponse.ok) {
      const errorBody = await deepgramResponse.text();
      console.error("Erro na API da Deepgram:", {
        status: deepgramResponse.status,
        statusText: deepgramResponse.statusText,
        headers: Object.fromEntries(deepgramResponse.headers.entries()),
        body: errorBody
      });
      throw new Error(`Erro na API da Deepgram: ${deepgramResponse.status}. Detalhes: ${errorBody}`);
    }

    const data = await deepgramResponse.json();
    const transcript = data.results.channels[0].alternatives[0].transcript;

    return new Response(JSON.stringify({ transcript }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido na transcrição.";
    console.error("Erro na Edge Function 'transcribe-audio':", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, 
    });
  }
});