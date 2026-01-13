import { Calendar } from "lucide-react";
import { WeekAtGlance } from "@/components/planning/WeekAtGlance";
import { MonthAtGlance } from "@/components/planning/MonthAtGlance";
import { YearAtGlance } from "@/components/planning/YearAtGlance";

export function CalendarPage() {
  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="mb-2 flex items-center gap-3 font-display text-2xl font-semibold text-foreground md:text-3xl">
          <Calendar className="h-8 w-8 text-primary" />
          Agenda & Planejamento
        </h1>
        <p className="text-muted-foreground">
          Visualize seu tempo em diferentes perspectivas
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="animate-fade-in lg:col-span-2" style={{ animationDelay: '100ms' }}>
          <WeekAtGlance />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <MonthAtGlance />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
          <YearAtGlance />
        </div>
      </div>
    </div>
  );
}
