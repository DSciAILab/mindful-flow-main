import { Lightbulb } from "lucide-react";

export function IdeasPage() {
  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="mb-2 flex items-center gap-3 font-display text-2xl font-semibold text-foreground md:text-3xl">
          <Lightbulb className="h-8 w-8 text-primary" />
          Ideias
        </h1>
        <p className="text-muted-foreground">
          Capture e organize suas ideias criativas
        </p>
      </div>
      <div className="animate-fade-in rounded-2xl border border-border/50 bg-card p-8 text-center shadow-card" style={{ animationDelay: '100ms' }}>
        <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 font-semibold text-foreground">Em breve</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          O banco de ideias estará disponível em breve
        </p>
      </div>
    </div>
  );
}
