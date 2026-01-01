"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ParsedTask } from "@/utils/taskParser";
import TaskItem from "./TaskItem";
import { Inbox, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Project } from "@/lib/supabase/projects";
import { cn } from "@/lib/utils";

interface ToDoTabProps {
  tasksToDo: ParsedTask[];
  tasksDoneToday: ParsedTask[];
  activeTasksStats: Record<string, { totalTime: number; interruptions: number; totalBreakTime: number }>;
  onMoveToFocus: (task: ParsedTask) => void;
  onReturnToToDo: (task: ParsedTask) => void;
  onComplete: (task: ParsedTask) => void;
  onDelete: (task: ParsedTask) => void;
  onCancel: (task: ParsedTask) => void;
  onSave: (taskId: string, updates: Partial<ParsedTask>) => void;
  onDuplicate: (task: ParsedTask) => void;
  onSelectAndFocus: (task: ParsedTask) => void;
  filterPeriod: "today" | "week" | "all" | "overdue";
  onFilterPeriodChange: (period: "today" | "week" | "all" | "overdue") => void;
  filterQuery: string;
  onFilterChange: (query: string) => void;
  projectsList: Project[];
}

const ToDoTab = ({
  tasksToDo,
  tasksDoneToday,
  activeTasksStats,
  onMoveToFocus,
  onReturnToToDo,
  onComplete,
  onDelete,
  onCancel,
  onSave,
  onDuplicate,
  onSelectAndFocus,
  filterPeriod,
  onFilterPeriodChange,
  filterQuery,
  onFilterChange,
  projectsList,
}: ToDoTabProps) => {
  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, task: ParsedTask, sourceList: "todo" | "doneToday") => {
    e.dataTransfer.setData("application/json", JSON.stringify({ task, sourceList }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnFocus = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/json");
    if (!data) return;
    const { task, sourceList } = JSON.parse(data);
    if (sourceList === "todo") {
      onMoveToFocus(task);
    }
  };

  const emptyStateMessages = {
    today: "Nenhuma tarefa agendada para hoje.",
    week: "Nenhuma tarefa agendada para esta semana.",
    all: "Sua caixa de entrada está vazia. Bom trabalho!",
    overdue: "Nenhuma tarefa atrasada encontrada. Você está em dia!",
  };

  return (
    <div className="mt-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Foco do Dia (Top 3)</CardTitle>
        </CardHeader>
        <CardContent
          onDragOver={handleDragOver}
          onDrop={handleDropOnFocus}
          className="min-h-[100px] border-2 border-dashed border-border rounded-md p-4 bg-muted/50"
        >
          {tasksDoneToday.length === 0 ? (
            <p className="text-muted-foreground text-center">Arraste tarefas da sua caixa de entrada para focar nelas hoje.</p>
          ) : (
            <ul className="space-y-2">
              {tasksDoneToday.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isFocusTask
                  onDragStart={handleDragStart}
                  onComplete={onComplete}
                  onSave={onSave}
                  onReturnToToDo={onReturnToToDo}
                  onDelete={onDelete}
                  onCancel={onCancel}
                  onSelectAndFocus={onSelectAndFocus}
                  onDuplicate={onDuplicate}
                  taskStats={activeTasksStats[task.id]}
                  projectsList={projectsList}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filtrar por nome, projeto, tag, data..."
          value={filterQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFilterChange(e.target.value)}
          className="pl-10"
        />
        {filterQuery && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onFilterChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Inbox className="mr-2 h-4 w-4" />
              Caixa de Entrada ({tasksToDo.length})
            </CardTitle>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                onClick={() => onFilterPeriodChange("today")}
                className={cn("rounded-full px-4 py-2", filterPeriod === "today" ? "bg-task-completed-bg text-task-completed-text" : "bg-muted text-muted-foreground")}
              >
                Hoje
              </Button>
              <Button
                variant="ghost"
                onClick={() => onFilterPeriodChange("week")}
                className={cn("rounded-full px-4 py-2", filterPeriod === "week" ? "bg-task-completed-bg text-task-completed-text" : "bg-muted text-muted-foreground")}
              >
                Semana
              </Button>
              <Button
                variant="ghost"
                onClick={() => onFilterPeriodChange("all")}
                className={cn("rounded-full px-4 py-2", filterPeriod === "all" ? "bg-task-completed-bg text-task-completed-text" : "bg-muted text-muted-foreground")}
              >
                Todos
              </Button>
              <Button
                variant="ghost"
                onClick={() => onFilterPeriodChange("overdue")}
                className={cn("rounded-full px-4 py-2", filterPeriod === "overdue" ? "bg-task-completed-bg text-task-completed-text" : "bg-muted text-muted-foreground")}
              >
                Atrasados
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tasksToDo.length === 0 ? (
            <p className="text-muted-foreground text-center pt-10">
              {filterQuery ? "Nenhuma tarefa corresponde ao seu filtro." : emptyStateMessages[filterPeriod]}
            </p>
          ) : (
            <ul className="space-y-2">
              {tasksToDo.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onDragStart={(e) => handleDragStart(e, task, "todo")}
                  onComplete={onComplete}
                  onDelete={onDelete}
                  onCancel={onCancel}
                  onSave={onSave}
                  onMoveToFocus={onMoveToFocus}
                  onDuplicate={onDuplicate}
                  onSelectAndFocus={onSelectAndFocus}
                  taskStats={activeTasksStats[task.id]}
                  projectsList={projectsList}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ToDoTab;