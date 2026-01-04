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
          provider: 'google',
          model: 'gemini-2.0-flash-exp', // Newer model fallback
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
        console.log('=== LLM Config Debug ===');
        console.log('Raw profile.llm_provider:', profile.llm_provider);
        console.log('Raw profile.llm_model:', profile.llm_model);
        console.log('Raw profile.llm_api_key present:', !!profile.llm_api_key);
        
        setConfig({
          provider: profile.llm_provider || 'google',
          model: profile.llm_model || 'gemini-2.0-flash-exp', // Use newer model as fallback
          apiKey: profile.llm_api_key,
          aiPersonaConfig: profile.ai_persona_config as Record<string, any> | null,
        });
      } else {
        setConfig({
          provider: 'google',
          model: 'gemini-2.0-flash-exp', // Newer model fallback
          apiKey: null,
          aiPersonaConfig: null,
        });
      }
    } catch (error) {
      console.error('Error loading LLM config:', error);
      setConfig({
        provider: 'google',
        model: 'gemini-2.0-flash-exp', // Newer model fallback
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

