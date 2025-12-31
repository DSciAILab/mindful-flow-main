import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "analyze_change") {
      // Analyze if the user's reason reflects the score change
      const { areaName, previousScore, newScore, reason } = data;
      
      systemPrompt = `Você é um coach de vida gentil e empático, especializado em ajudar pessoas com TDAH a refletir sobre suas vidas.
Sua tarefa é analisar se a explicação do usuário reflete adequadamente a mudança de score em uma área da vida.
Responda em português brasileiro de forma breve e encorajadora.
Se a explicação for superficial, faça perguntas gentis para aprofundar.
Se a explicação for boa, valide os sentimentos e ofereça uma pequena perspectiva.
Mantenha respostas curtas (máximo 3 frases).`;

      userPrompt = `O usuário mudou a área "${areaName}" de ${previousScore} para ${newScore}.
Explicação dada: "${reason}"

Analise se esta explicação reflete bem a mudança e responda de forma encorajadora.`;
    } 
    else if (action === "help_define_score") {
      // Help user define a score through conversation
      const { areaName, currentScore, userMessage, conversationHistory } = data;
      
      systemPrompt = `Você é um coach de vida gentil especializado em ajudar pessoas com TDAH a se autoavaliar.
Ajude o usuário a definir um score de 1-10 para a área "${areaName}".
Score atual: ${currentScore}
Faça perguntas específicas e práticas para ajudar na reflexão.
Quando sentir que o usuário tem clareza, sugira um score e explique o porquê.
Responda em português brasileiro, de forma breve e acolhedora (máximo 4 frases).
Use linguagem simples e evite julgamentos.`;

      const history = conversationHistory || [];
      const formattedHistory = history.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content
      }));

      userPrompt = userMessage;
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            ...formattedHistory,
            { role: "user", content: userPrompt }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        throw new Error("AI gateway error");
      }

      const aiData = await response.json();
      const aiMessage = aiData.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua mensagem.";

      return new Response(JSON.stringify({ message: aiMessage }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    else if (action === "suggest_improvements") {
      // Suggest improvements based on wheel of life scores
      const { areas } = data;
      
      systemPrompt = `Você é um coach de vida especializado em ajudar pessoas com TDAH.
Analise as áreas da vida do usuário e sugira 2-3 ações práticas e pequenas para melhorar.
Foque nas áreas com menor score.
Use linguagem simples, encorajadora e evite sobrecarregar.
Responda em português brasileiro.
Lembre-se: pessoas com TDAH se beneficiam de tarefas específicas, pequenas e com recompensa clara.`;

      const areasText = areas.map((a: { name: string; score: number }) => `${a.name}: ${a.score}/10`).join("\n");
      userPrompt = `Minhas áreas da vida atuais:\n${areasText}\n\nSugira melhorias práticas e pequenas para as áreas mais fracas.`;
    }
    else {
      return new Response(JSON.stringify({ error: "Ação não reconhecida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For analyze_change and suggest_improvements
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const aiMessage = aiData.choices?.[0]?.message?.content || "Desculpe, não consegui processar.";

    return new Response(JSON.stringify({ message: aiMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in wheel-of-life-ai function:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
