import { Brain } from "lucide-react";
import { DailyReflection } from "@/components/dashboard/DailyReflection";

interface ReflectionPageProps {
  handleReflectionComplete: (reflection: { mood: number; gratitude: string }) => void;
}

export function ReflectionPage({ handleReflectionComplete }: ReflectionPageProps) {
  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="mb-2 flex items-center gap-3 font-display text-2xl font-semibold text-foreground md:text-3xl">
          <Brain className="h-8 w-8 text-primary" />
          Reflexões
        </h1>
        <p className="text-muted-foreground">
          Momento de autocuidado e autoconhecimento
        </p>
      </div>
      <div className="mx-auto max-w-lg animate-fade-in" style={{ animationDelay: '100ms' }}>
        <DailyReflection onComplete={handleReflectionComplete} />
      </div>
    </div>
  );
}
