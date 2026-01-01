"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ParsedTask } from "@/utils/taskParser";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Copy, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompletedTasksListProps {
  tasks: ParsedTask[];
  onDuplicate: (task: ParsedTask) => void;
}

const CompletedTasksList = ({ tasks, onDuplicate }: CompletedTasksListProps) => {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <Collapsible defaultOpen={true} className="mx-4 mt-4">
      <Card>
        <CardHeader>
          <CollapsibleTrigger className="flex w-full items-center justify-between cursor-pointer">
            <CardTitle className="text-lg font-semibold">Histórico de Hoje ({tasks.length})</CardTitle>
            <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-2">
            {tasks.map((task) => {
              const isCancelled = task.status === 'cancelled';
              return (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-center justify-between p-2 border rounded-md",
                    "opacity-70 transition-opacity duration-500 ease-in-out",
                    isCancelled 
                      ? "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200" 
                      : "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  )}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    {isCancelled && <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />}
                    <span className={cn("font-medium", !isCancelled && "line-through")}>{task.title}</span>
                    {!isCancelled && <span className="text-sm ml-2">⭐+10 XP</span>}
                    {isCancelled && <span className="text-xs uppercase font-bold border px-1 rounded border-red-300 dark:border-red-700 ml-2">Cancelada</span>}
                    
                    {task.project && <span className="text-xs opacity-80 ml-2">@{task.project}</span>}
                    {task.hashtags.map((tag, tagIndex) => (
                      <span key={tagIndex} className="text-xs opacity-80">#{tag}</span>
                    ))}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => onDuplicate(task)} className={cn(isCancelled ? "text-red-800 dark:text-red-200" : "text-green-700 dark:text-green-300")}>
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Duplicar tarefa</span>
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default CompletedTasksList;