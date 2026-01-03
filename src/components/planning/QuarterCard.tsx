import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  ChevronUp, 
  ListTodo, 
  Plus, 
  CheckCircle2, 
  Circle,
  Pencil,
  Trash2,
  FolderKanban
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LifeAreaBadge } from "@/components/ui/LifeAreaBadge";
import type { Project } from "@/types";
import { AnnualGoal } from "@/hooks/useAnnualGoals";
import { LIFE_AREAS } from "@/lib/lifeAreas";

interface QuarterCardProps {
  id: number | string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  goals: AnnualGoal[];
  projects: Project[];
  onAddGoal: () => void;
  onEditGoal: (goal: AnnualGoal) => void;
  onDeleteGoal: (goalId: string) => void;
  onToggleComplete: (goalId: string) => void;
  isCurrent?: boolean;
}

export function QuarterCard({
  id,
  title,
  subtitle,
  icon: Icon,
  color,
  bgColor,
  goals,
  projects,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  onToggleComplete,
  isCurrent
}: QuarterCardProps) {
  const [isOpen, setIsOpen] = useState(isCurrent || false);
  
  const completedGoals = goals.filter(g => g.status === 'completed');
  const progress = goals.length > 0 
    ? Math.round((completedGoals.length / goals.length) * 100) 
    : 0;

  const getAreaInfo = (areaId?: string) => {
    return LIFE_AREAS.find(a => a.id === areaId);
  };

  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        isCurrent ? "border-primary/50 ring-1 ring-primary/20" : "hover:border-primary/30"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
             <div 
              className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", bgColor)}
            >
              <Icon className={cn("h-5 w-5", color)} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground truncate">{title}</h3>
                {isCurrent && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary uppercase tracking-wider">
                    Atual
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
             <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground justify-end">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{completedGoals.length}/{goals.length} metas</span>
             </div>
          </div>
        </div>

        {/* Progress section */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
             <span className="text-muted-foreground">Progresso</span>
             <span className={cn("font-medium", color)}>
              {progress}%
            </span>
          </div>
          <Progress 
            value={progress} 
            className="h-1.5"
          />
        </div>

        {/* Collapsible Content */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-4">
          <CollapsibleTrigger asChild>
             <Button 
              variant="ghost" 
              size="sm" 
              className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent text-xs text-muted-foreground hover:text-foreground group"
            >
              <span className="flex items-center gap-1.5">
                <ListTodo className="h-3.5 w-3.5" />
                {isOpen ? "Ocultar metas" : "Ver metas"}
              </span>
              {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-3 space-y-2">
             {goals.length === 0 ? (
               <p className="text-xs text-muted-foreground italic pl-1">Nenhuma meta definida.</p>
             ) : (
               <div className="space-y-1">
                 {goals.map(goal => {
                   const area = getAreaInfo(goal.areaId);
                   const linkedProjects = projects.filter(p => p.goalId === goal.id);
                   const isCompleted = goal.status === 'completed';

                   return (
                     <div key={goal.id} className="group flex items-center gap-3 rounded-lg bg-muted/30 p-2 text-sm hover:bg-muted/50 transition-colors">
                        <button 
                          onClick={() => onToggleComplete(goal.id)} 
                          className="flex-shrink-0 mt-0.5"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-status-completed" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground group-hover:text-status-completed transition-colors" />
                          )}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                           <p className={cn(
                             "font-medium truncate",
                             isCompleted && "line-through text-muted-foreground"
                           )}>
                             {goal.title}
                           </p>
                           <div className="flex items-center gap-2 flex-wrap mt-1">
                              {area && (
                                <span 
                                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                                  style={{ backgroundColor: `${area.color}20`, color: area.color }}
                                >
                                  {area.name}
                                </span>
                              )}
                              {linkedProjects.map(p => (
                                <span key={p.id} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground rounded-md bg-background/50 px-1 py-0.5">
                                  <FolderKanban className="h-3 w-3" style={{ color: p.color }} />
                                  {p.name}
                                </span>
                              ))}
                           </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon-sm" className="h-6 w-6" onClick={() => onEditGoal(goal)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                             <Button variant="ghost" size="icon-sm" className="h-6 w-6 hover:text-destructive" onClick={() => onDeleteGoal(goal.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                     </div>
                   );
                 })}
               </div>
             )}

             <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border/50 hover:border-primary/50"
                onClick={onAddGoal}
              >
                <Plus className="h-3 w-3 mr-1" />
                Nova Meta
              </Button>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
