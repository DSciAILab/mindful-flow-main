import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface UseLLMChatOptions {
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

interface LLMChatResult {
  content: string;
  provider: string;
  model: string;
}

export function useLLMChat(options: UseLLMChatOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const chat = useCallback(async (messages: Message[]): Promise<LLMChatResult | null> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('llm-chat', {
        body: {
          messages,
          systemPrompt: options.systemPrompt,
          maxTokens: options.maxTokens || 1000,
          temperature: options.temperature || 0.7,
        },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        // Handle specific errors
        if (data.error.includes('API key')) {
          toast({
            title: 'Chave API inválida',
            description: 'Verifique suas configurações de IA',
            variant: 'destructive',
          });
        } else if (data.error.includes('Rate limit')) {
          toast({
            title: 'Limite excedido',
            description: 'Aguarde um momento e tente novamente',
            variant: 'destructive',
          });
        } else if (data.error.includes('credits')) {
          toast({
            title: 'Créditos insuficientes',
            description: 'Adicione créditos à sua conta',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Erro na IA',
            description: data.error,
            variant: 'destructive',
          });
        }
        return null;
      }

      return {
        content: data.content,
        provider: data.provider,
        model: data.model,
      };
    } catch (error) {
      console.error('LLM chat error:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível conectar com a IA',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [options.systemPrompt, options.maxTokens, options.temperature, toast]);

  const sendMessage = useCallback(async (content: string, history: Message[] = []): Promise<string | null> => {
    const messages: Message[] = [
      ...history,
      { role: 'user', content },
    ];

    const result = await chat(messages);
    return result?.content || null;
  }, [chat]);

  return {
    chat,
    sendMessage,
    isLoading,
  };
}
