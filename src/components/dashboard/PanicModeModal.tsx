import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  X, 
  Wind, 
  Heart, 
  ListChecks, 
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Brain
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PanicModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const breathingSteps = [
  { text: "Inspire...", duration: 4000 },
  { text: "Segure...", duration: 4000 },
  { text: "Expire...", duration: 4000 },
];

const groudningSteps = [
  "5 coisas que você pode VER",
  "4 coisas que você pode TOCAR",
  "3 coisas que você pode OUVIR",
  "2 coisas que você pode CHEIRAR",
  "1 coisa que você pode SENTIR",
];

const nextActions = [
  "Qual é a ÚNICA coisa mais importante agora?",
  "O que você pode fazer em 2 minutos?",
  "O que pode esperar até amanhã?",
];

type Stage = 'welcome' | 'breathing' | 'grounding' | 'action' | 'complete';

export function PanicModeModal({ isOpen, onClose }: PanicModeModalProps) {
  const [stage, setStage] = useState<Stage>('welcome');
  const [breathingStep, setBreathingStep] = useState(0);
  const [groundingStep, setGroundingStep] = useState(0);
  const [isBreathing, setIsBreathing] = useState(false);

  if (!isOpen) return null;

  const startBreathing = () => {
    setStage('breathing');
    setIsBreathing(true);
    setBreathingStep(0);

    let step = 0;
    const cycle = () => {
      if (step < 9) {
        setBreathingStep(step % 3);
        step++;
        setTimeout(cycle, breathingSteps[step % 3].duration);
      } else {
        setIsBreathing(false);
        setStage('grounding');
      }
    };
    setTimeout(cycle, breathingSteps[0].duration);
  };

  const handleGroundingNext = () => {
    if (groundingStep < groudningSteps.length - 1) {
      setGroundingStep(groundingStep + 1);
    } else {
      setStage('action');
    }
  };

  const handleComplete = () => {
    setStage('complete');
    setTimeout(() => {
      onClose();
      setStage('welcome');
      setBreathingStep(0);
      setGroundingStep(0);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md animate-scale-in rounded-3xl bg-card p-6 shadow-2xl border border-border">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4"
          onClick={() => {
            onClose();
            setStage('welcome');
          }}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Welcome Stage */}
        {stage === 'welcome' && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
              <Heart className="h-8 w-8 text-accent" />
            </div>
            <h2 className="mb-2 font-display text-2xl font-semibold text-foreground">
              Respire Fundo
            </h2>
            <p className="mb-6 text-muted-foreground">
              Está tudo bem. Vou te guiar passo a passo para recuperar o controle.
            </p>
            <Button 
              variant="calm" 
              size="lg" 
              className="w-full"
              onClick={startBreathing}
            >
              <Wind className="mr-2 h-5 w-5" />
              Começar Respiração
            </Button>
          </div>
        )}

        {/* Breathing Stage */}
        {stage === 'breathing' && (
          <div className="text-center">
            <div className={cn(
              "mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-accent/20 transition-transform duration-1000",
              isBreathing && breathingStep === 0 && "scale-125",
              isBreathing && breathingStep === 1 && "scale-125",
              isBreathing && breathingStep === 2 && "scale-100",
            )}>
              <Wind className="h-12 w-12 text-accent" />
            </div>
            <h2 className="mb-2 font-display text-3xl font-semibold text-foreground">
              {breathingSteps[breathingStep].text}
            </h2>
            <p className="text-muted-foreground">
              Siga o ritmo do círculo
            </p>
          </div>
        )}

        {/* Grounding Stage */}
        {stage === 'grounding' && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mb-2 font-display text-xl font-semibold text-foreground">
              Técnica 5-4-3-2-1
            </h2>
            <p className="mb-6 text-muted-foreground">
              Observe ao seu redor e identifique:
            </p>
            <div className="mb-6 rounded-xl bg-muted/50 p-4">
              <p className="text-lg font-medium text-foreground">
                {groudningSteps[groundingStep]}
              </p>
            </div>
            <div className="mb-4 flex justify-center gap-1">
              {groudningSteps.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-2 w-2 rounded-full transition-colors",
                    i <= groundingStep ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
            <Button 
              variant="default" 
              size="lg" 
              className="w-full"
              onClick={handleGroundingNext}
            >
              Próximo
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Action Stage */}
        {stage === 'action' && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
              <ListChecks className="h-8 w-8 text-accent" />
            </div>
            <h2 className="mb-2 font-display text-xl font-semibold text-foreground">
              Uma Coisa de Cada Vez
            </h2>
            <p className="mb-6 text-muted-foreground">
              Vamos simplificar. Pense:
            </p>
            <div className="mb-6 space-y-3">
              {nextActions.map((action, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-muted/50 p-3 text-left"
                >
                  <p className="text-sm font-medium text-foreground">{action}</p>
                </div>
              ))}
            </div>
            <Button 
              variant="calm" 
              size="lg" 
              className="w-full"
              onClick={handleComplete}
            >
              Estou Pronto
              <CheckCircle2 className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Complete Stage */}
        {stage === 'complete' && (
          <div className="text-center py-8">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-status-completed/10">
              <CheckCircle2 className="h-10 w-10 text-status-completed" />
            </div>
            <h2 className="mb-2 font-display text-2xl font-semibold text-foreground">
              Você Conseguiu!
            </h2>
            <p className="text-muted-foreground">
              Lembre-se: um passo de cada vez.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
