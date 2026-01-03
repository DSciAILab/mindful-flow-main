import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLLMConfig } from './useLLMConfig';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface TaskForAI {
  title: string;
  priority: string;
  status: string;
  dueDate?: string | null;
}

interface AICoachContext {
  tasksCount?: number;
  pendingTasksCount?: number;
  completedTasksCount?: number;
  urgentTasksCount?: number;
  completedToday?: number;
  currentMood?: number;
  focusMinutesToday?: number;
  // Actual tasks data
  tasksList?: TaskForAI[];
  urgentTasksTitles?: string[];
}

export function useAICoach() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! 👋 Sou seu assistente de foco. Posso te ajudar a criar tarefas, te motivar ou dar dicas de produtividade. Como posso ajudar?',
      timestamp: Date.now(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { config, isLoading: configLoading } = useLLMConfig();

  const buildSystemPrompt = (context: AICoachContext) => {
    // Build tasks info string
    let tasksInfo = '';
    if (context.tasksList && context.tasksList.length > 0) {
      tasksInfo = `\n\nTAREFAS ATUAIS DO USUÁRIO (você TEM acesso a estas tarefas do app):
${context.tasksList.map((t, i) => `${i + 1}. "${t.title}" - Prioridade: ${t.priority}, Status: ${t.status}${t.dueDate ? `, Vence: ${t.dueDate}` : ''}`).join('\n')}`;
    }

    let urgentInfo = '';
    if (context.urgentTasksTitles && context.urgentTasksTitles.length > 0) {
      urgentInfo = `\n\nTAREFAS URGENTES: ${context.urgentTasksTitles.join(', ')}`;
    }

    // Check if custom persona is configured
    const personaConfig = config?.aiPersonaConfig;
    
    if (personaConfig) {
      // Extract persona info from the config (supports nested structure)
      const agentKey = Object.keys(personaConfig)[0];
      const agent = personaConfig[agentKey] || personaConfig;
      const identity = agent.identity || agent;
      
      const name = identity.name || 'Jarvis';
      const persona = identity.persona || 'Assistente de produtividade';
      const references = identity.references?.join(', ') || '';
      const principles = identity.principles || {};
      
      // Build principles string
      const principlesList = Object.entries(principles)
        .filter(([_, value]) => value === true)
        .map(([key]) => key.replace(/_/g, ' '))
        .join(', ');

      // Brain dump module info
      const brainDumpModule = agent.brain_dump_module || {};
      const brainDumpDesc = brainDumpModule.description || '';
      
      // Real-time features
      const realtimeFeatures = agent.real_time_agent_features || {};
      const modeFocus = realtimeFeatures.mode_focus?.description || '';
      const modeRecovery = realtimeFeatures.mode_recovery?.description || '';
      const modeDecisionAssist = realtimeFeatures.mode_decision_assist?.description || '';

      return `Você é ${name}. ${persona}

IMPORTANTE: Você TEM ACESSO às tarefas do usuário que estão dentro deste aplicativo. NÃO diga que não pode acessar as tarefas - elas estão listadas abaixo.

Referências teóricas: ${references}

Princípios de atuação: ${principlesList}

${brainDumpDesc ? `Brain Dump: ${brainDumpDesc}` : ''}

Modos de operação:
- Foco: ${modeFocus}
- Recuperação: ${modeRecovery}
- Decisão Assistida: ${modeDecisionAssist}

Contexto atual do usuário:
- Tarefas pendentes: ${context.pendingTasksCount || 0}
- Tarefas urgentes: ${context.urgentTasksCount || 0}
- Tarefas concluídas hoje: ${context.completedToday || 0}
- Minutos de foco hoje: ${context.focusMinutesToday || 0}
${tasksInfo}${urgentInfo}

Para criar tarefas, responda com JSON: {"action": "create_task", "title": "...", "priority": "low|medium|high|urgent"}

Prioridades:
- urgent: Urgente/prazo apertado
- high: Alta prioridade
- medium: Prioridade média
- low: Baixa prioridade

Responda sempre em português brasileiro. Seja empático, conciso e focado em reduzir carga cognitiva.`;
    }
    
    // Default system prompt when no custom persona is configured
    return `Você é um assistente de produtividade especializado em TDAH e foco.

IMPORTANTE: Você TEM ACESSO às tarefas do usuário que estão dentro deste aplicativo. NÃO diga que não pode acessar as tarefas - elas estão listadas abaixo.

Seu papel é:
1. Ajudar o usuário a manter o foco e a motivação
2. Analisar as tarefas do usuário e ajudar a priorizar
3. Criar tarefas quando solicitado (responda com JSON: {"action": "create_task", "title": "...", "priority": "low|medium|high|urgent"})
4. Dar dicas práticas de produtividade
5. Ser empático e encorajador

Contexto atual do usuário:
- Tarefas pendentes: ${context.pendingTasksCount || 0}
- Tarefas urgentes: ${context.urgentTasksCount || 0}
- Tarefas concluídas hoje: ${context.completedToday || 0}
- Minutos de foco hoje: ${context.focusMinutesToday || 0}
${tasksInfo}${urgentInfo}

Prioridades:
- urgent: Urgente/prazo apertado
- high: Alta prioridade
- medium: Prioridade média
- low: Baixa prioridade

Responda sempre em português brasileiro. Seja conciso e motivador.`;
  };


  const sendMessage = useCallback(async (
    userMessage: string, 
    context: AICoachContext,
    onTaskCreate?: (task: { title: string; priority: string; category: string }) => void
  ) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Build conversation history for context
      const recentMessages = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const systemPrompt = buildSystemPrompt(context);
      
      const provider = config?.provider || 'lovable';
      const model = config?.model || 'gemini-1.5-flash';
      const apiKey = config?.apiKey;

      let aiResponse = '';

      // Ollama (Local) - no API key needed
      if (provider === 'ollama') {
        const ollamaUrl = apiKey || 'http://localhost:11434';
        
        const response = await fetch(`${ollamaUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              ...recentMessages,
              { role: 'user', content: userMessage },
            ],
            stream: false,
          }),
        });

        if (!response.ok) {
          throw new Error('Ollama não está rodando. Inicie com: ollama serve');
        }

        const data = await response.json();
        aiResponse = data.message?.content || 'Desculpe, não consegui processar sua mensagem.';
      }
      // LM Studio (Local) - OpenAI compatible API
      else if (provider === 'lm-studio') {
        const lmStudioUrl = apiKey || 'http://localhost:1234';
        
        const response = await fetch(`${lmStudioUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              ...recentMessages,
              { role: 'user', content: userMessage },
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
        });

        if (!response.ok) {
          throw new Error('LM Studio não está rodando. Inicie o servidor local');
        }

        const data = await response.json();
        aiResponse = data.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem.';
      } 
      // Google AI
      else if (provider === 'google') {
        if (!apiKey) {
          throw new Error('API key not configured');
        }

        const baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
        const url = `${baseUrl}/${model}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: systemPrompt }],
              },
              ...recentMessages.map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
              })),
              {
                role: 'user',
                parts: [{ text: userMessage }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500,
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get AI response');
        }

        const data = await response.json();
        aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Desculpe, não consegui processar sua mensagem.';
      }
      // Lovable (default fallback)
      else {
        if (!apiKey) {
          throw new Error('API key not configured');
        }
        
        const baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
        const url = `${baseUrl}/${model}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: systemPrompt }],
              },
              ...recentMessages.map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
              })),
              {
                role: 'user',
                parts: [{ text: userMessage }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500,
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get AI response');
        }

        const data = await response.json();
        aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Desculpe, não consegui processar sua mensagem.';
      }

      // Check for task creation action
      const taskMatch = aiResponse.match(/\{"action":\s*"create_task"[^}]+\}/);
      if (taskMatch && onTaskCreate) {
        try {
          const taskData = JSON.parse(taskMatch[0]);
          if (taskData.action === 'create_task' && taskData.title) {
            onTaskCreate({
              title: taskData.title,
              priority: taskData.priority || 'medium',
              category: taskData.category || 'green',
            });
          }
        } catch (e) {
          console.error('Error parsing task data:', e);
        }
      }

      // Clean response from JSON if present
      const cleanResponse = aiResponse.replace(/\{"action":\s*"create_task"[^}]+\}/g, '').trim();

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanResponse || 'Tarefa criada com sucesso! ✅',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMsg]);

    } catch (error) {
      console.error('AI Coach error:', error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, tive um problema ao processar sua mensagem. Tente novamente.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, config]);

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Olá! 👋 Sou seu assistente de foco. Como posso ajudar?',
        timestamp: Date.now(),
      },
    ]);
  }, []);

  return {
    messages,
    isLoading: isLoading || configLoading,
    sendMessage,
    clearMessages,
  };
}
