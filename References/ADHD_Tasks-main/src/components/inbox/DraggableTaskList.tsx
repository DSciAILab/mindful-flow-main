"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ParsedTask } from "@/utils/taskParser";
import { cn } from "@/lib/utils";
import { GripVertical, CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DraggableTaskListProps {
  tasks: ParsedTask[];
}

const getCategoryColorClass = (category: ParsedTask['category']) => {
  switch (category) {
    case 'red': return 'border-l-red-500';
    case 'yellow': return 'border-l-yellow-500';
    case 'purple': return 'border-l-purple-500';
    case 'green': return 'border-l-green-500';
    default: return 'border-l-transparent';
  }
};

const DraggableTaskList = ({ tasks }: DraggableTaskListProps) => {
  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, task: ParsedTask) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ task }));
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Tarefas Não Agendadas</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto">
        {tasks.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Todas as tarefas estão agendadas ou sua caixa de entrada está vazia!
          </p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => {
              const categoryColorClass = getCategoryColorClass(task.category);
              return (
                <li
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  className={cn(
                    "flex items-center gap-2 p-2 border rounded-md bg-secondary cursor-grab",
                    "border-l-4",
                    categoryColorClass
                  )}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-grow">
                    <span className="font-medium">{task.title}</span>
                    <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground mt-1">
                      {task.project && <span>@{task.project}</span>} {/* Usar task.project (que agora vem do join) */}
                      {task.hashtags.map((tag, tagIndex) => (
                        <span key={tagIndex}>#{tag}</span>
                      ))}
                      {task.due_date && (
                        <Badge variant="secondary" className="text-xs">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {format(parseISO(task.due_date), "dd/MM", { locale: ptBR })}
                        </Badge>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default DraggableTaskList;