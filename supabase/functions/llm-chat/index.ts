import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LLMRequest {
  messages: { role: string; content: string }[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

interface LLMConfig {
  provider: string;
  model: string;
  apiKey: string | null;
}

async function callLovableAI(messages: { role: string; content: string }[], model: string, maxTokens: number, temperature: number) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY is not configured');
  }

  const modelMap: Record<string, string> = {
    'gemini-2.5-flash': 'google/gemini-2.5-flash',
    'gemini-2.5-pro': 'google/gemini-2.5-pro',
  };

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelMap[model] || 'google/gemini-2.5-flash',
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  return response;
}

async function callOpenRouter(messages: { role: string; content: string }[], model: string, apiKey: string, maxTokens: number, temperature: number) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://lovable.dev',
      'X-Title': 'Focus Flow ADHD',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  return response;
}

async function callOpenAI(messages: { role: string; content: string }[], model: string, apiKey: string, maxTokens: number, temperature: number) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  return response;
}

async function callAnthropic(messages: { role: string; content: string }[], model: string, apiKey: string, maxTokens: number, temperature: number) {
  // Filter out system messages and handle them separately
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const chatMessages = messages.filter(m => m.role !== 'system');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      system: systemMessage,
      messages: chatMessages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      max_tokens: maxTokens,
      temperature,
    }),
  });

  return response;
}

async function callGoogleAI(messages: { role: string; content: string }[], model: string, apiKey: string, maxTokens: number, temperature: number) {
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature,
      },
    }),
  });

  return response;
}

async function parseResponse(response: Response, provider: string): Promise<string> {
  const data = await response.json();

  switch (provider) {
    case 'lovable':
    case 'openrouter':
    case 'openai':
      return data.choices?.[0]?.message?.content || '';
    case 'anthropic':
      return data.content?.[0]?.text || '';
    case 'google':
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    default:
      return data.choices?.[0]?.message?.content || '';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, systemPrompt, maxTokens = 1000, temperature = 0.7 } = await req.json() as LLMRequest;

    // Get user's LLM configuration
    const authHeader = req.headers.get('Authorization');
    let config: LLMConfig = {
      provider: 'lovable',
      model: 'gemini-2.5-flash',
      apiKey: null,
    };

    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user } } = await supabaseClient.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('llm_provider, llm_api_key, llm_model')
          .eq('id', user.id)
          .single();

        if (profile) {
          config = {
            provider: profile.llm_provider || 'lovable',
            model: profile.llm_model || 'gemini-2.5-flash',
            apiKey: profile.llm_api_key,
          };
        }
      }
    }

    console.log('Using LLM provider:', config.provider, 'model:', config.model);

    // Build messages with system prompt
    const fullMessages = systemPrompt 
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    let response: Response;

    // Route to appropriate provider
    switch (config.provider) {
      case 'openrouter':
        if (!config.apiKey) {
          throw new Error('OpenRouter API key not configured');
        }
        response = await callOpenRouter(fullMessages, config.model, config.apiKey, maxTokens, temperature);
        break;

      case 'openai':
        if (!config.apiKey) {
          throw new Error('OpenAI API key not configured');
        }
        response = await callOpenAI(fullMessages, config.model, config.apiKey, maxTokens, temperature);
        break;

      case 'anthropic':
        if (!config.apiKey) {
          throw new Error('Anthropic API key not configured');
        }
        response = await callAnthropic(fullMessages, config.model, config.apiKey, maxTokens, temperature);
        break;

      case 'google':
        if (!config.apiKey) {
          throw new Error('Google AI API key not configured');
        }
        response = await callGoogleAI(fullMessages, config.model, config.apiKey, maxTokens, temperature);
        break;

      case 'lovable':
      default:
        response = await callLovableAI(fullMessages, config.model, maxTokens, temperature);
        break;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LLM API error:', response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({ error: 'Invalid API key. Please check your settings.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Insufficient credits. Please add more to your account.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`LLM API error: ${response.status}`);
    }

    const content = await parseResponse(response, config.provider);

    return new Response(
      JSON.stringify({ 
        content,
        provider: config.provider,
        model: config.model,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in llm-chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
