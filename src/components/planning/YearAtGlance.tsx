import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Target, 
  Star,
  CheckCircle2,
  Circle,
  Plus,
  CalendarDays,
  Flower2,
  Sun,
  Leaf,
  Snowflake
} from "lucide-react";
import { cn } from "@/lib/utils";

interface YearGoal {
  id: string;
  title: string;
  quarter: 1 | 2 | 3 | 4;
  completed: boolean;
  area: string;
}

const sampleGoals: YearGoal[] = [
  { id: '1', title: 'Aprender novo idioma', quarter: 1, completed: true, area: 'Crescimento' },
  { id: '2', title: 'Ler 24 livros', quarter: 2, completed: false, area: 'Crescimento' },
  { id: '3', title: 'Correr meia maratona', quarter: 2, completed: false, area: 'Saúde' },
  { id: '4', title: 'Promoção no trabalho', quarter: 3, completed: false, area: 'Carreira' },
  { id: '5', title: 'Viajar para 3 países', quarter: 4, completed: false, area: 'Diversão' },
  { id: '6', title: 'Criar fundo emergência', quarter: 1, completed: true, area: 'Finanças' },
];

const quarters = [
  { id: 1, name: 'Q1', months: 'Jan - Mar', icon: Flower2, color: 'text-pink-500' },
  { id: 2, name: 'Q2', months: 'Abr - Jun', icon: Sun, color: 'text-yellow-500' },
  { id: 3, name: 'Q3', months: 'Jul - Set', icon: Leaf, color: 'text-orange-500' },
  { id: 4, name: 'Q4', months: 'Out - Dez', icon: Snowflake, color: 'text-blue-400' },
];

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function YearAtGlance() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [goals, setGoals] = useState<YearGoal[]>(sampleGoals);
  const currentMonth = new Date().getMonth();
  const currentQuarter = Math.floor(currentMonth / 3) + 1;

  const progress = Math.round((goals.filter(g => g.completed).length / goals.length) * 100);

  const toggleGoal = (id: string) => {
    setGoals(goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-card">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
            <CalendarDays className="h-5 w-5 text-primary" />
            Visão Anual
          </h3>
          <p className="text-sm text-muted-foreground">Seus objetivos e marcos do ano</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={() => setYear(year - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-16 text-center font-display text-xl font-bold text-foreground">
            {year}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={() => setYear(year + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Year progress */}
      <div className="mb-6 rounded-xl bg-muted/30 p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progresso do Ano</span>
          <span className="font-semibold text-foreground">{progress}% completo</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          {months.map((m, i) => (
            <span 
              key={m} 
              className={cn(
                "hidden sm:inline",
                i === currentMonth && "font-bold text-primary"
              )}
            >
              {m.slice(0, 1)}
            </span>
          ))}
        </div>
      </div>

      {/* Quarters */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {quarters.map((q) => {
          const quarterGoals = goals.filter(g => g.quarter === q.id);
          const completed = quarterGoals.filter(g => g.completed).length;
          const isCurrent = q.id === currentQuarter && year === new Date().getFullYear();
          const Icon = q.icon;

          return (
            <div
              key={q.id}
              className={cn(
                "rounded-xl border p-4 transition-all duration-200",
                isCurrent 
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                  : "border-border/50 bg-muted/20 hover:bg-muted/40"
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <Icon className={cn("h-6 w-6", q.color)} />
                {isCurrent && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    Atual
                  </span>
                )}
              </div>
              <h4 className="font-semibold text-foreground">{q.name}</h4>
              <p className="mb-2 text-xs text-muted-foreground">{q.months}</p>
              <div className="flex items-center gap-1 text-xs">
                <CheckCircle2 className="h-3 w-3 text-status-completed" />
                <span className="text-muted-foreground">
                  {completed}/{quarterGoals.length} metas
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Goals list */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="flex items-center gap-2 font-semibold text-foreground">
            <Target className="h-4 w-4 text-primary" />
            Metas do Ano
          </h4>
          <Button variant="ghost" size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Nova Meta
          </Button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className={cn(
                "flex items-start gap-3 rounded-xl p-3 transition-all duration-200",
                goal.completed 
                  ? "bg-status-completed/10" 
                  : "bg-muted/30 hover:bg-muted/50"
              )}
            >
              <button onClick={() => toggleGoal(goal.id)} className="mt-0.5">
                {goal.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-status-completed" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              <div className="flex-1">
                <p className={cn(
                  "text-sm font-medium",
                  goal.completed ? "text-muted-foreground line-through" : "text-foreground"
                )}>
                  {goal.title}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    Q{goal.quarter}
                  </span>
                  <span className="text-xs text-muted-foreground">{goal.area}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
