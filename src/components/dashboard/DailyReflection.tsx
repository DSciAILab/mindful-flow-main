import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Smile, 
  Meh, 
  Frown, 
  Sun, 
  Moon,
  Sparkles,
  ChevronRight,
  ThumbsUp,
  Heart,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DysfunctionalThoughtRecord } from "./DysfunctionalThoughtRecord";

interface DailyReflectionProps {
  onComplete: (reflection: { mood: number; gratitude: string }) => void;
}

const moodOptions = [
  { value: 5, icon: Heart, label: 'Ótimo', color: 'text-status-completed' },
  { value: 4, icon: ThumbsUp, label: 'Bem', color: 'text-primary' },
  { value: 3, icon: Meh, label: 'Ok', color: 'text-priority-medium' },
  { value: 2, icon: Frown, label: 'Meh', color: 'text-priority-high' },
  { value: 1, icon: Frown, label: 'Difícil', color: 'text-priority-urgent' },
];

const gratitudePrompts = [
  "O que te fez sorrir hoje?",
  "Qual foi uma pequena vitória?",
  "Quem você agradece hoje?",
  "O que funcionou bem?",
  "O que te inspirou?",
];

export function DailyReflection({ onComplete }: DailyReflectionProps) {
  const [mood, setMood] = useState<number | null>(null);
  const [gratitude, setGratitude] = useState("");
  const [showRPD, setShowRPD] = useState(false);
  const [showRPDOffer, setShowRPDOffer] = useState(false);
  const [currentPrompt] = useState(
    gratitudePrompts[Math.floor(Math.random() * gratitudePrompts.length)]
  );

  const handleMoodSelect = (value: number) => {
    setMood(value);
    if (value <= 2) {
      setShowRPDOffer(true);
    } else {
      setShowRPDOffer(false);
    }
  };

  const handleSubmit = () => {
    if (mood && gratitude.trim()) {
      onComplete({ mood, gratitude });
    }
  };

  const handleStartRPD = () => {
    setShowRPDOffer(false);
    setShowRPD(true);
  };

  const handleRPDComplete = () => {
    setShowRPD(false);
    // Continue with normal reflection
  };

  const handleRPDSkip = () => {
    setShowRPD(false);
    setShowRPDOffer(false);
  };

  const isEvening = new Date().getHours() >= 17;

  // Show RPD screen
  if (showRPD) {
    return (
      <DysfunctionalThoughtRecord 
        onComplete={handleRPDComplete} 
        onSkip={handleRPDSkip} 
      />
    );
  }

  // Show RPD offer
  if (showRPDOffer) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-card animate-fade-in">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <MessageCircle className="h-8 w-8 text-accent" />
          </div>
          <h3 className="font-display text-xl font-semibold text-foreground">
            Quer falar sobre isso?
          </h3>
          <p className="mt-2 text-muted-foreground">
            Parece que você não está se sentindo muito bem. 
            Podemos fazer um exercício juntos para entender melhor esses sentimentos.
          </p>
          <p className="mt-2 text-sm text-muted-foreground/80">
            É um registro de pensamento que ajuda a reorganizar ideias difíceis.
          </p>
        </div>
        
        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={handleStartRPD} className="w-full">
            <MessageCircle className="mr-2 h-4 w-4" />
            Sim, quero fazer o exercício
          </Button>
          <Button variant="ghost" onClick={handleRPDSkip} className="w-full">
            Agora não, só quero registrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        {isEvening ? (
          <Moon className="h-5 w-5 text-accent" />
        ) : (
          <Sun className="h-5 w-5 text-primary" />
        )}
        <h3 className="font-semibold text-foreground">
          {isEvening ? 'Reflexão da Noite' : 'Check-in do Dia'}
        </h3>
      </div>

      {/* Mood selector */}
      <div className="mb-4">
        <p className="mb-2 text-sm text-muted-foreground">Como você está se sentindo?</p>
        <div className="flex justify-between gap-2">
          {moodOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => handleMoodSelect(option.value)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-xl p-2 transition-all duration-200",
                  mood === option.value
                    ? "bg-primary/10 ring-2 ring-primary"
                    : "bg-muted/50 hover:bg-muted"
                )}
              >
                <Icon className={cn("h-6 w-6", option.color)} />
                <span className="text-xs text-muted-foreground">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Gratitude prompt */}
      <div className="mb-4">
        <p className="mb-2 flex items-center gap-1 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-reward-gold" />
          {currentPrompt}
        </p>
        <textarea
          value={gratitude}
          onChange={(e) => setGratitude(e.target.value)}
          placeholder="Escreva aqui..."
          className="min-h-20 w-full resize-none rounded-xl border border-border bg-background/50 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <Button
        variant="default"
        className="w-full"
        onClick={handleSubmit}
        disabled={!mood || !gratitude.trim()}
      >
        Salvar Reflexão
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
