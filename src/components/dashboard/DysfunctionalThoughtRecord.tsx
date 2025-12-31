import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  Heart, 
  Lightbulb, 
  ArrowRight,
  MessageCircle,
  Sparkles,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DysfunctionalThoughtRecordProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface RPDData {
  situation: string;
  automaticThought: string;
  emotion: string;
  emotionIntensity: number;
  evidence: string;
  counterEvidence: string;
  balancedThought: string;
  newEmotionIntensity: number;
}

const steps = [
  { id: 'situation', title: 'Situação', icon: MessageCircle, question: 'O que aconteceu? Descreva a situação que te deixou assim.' },
  { id: 'thought', title: 'Pensamento', icon: Brain, question: 'Qual pensamento passou pela sua cabeça nesse momento?' },
  { id: 'emotion', title: 'Emoção', icon: Heart, question: 'Que emoção você sentiu? Qual a intensidade (1-10)?' },
  { id: 'evidence', title: 'Evidências a favor', icon: Lightbulb, question: 'Quais evidências apoiam esse pensamento?' },
  { id: 'counter', title: 'Evidências contra', icon: Lightbulb, question: 'Quais evidências vão contra esse pensamento?' },
  { id: 'balanced', title: 'Pensamento equilibrado', icon: Sparkles, question: 'Qual seria um pensamento mais equilibrado e realista?' },
];

const emotions = [
  'Tristeza', 'Ansiedade', 'Raiva', 'Frustração', 'Medo', 
  'Culpa', 'Vergonha', 'Solidão', 'Desânimo', 'Outro'
];

export function DysfunctionalThoughtRecord({ onComplete, onSkip }: DysfunctionalThoughtRecordProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<RPDData>({
    situation: '',
    automaticThought: '',
    emotion: '',
    emotionIntensity: 5,
    evidence: '',
    counterEvidence: '',
    balancedThought: '',
    newEmotionIntensity: 5,
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const isStepComplete = () => {
    switch (currentStep) {
      case 0: return data.situation.trim().length > 0;
      case 1: return data.automaticThought.trim().length > 0;
      case 2: return data.emotion.trim().length > 0;
      case 3: return data.evidence.trim().length > 0;
      case 4: return data.counterEvidence.trim().length > 0;
      case 5: return data.balancedThought.trim().length > 0;
      default: return false;
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    
    switch (currentStep) {
      case 0:
        return (
          <textarea
            value={data.situation}
            onChange={(e) => setData(prev => ({ ...prev, situation: e.target.value }))}
            placeholder="Ex: Recebi uma crítica no trabalho..."
            className="min-h-32 w-full resize-none rounded-xl border border-border bg-background/50 p-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        );
      case 1:
        return (
          <textarea
            value={data.automaticThought}
            onChange={(e) => setData(prev => ({ ...prev, automaticThought: e.target.value }))}
            placeholder="Ex: Eu sou incompetente, nunca faço nada certo..."
            className="min-h-32 w-full resize-none rounded-xl border border-border bg-background/50 p-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {emotions.map((emotion) => (
                <button
                  key={emotion}
                  onClick={() => setData(prev => ({ ...prev, emotion }))}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm transition-all",
                    data.emotion === emotion
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {emotion}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Intensidade: {data.emotionIntensity}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={data.emotionIntensity}
                onChange={(e) => setData(prev => ({ ...prev, emotionIntensity: parseInt(e.target.value) }))}
                className="w-full accent-primary"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <textarea
            value={data.evidence}
            onChange={(e) => setData(prev => ({ ...prev, evidence: e.target.value }))}
            placeholder="Liste fatos que apoiam esse pensamento..."
            className="min-h-32 w-full resize-none rounded-xl border border-border bg-background/50 p-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        );
      case 4:
        return (
          <textarea
            value={data.counterEvidence}
            onChange={(e) => setData(prev => ({ ...prev, counterEvidence: e.target.value }))}
            placeholder="Liste fatos que contradizem esse pensamento..."
            className="min-h-32 w-full resize-none rounded-xl border border-border bg-background/50 p-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        );
      case 5:
        return (
          <div className="space-y-4">
            <textarea
              value={data.balancedThought}
              onChange={(e) => setData(prev => ({ ...prev, balancedThought: e.target.value }))}
              placeholder="Considerando tudo, um pensamento mais equilibrado seria..."
              className="min-h-32 w-full resize-none rounded-xl border border-border bg-background/50 p-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Como você se sente agora? {data.newEmotionIntensity}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={data.newEmotionIntensity}
                onChange={(e) => setData(prev => ({ ...prev, newEmotionIntensity: parseInt(e.target.value) }))}
                className="w-full accent-primary"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-card animate-fade-in">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
          <Brain className="h-6 w-6 text-accent" />
        </div>
        <h3 className="font-display text-xl font-semibold text-foreground">
          Registro de Pensamento
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Vamos trabalhar esse sentimento juntos
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6 flex gap-1">
        {steps.map((step, idx) => (
          <div
            key={step.id}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all",
              idx <= currentStep ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Step indicator */}
      <div className="mb-4 flex items-center gap-2">
        {(() => {
          const Icon = steps[currentStep].icon;
          return <Icon className="h-5 w-5 text-primary" />;
        })()}
        <span className="text-sm font-medium text-foreground">
          {steps[currentStep].title}
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          {currentStep + 1}/{steps.length}
        </span>
      </div>

      {/* Question */}
      <p className="mb-4 text-muted-foreground">
        {steps[currentStep].question}
      </p>

      {/* Content */}
      <div className="mb-6">
        {renderStepContent()}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {currentStep > 0 && (
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Voltar
            </Button>
          )}
          {currentStep === 0 && (
            <Button variant="ghost" size="sm" onClick={onSkip}>
              Agora não
            </Button>
          )}
        </div>
        <Button
          onClick={handleNext}
          disabled={!isStepComplete()}
        >
          {currentStep === steps.length - 1 ? 'Concluir' : 'Próximo'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
