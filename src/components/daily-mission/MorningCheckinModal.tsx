import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Sun, Moon, Sunrise, Sparkles, SkipForward } from "lucide-react";
import type { EnergyLevel } from "@/types/dailyMission";

interface MorningCheckinModalProps {
  isOpen: boolean;
  onComplete: (
    energyLevel: EnergyLevel,
    moodLevel: EnergyLevel,
    sleepQuality: EnergyLevel,
    notes?: string
  ) => void;
  onSkip: () => void;
}

// Emoji options for each level
const energyEmojis = ["😴", "😪", "😐", "😊", "⚡"];
const moodEmojis = ["😢", "😔", "😐", "🙂", "😄"];
const sleepEmojis = ["😵", "😣", "😐", "😌", "😴"];

const getGreeting = (): { message: string; icon: React.ReactNode } => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return { message: "Bom dia!", icon: <Sunrise className="h-8 w-8 text-orange-400" /> };
  } else if (hour >= 12 && hour < 18) {
    return { message: "Boa tarde!", icon: <Sun className="h-8 w-8 text-yellow-400" /> };
  } else {
    return { message: "Boa noite!", icon: <Moon className="h-8 w-8 text-indigo-400" /> };
  }
};

export function MorningCheckinModal({
  isOpen,
  onComplete,
  onSkip,
}: MorningCheckinModalProps) {
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(3);
  const [moodLevel, setMoodLevel] = useState<EnergyLevel>(3);
  const [sleepQuality, setSleepQuality] = useState<EnergyLevel>(3);
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const greeting = getGreeting();

  const handleComplete = () => {
    onComplete(energyLevel, moodLevel, sleepQuality, notes.trim() || undefined);
  };

  const renderEmojiSelector = (
    label: string,
    emojis: string[],
    value: EnergyLevel,
    onChange: (val: EnergyLevel) => void,
    description: string
  ) => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-medium text-foreground">{label}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex justify-center gap-3">
        {emojis.map((emoji, index) => {
          const level = (index + 1) as EnergyLevel;
          return (
            <button
              key={level}
              onClick={() => onChange(level)}
              className={cn(
                "w-14 h-14 rounded-full text-3xl flex items-center justify-center transition-all",
                "hover:scale-110 hover:bg-primary/10",
                value === level
                  ? "bg-primary/20 ring-2 ring-primary scale-110"
                  : "bg-muted/50"
              )}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return renderEmojiSelector(
          "Como está sua energia?",
          energyEmojis,
          energyLevel,
          setEnergyLevel,
          "Nível de disposição para o dia"
        );
      case 2:
        return renderEmojiSelector(
          "Qual é o seu humor?",
          moodEmojis,
          moodLevel,
          setMoodLevel,
          "Como você está se sentindo emocionalmente"
        );
      case 3:
        return renderEmojiSelector(
          "Como foi seu sono?",
          sleepEmojis,
          sleepQuality,
          setSleepQuality,
          "Qualidade do descanso noturno"
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-foreground">
                Algo mais em mente?
              </h3>
              <p className="text-sm text-muted-foreground">
                Opcional: anote qualquer pensamento ou intenção para o dia
              </p>
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Quero focar no projeto X, preciso descansar mais..."
              className="min-h-[100px] resize-none"
            />
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-md border-none bg-gradient-to-b from-background to-muted/30 p-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col items-center gap-2 text-center">
            {greeting.icon}
            <h2 className="text-2xl font-display font-semibold">
              {greeting.message}
            </h2>
            <p className="text-sm text-muted-foreground">
              Vamos preparar sua missão do dia
            </p>
          </div>

          {/* Progress indicators */}
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  s === step ? "bg-primary w-4" : s < step ? "bg-primary/60" : "bg-muted"
                )}
              />
            ))}
          </div>

          {/* Current step content */}
          <div className="w-full py-4">
            {renderStep()}
          </div>

          {/* Navigation buttons */}
          <div className="flex w-full gap-3">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep((s) => (s - 1) as typeof step)}
                className="flex-1"
              >
                Voltar
              </Button>
            )}
            
            {step < 4 ? (
              <Button
                onClick={() => setStep((s) => (s + 1) as typeof step)}
                className="flex-1"
              >
                Próximo
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                className="flex-1 gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Começar o dia
              </Button>
            )}
          </div>

          {/* Skip button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="text-muted-foreground"
          >
            <SkipForward className="h-4 w-4 mr-1" />
            Pular por hoje
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
