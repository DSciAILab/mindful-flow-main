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

        {/* Breathing Stage - Full screen immersive */}
        {stage === 'breathing' && (
          <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-background">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-accent/10" />
            
            {/* Central breathing circle */}
            <div className="relative flex items-center justify-center">
              {/* Outer glow ring */}
              <div 
                className={cn(
                  "absolute rounded-full bg-accent/20 blur-3xl transition-all",
                  breathingStep === 0 && "w-[400px] max-w-[90vw] h-[400px] max-h-[90vw] opacity-60", // Inspire - expande
                  breathingStep === 1 && "w-[400px] max-w-[90vw] h-[400px] max-h-[90vw] opacity-40", // Segure - mantém
                  breathingStep === 2 && "w-[200px] h-[200px] opacity-20", // Expire - contrai
                )}
                style={{ 
                  transitionDuration: breathingStep === 0 ? '4s' : breathingStep === 1 ? '0.5s' : '4s',
                  transitionTimingFunction: 'ease-in-out'
                }}
              />
              
              {/* Middle ring */}
              <div 
                className={cn(
                  "absolute rounded-full border-4 border-accent/30 transition-all",
                  breathingStep === 0 && "w-64 h-64", // Inspire
                  breathingStep === 1 && "w-64 h-64", // Segure
                  breathingStep === 2 && "w-32 h-32", // Expire
                )}
                style={{ 
                  transitionDuration: breathingStep === 0 ? '4s' : breathingStep === 1 ? '0.5s' : '4s',
                  transitionTimingFunction: 'ease-in-out'
                }}
              />
              
              {/* Main breathing circle */}
              <div 
                className={cn(
                  "relative rounded-full bg-gradient-to-br from-accent/40 to-accent/20 shadow-2xl",
                  "flex items-center justify-center transition-all",
                  breathingStep === 0 && "w-48 h-48 shadow-accent/30", // Inspire - expande
                  breathingStep === 1 && "w-48 h-48 shadow-accent/20", // Segure - mantém
                  breathingStep === 2 && "w-24 h-24 shadow-accent/10", // Expire - contrai
                )}
                style={{ 
                  transitionDuration: breathingStep === 0 ? '4s' : breathingStep === 1 ? '0.5s' : '4s',
                  transitionTimingFunction: 'ease-in-out',
                  boxShadow: breathingStep === 1 
                    ? '0 0 60px 20px rgba(var(--accent-rgb, 120, 200, 180), 0.3)' 
                    : breathingStep === 0
                      ? '0 0 80px 30px rgba(var(--accent-rgb, 120, 200, 180), 0.4)'
                      : '0 0 30px 10px rgba(var(--accent-rgb, 120, 200, 180), 0.2)'
                }}
              >
                <Wind className={cn(
                  "text-accent transition-all",
                  breathingStep === 2 ? "h-8 w-8" : "h-12 w-12"
                )} 
                style={{ transitionDuration: '4s' }}
                />
              </div>
            </div>

            {/* Text instruction */}
            <div className="mt-12 text-center">
              <h2 className="font-display text-4xl font-semibold text-foreground mb-2">
                {breathingSteps[breathingStep].text}
              </h2>
              <p className="text-muted-foreground">
                Siga o ritmo do círculo
              </p>
            </div>

            {/* Progress dots */}
            <div className="absolute bottom-8 flex items-center gap-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all duration-500",
                    breathingStep === i ? "bg-accent scale-125" : "bg-muted"
                  )}
                />
              ))}
            </div>

            {/* Skip button */}
            <Button
              variant="ghost"
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setIsBreathing(false);
                setStage('grounding');
              }}
            >
              <X className="h-5 w-5 mr-2" />
              Pular
            </Button>
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
