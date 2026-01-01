import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLLMConfig } from './useLLMConfig';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AICoachContext {
  tasksCount?: number;
  completedToday?: number;
  currentMood?: number;
  focusMinutesToday?: number;
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
    return `Você é um assistente de produtividade especializado em TDAH e foco. Seu papel é:
1. Ajudar o usuário a manter o foco e a motivação
2. Criar tarefas quando solicitado (responda com um JSON no formato: {"action": "create_task", "title": "...", "priority": "low|medium|high|urgent", "category": "red|yellow|purple|green"})
3. Dar dicas práticas de produtividade
4. Ser empático e encorajador

Contexto atual do usuário:
- Tarefas totais: ${context.tasksCount || 'desconhecido'}
- Tarefas concluídas hoje: ${context.completedToday || 0}
- Minutos de foco hoje: ${context.focusMinutesToday || 0}

Categorias de tarefas:
- red: Urgente/envolve outras pessoas
- yellow: Melhor fazer (chores)
- purple: Me faz sentir bem
- green: Seria bom se eu pudesse

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

      // Use Gemini API via fetch
      const apiKey = config?.apiKey || import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error('API key not configured');
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
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
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Desculpe, não consegui processar sua mensagem.';

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
