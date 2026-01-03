import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Bot, 
  Check, 
  Loader2,
  FileJson,
  Sparkles,
  AlertCircle,
  Copy,
  RotateCcw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Default Jarvis TDAH persona
const defaultPersona = {
  "jarvis_tdah_agent_advanced": {
    "identity": {
      "name": "Jarvis Cognitivo TDAH Avançado",
      "persona": "Agente executivo para neurodivergentes, especialista em TDAH e dupla excepcionalidade. Atua como mentor, copiloto e gerente de funções executivas.",
      "references": [
        "Russell Barkley",
        "Edward Hallowell",
        "John Ratey",
        "Ari Tuckman",
        "Linda Kreger Silverman",
        "David A. Clark",
        "Aaron T. Beck",
        "Daniel Kahneman",
        "John Sweller"
      ],
      "principles": {
        "minimize_cognitive_load": true,
        "adapt_to_energy_levels": true,
        "micro_progress_over_perfection": true,
        "reinforce_strengths": true,
        "neutral_tone": true,
        "no_diagnosis_or_prescription": true,
        "decision_assist": true,
        "real_time_reorganization": true
      }
    },
    "brain_dump_module": {
      "description": "Transforma entradas soltas do usuário em tarefas, projetos ou insights/reflexões, priorizando energia, foco e histórico de procrastinação.",
      "features": {
        "automatic_breakdown": true,
        "project_assignment": true,
        "micro_task_suggestion": true,
        "energy_aware_prioritization": true,
        "ttc_reflection_prompts": true,
        "pause_suggestions": true,
        "real_time_reorganization": true,
        "decision_assist": true
      }
    },
    "real_time_agent_features": {
      "mode_focus": {
        "description": "Identifica tarefas a serem concluídas durante o pico de energia/foco",
        "adaptive_timers": true,
        "micro_block_allocation": true
      },
      "mode_recovery": {
        "description": "Reduz fricção quando energia ou foco estão baixos",
        "task_simplification": true,
        "pause_recommendations": true,
        "decision_assist_enabled": true
      },
      "mode_decision_assist": {
        "description": "Se usuário travado, sugere próxima ação ou reorganiza tarefas automaticamente",
        "automatic_reprioritization": true,
        "micro_task_split": true
      },
      "reinforcement_and_feedback": {
        "micro_rewards": true,
        "progress_validation": true,
        "positive_reinforcement": true
      }
    }
  }
};

export function AIPersonaSettings() {
  const [personaJson, setPersonaJson] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(true);
  const [validationError, setValidationError] = useState('');
  const { toast } = useToast();

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
        .select('ai_persona_config')
        .eq('id', user.id)
        .single();

      if (profile?.ai_persona_config) {
        setPersonaJson(JSON.stringify(profile.ai_persona_config, null, 2));
      } else {
        // Set default persona
        setPersonaJson(JSON.stringify(defaultPersona, null, 2));
      }
    } catch (error) {
      console.error('Error loading AI persona settings:', error);
      // Set default on error
      setPersonaJson(JSON.stringify(defaultPersona, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const validateJson = (json: string): boolean => {
    try {
      JSON.parse(json);
      setIsValid(true);
      setValidationError('');
      return true;
    } catch (e: any) {
      setIsValid(false);
      setValidationError(e.message);
      return false;
    }
  };

  const handleJsonChange = (value: string) => {
    setPersonaJson(value);
    validateJson(value);
  };

  const handleSave = async () => {
    if (!validateJson(personaJson)) {
      toast({
        title: "JSON inválido",
        description: "Por favor, corrija os erros no JSON antes de salvar",
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

      const parsedJson = JSON.parse(personaJson);

      const { error } = await supabase
        .from('mf_profiles')
        .update({
          ai_persona_config: parsedJson,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Persona salva",
        description: "A configuração do agente IA foi atualizada",
      });
    } catch (error) {
      console.error('Error saving AI persona:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a configuração da persona",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPersonaJson(JSON.stringify(defaultPersona, null, 2));
    setIsValid(true);
    setValidationError('');
    toast({
      title: "Persona restaurada",
      description: "A configuração padrão foi restaurada",
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(personaJson);
      toast({
        title: "Copiado!",
        description: "JSON copiado para a área de transferência",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o JSON",
        variant: "destructive",
      });
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(personaJson);
      setPersonaJson(JSON.stringify(parsed, null, 2));
      setIsValid(true);
      setValidationError('');
    } catch (e) {
      // Keep as is if invalid
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
      {/* Header Info */}
      <div className="rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 p-4">
        <div className="flex items-start gap-3">
          <Bot className="mt-0.5 h-5 w-5 text-violet-600 dark:text-violet-400" />
          <div>
            <p className="font-medium text-foreground">Persona do Agente IA</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Defina como o chatbot deve se comportar. Cole um JSON com a configuração 
              de identidade, princípios e funcionalidades do agente.
            </p>
          </div>
        </div>
      </div>

      {/* JSON Editor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-foreground flex items-center gap-2">
            <FileJson className="h-4 w-4" />
            Configuração JSON da Persona
          </Label>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 px-2"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={formatJson}
              className="h-8 px-2"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Textarea
          value={personaJson}
          onChange={(e) => handleJsonChange(e.target.value)}
          placeholder='{"identity": { "name": "Jarvis", ... }}'
          className={cn(
            "min-h-[300px] font-mono text-xs leading-relaxed resize-y",
            !isValid && "border-red-500 focus-visible:ring-red-500"
          )}
        />

        {/* Validation Status */}
        {!isValid && validationError && (
          <div className="flex items-start gap-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-medium">JSON inválido</p>
              <p className="mt-1 font-mono">{validationError}</p>
            </div>
          </div>
        )}

        {isValid && personaJson && (
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
            <Check className="h-4 w-4" />
            <span>JSON válido</span>
          </div>
        )}
      </div>

      {/* Persona Preview */}
      {isValid && personaJson && (
        <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
          <h4 className="text-sm font-medium text-foreground mb-2">Preview da Persona</h4>
          {(() => {
            try {
              const parsed = JSON.parse(personaJson);
              const agentKey = Object.keys(parsed)[0];
              const agent = parsed[agentKey];
              return (
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><span className="font-medium text-foreground">Nome:</span> {agent?.identity?.name || 'Não definido'}</p>
                  <p><span className="font-medium text-foreground">Persona:</span> {agent?.identity?.persona || 'Não definida'}</p>
                  {agent?.identity?.references && (
                    <p><span className="font-medium text-foreground">Referências:</span> {agent.identity.references.slice(0, 3).join(', ')}...</p>
                  )}
                </div>
              );
            } catch {
              return null;
            }
          })()}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={handleReset} 
          variant="outline"
          className="flex-1"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Restaurar Padrão
        </Button>
        
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !isValid}
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
              Salvar Persona
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
