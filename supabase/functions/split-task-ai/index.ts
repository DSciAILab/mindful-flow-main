import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taskTitle, taskDescription, priority } = await req.json();

    if (!taskTitle) {
      throw new Error('Task title is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Splitting task:', taskTitle);

    const systemPrompt = `Você é um assistente especializado em produtividade para pessoas com TDAH. 
Sua função é dividir tarefas grandes em subtarefas menores, específicas e acionáveis.

Regras importantes:
1. Crie entre 3 e 6 subtarefas
2. Cada subtarefa deve ser clara, específica e completável em 15-30 minutos
3. Use verbos de ação no início (Ex: "Abrir", "Escrever", "Revisar")
4. Ordene as subtarefas na sequência lógica de execução
5. Considere a prioridade da tarefa principal para definir o nível de detalhamento
6. Para tarefas urgentes, foque nas ações essenciais
7. Para tarefas de baixa prioridade, pode ser mais detalhado
8. NÃO inclua números ou marcadores no início das subtarefas
9. Responda APENAS com as subtarefas, uma por linha, sem explicações adicionais`;

    const userPrompt = `Divida esta tarefa em subtarefas menores e gerenciáveis:

Tarefa: ${taskTitle}
${taskDescription ? `Descrição: ${taskDescription}` : ''}
Prioridade: ${priority || 'medium'}

Retorne apenas a lista de subtarefas, uma por linha.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos de IA esgotados. Adicione mais créditos na sua conta.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse subtasks from the response
    const subtasks = content
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .map((line: string) => {
        // Remove common prefixes like "- ", "• ", "1. ", etc.
        return line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
      })
      .filter((line: string) => line.length > 0);

    console.log('Generated subtasks:', subtasks);

    return new Response(
      JSON.stringify({ subtasks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in split-task-ai function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to split task';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
