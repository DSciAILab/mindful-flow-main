import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LLMConfig {
  provider: string;
  model: string;
  apiKey: string | null;
}

export function useLLMConfig() {
  const [config, setConfig] = useState<LLMConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConfig();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadConfig();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setConfig({
          provider: 'lovable',
          model: 'gemini-2.5-flash',
          apiKey: null,
        });
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('llm_provider, llm_api_key, llm_model')
        .eq('id', user.id)
        .single();

      if (profile) {
        setConfig({
          provider: profile.llm_provider || 'lovable',
          model: profile.llm_model || 'gemini-2.5-flash',
          apiKey: profile.llm_api_key,
        });
      } else {
        setConfig({
          provider: 'lovable',
          model: 'gemini-2.5-flash',
          apiKey: null,
        });
      }
    } catch (error) {
      console.error('Error loading LLM config:', error);
      setConfig({
        provider: 'lovable',
        model: 'gemini-2.5-flash',
        apiKey: null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isExternalProvider = config?.provider !== 'lovable';
  const hasApiKey = !!config?.apiKey;

  return {
    config,
    isLoading,
    isExternalProvider,
    hasApiKey,
    reload: loadConfig,
  };
}
