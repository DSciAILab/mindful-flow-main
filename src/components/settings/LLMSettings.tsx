import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Brain, 
  Key, 
  Eye, 
  EyeOff, 
  Check, 
  Loader2,
  ExternalLink,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LLMProvider {
  id: string;
  name: string;
  description: string;
  models: { id: string; name: string }[];
  apiKeyUrl?: string;
  apiKeyPlaceholder: string;
}

const providers: LLMProvider[] = [
  {
    id: 'lovable',
    name: 'Lovable AI (Padrão)',
    description: 'IA integrada, sem necessidade de chave API',
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Rápido)' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Avançado)' },
    ],
    apiKeyPlaceholder: '',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Acesso a GPT-4, Claude, Gemini e outros modelos',
    models: [
      { id: 'openai/gpt-4o', name: 'GPT-4o' },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
      { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku' },
      { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5' },
      { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B' },
      { id: 'mistralai/mixtral-8x7b-instruct', name: 'Mixtral 8x7B' },
    ],
    apiKeyUrl: 'https://openrouter.ai/keys',
    apiKeyPlaceholder: 'sk-or-v1-...',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-4o e outros modelos da OpenAI',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    ],
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    apiKeyPlaceholder: 'sk-...',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 3.5, Claude 3 e outros modelos',
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
    ],
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    apiKeyPlaceholder: 'sk-ant-...',
  },
  {
    id: 'google',
    name: 'Google AI',
    description: 'Gemini 2.5, 2.0 e outros modelos',
    models: [
      { id: 'gemini-2.5-pro-preview-05-06', name: 'Gemini 2.5 Pro (Preview)' },
      { id: 'gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash (Preview)' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    ],
    apiKeyUrl: 'https://aistudio.google.com/app/apikey',
    apiKeyPlaceholder: 'AIza...',
  },
];

export function LLMSettings() {
  const [selectedProvider, setSelectedProvider] = useState('lovable');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const currentProvider = providers.find(p => p.id === selectedProvider);
  const requiresApiKey = selectedProvider !== 'lovable';

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('mf_profiles')
        .select('llm_provider, llm_api_key, llm_model')
        .eq('id', user.id)
        .single();

      if (profile) {
        setSelectedProvider(profile.llm_provider || 'lovable');
        setSelectedModel(profile.llm_model || 'gemini-2.5-flash');
        setApiKey(profile.llm_api_key || '');
      }
    } catch (error) {
      console.error('Error loading LLM settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId);
    const provider = providers.find(p => p.id === providerId);
    if (provider && provider.models.length > 0) {
      setSelectedModel(provider.models[0].id);
    }
    if (providerId === 'lovable') {
      setApiKey('');
    }
  };

  const handleSave = async () => {
    if (requiresApiKey && !apiKey.trim()) {
      toast({
        title: "Chave API obrigatória",
        description: `Por favor, insira sua chave API do ${currentProvider?.name}`,
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para salvar as configurações",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('mf_profiles')
        .update({
          llm_provider: selectedProvider,
          llm_api_key: requiresApiKey ? apiKey : null,
          llm_model: selectedModel,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: "Suas preferências de IA foram atualizadas",
      });
    } catch (error) {
      console.error('Error saving LLM settings:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">
          Provedor de IA
        </Label>
        <Select value={selectedProvider} onValueChange={handleProviderChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione um provedor" />
          </SelectTrigger>
          <SelectContent>
            {providers.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{provider.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {provider.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Model Selection */}
      {currentProvider && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">
            Modelo
          </Label>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione um modelo" />
            </SelectTrigger>
            <SelectContent>
              {currentProvider.models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* API Key Input */}
      {requiresApiKey && currentProvider && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-foreground">
              Chave API
            </Label>
            {currentProvider.apiKeyUrl && (
              <a
                href={currentProvider.apiKeyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Obter chave
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={currentProvider.apiKeyPlaceholder}
              className="pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showApiKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>
              Sua chave API é armazenada de forma segura no seu perfil. 
              Nunca compartilhe suas chaves com terceiros.
            </p>
          </div>
        </div>
      )}

      {/* Lovable AI Info */}
      {!requiresApiKey && (
        <div className="rounded-xl bg-primary/10 p-4">
          <div className="flex items-start gap-3">
            <Check className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Lovable AI Ativo</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Você está usando a IA integrada do Lovable. Não é necessário 
                configurar chaves de API externas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <Button 
        onClick={handleSave} 
        disabled={isSaving}
        className="w-full"
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <Check className="mr-2 h-4 w-4" />
            Salvar Configurações
          </>
        )}
      </Button>
    </div>
  );
}
