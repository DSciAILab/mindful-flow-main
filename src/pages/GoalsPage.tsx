import { Target } from "lucide-react";
import { WheelOfLife } from "@/components/planning/WheelOfLife";
import { YearAtGlance } from "@/components/planning/YearAtGlance";
import { useToast } from "@/hooks/use-toast";

export function GoalsPage() {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="mb-2 flex items-center gap-3 font-display text-2xl font-semibold text-foreground md:text-3xl">
          <Target className="h-8 w-8 text-primary" />
          Objetivos & Planejamento
        </h1>
        <p className="text-muted-foreground">
          Visualize e planeje sua vida com clareza
        </p>
      </div>
      <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
        <WheelOfLife onSave={() => toast({ title: "Roda da Vida salva!" })} />
      </div>
      <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
        <YearAtGlance />
      </div>
    </div>
  );
}
