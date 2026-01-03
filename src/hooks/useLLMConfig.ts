import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LLMConfig {
  provider: string;
  model: string;
  apiKey: string | null;
  aiPersonaConfig: Record<string, any> | null;
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
          aiPersonaConfig: null,
        });
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('mf_profiles')
        .select('llm_provider, llm_api_key, llm_model, ai_persona_config')
        .eq('id', user.id)
        .single();

      if (profile) {
        setConfig({
          provider: profile.llm_provider || 'lovable',
          model: profile.llm_model || 'gemini-2.5-flash',
          apiKey: profile.llm_api_key,
          aiPersonaConfig: profile.ai_persona_config as Record<string, any> | null,
        });
      } else {
        setConfig({
          provider: 'lovable',
          model: 'gemini-2.5-flash',
          apiKey: null,
          aiPersonaConfig: null,
        });
      }
    } catch (error) {
      console.error('Error loading LLM config:', error);
      setConfig({
        provider: 'lovable',
        model: 'gemini-2.5-flash',
        apiKey: null,
        aiPersonaConfig: null,
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

