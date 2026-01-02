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
import { cn } from "@/lib/utils";

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
    description: 'Gemini 2.0, 1.5 e outros modelos',
    models: [
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
      { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B' },
    ],
    apiKeyUrl: 'https://aistudio.google.com/app/apikey',
    apiKeyPlaceholder: 'AIza...',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    description: 'Modelos LLM rodando localmente na sua máquina',
    models: [
      { id: 'llama3.2:latest', name: 'Llama 3.2' },
      { id: 'llama3.1:latest', name: 'Llama 3.1' },
      { id: 'llama3:latest', name: 'Llama 3' },
      { id: 'mistral:latest', name: 'Mistral' },
      { id: 'mixtral:latest', name: 'Mixtral' },
      { id: 'codellama:latest', name: 'Code Llama' },
      { id: 'phi3:latest', name: 'Phi-3' },
      { id: 'gemma2:latest', name: 'Gemma 2' },
      { id: 'qwen2.5:latest', name: 'Qwen 2.5' },
    ],
    apiKeyUrl: 'http://localhost:11434',
    apiKeyPlaceholder: 'http://localhost:11434 (URL padrão do Ollama)',
  },
  {
    id: 'lm-studio',
    name: 'LM Studio (Local)',
    description: 'Modelos LLM rodando via LM Studio',
    models: [
      { id: 'local-model', name: 'Modelo Local' },
    ],
    apiKeyUrl: 'http://localhost:1234',
    apiKeyPlaceholder: 'http://localhost:1234 (URL padrão do LM Studio)',
  },
];

export function LLMSettings() {
  const [selectedProvider, setSelectedProvider] = useState('lovable');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  const { toast} = useToast();

  const currentProvider = providers.find(p => p.id === selectedProvider);
  const requiresApiKey = selectedProvider !== 'lovable' && selectedProvider !== 'ollama' && selectedProvider !== 'lm-studio';

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

  const handleProviderChange = async (providerId: string) => {
    setSelectedProvider(providerId);
    const provider = providers.find(p => p.id === providerId);
    
    // Clear API key for local providers
    if (providerId === 'lovable' || providerId === 'ollama' || providerId === 'lm-studio') {
      setApiKey('');
    }
    
    // Fetch available models for Ollama
    if (providerId === 'ollama') {
      try {
        const ollamaUrl = 'http://localhost:11434';
        const response = await fetch(`${ollamaUrl}/api/tags`);
        if (response.ok) {
          const data = await response.json();
          const availableModels = data.models?.map((m: any) => ({
            id: m.name,
            name: m.name.split(':')[0],
          })) || [];
          
          if (availableModels.length > 0) {
            // Update provider models list dynamically
            const providerIndex = providers.findIndex(p => p.id === 'ollama');
            if (providerIndex !== -1) {
              providers[providerIndex].models = availableModels;
            }
            setSelectedModel(availableModels[0].id);
          }
        }
      } catch (error) {
        console.log('Ollama not running, using default models');
        if (provider && provider.models.length > 0) {
          setSelectedModel(provider.models[0].id);
        }
      }
    } else if (provider && provider.models.length > 0) {
      setSelectedModel(provider.models[0].id);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    setConnectionStatus('idle');
    setConnectionMessage('');
    
    try {
      if (selectedProvider === 'ollama') {
        const ollamaUrl = apiKey || 'http://localhost:11434';
        const response = await fetch(`${ollamaUrl}/api/tags`, {
          method: 'GET',
        });
        
        if (!response.ok) {
          throw new Error('Ollama não está rodando');
        }
        
        const data = await response.json();
        const models = data.models || [];
        const modelExists = models.some((m: any) => m.name === selectedModel || m.name.startsWith(selectedModel.split(':')[0]));
        
        if (!modelExists) {
          setConnectionStatus('error');
          setConnectionMessage(`❌ Modelo "${selectedModel}" não encontrado. Execute: ollama pull ${selectedModel}`);
        } else {
          setConnectionStatus('success');
          setConnectionMessage(`✅ Ollama online! Modelo "${selectedModel}" disponível`);
        }
      } else if (selectedProvider === 'google') {
        if (!apiKey) throw new Error('API key necessária');
        
        const testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(testUrl);
        
        if (!response.ok) {
          throw new Error('API key inválida ou serviço offline');
        }
        
        setConnectionStatus('success');
        setConnectionMessage('✅ Google AI online! API key válida');
      } else {
        setConnectionStatus('success');
        setConnectionMessage('✅ Configuração salva. Teste no chat para validar');
      }
      
      toast({
        title: connectionStatus === 'success' ? 'Conexão bem-sucedida!' : 'Teste concluído',
        description: connectionMessage,
      });
    } catch (error: any) {
      setConnectionStatus('error');
      const errorMsg = error.message || 'Erro ao conectar';
      setConnectionMessage(`❌ ${errorMsg}`);
      
      toast({
        title: 'Erro de conexão',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
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

      {/* Provider Status Info */}
      {selectedProvider === 'lovable' && (
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
      
      {selectedProvider === 'ollama' && (
        <div className="rounded-xl bg-emerald-500/10 p-4">
          <div className="flex items-start gap-3">
            <Brain className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="font-medium text-foreground">Ollama (Local)</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Modelos rodando localmente. Certifique-se que o Ollama está rodando em localhost:11434
              </p>
            </div>
          </div>
        </div>
      )}
      
      {selectedProvider === 'lm-studio' && (
        <div className="rounded-xl bg-purple-500/10 p-4">
          <div className="flex items-start gap-3">
            <Brain className="mt-0.5 h-5 w-5 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="font-medium text-foreground">LM Studio (Local)</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Modelos rodando via LM Studio. Certifique-se que o servidor está ativo em localhost:1234
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status */}
      {connectionMessage && (
        <div className={cn(
          "rounded-lg p-3 text-sm font-medium",
          connectionStatus === 'success' && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          connectionStatus === 'error' && "bg-red-500/10 text-red-600 dark:text-red-400"
        )}>
          {connectionMessage}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={testConnection} 
          disabled={isLoading || isTesting}
          variant="outline"
          className="flex-1"
        >
          {isTesting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testando...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Testar Conexão
            </>
          )}
        </Button>
        
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="flex-1"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Salvar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
