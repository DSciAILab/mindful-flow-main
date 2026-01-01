"use client";

import React, { useState, useEffect } from "react";
import { ParsedTask } from "@/utils/taskParser";
import { Button } from "@/components/ui/button";
import {
  Check,
  Trash2,
  ArrowUp,
  RotateCcw,
  Calendar as CalendarIcon,
  ChevronDown,
  Clock,
  Zap,
  PauseCircle,
  Copy,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Project } from "@/lib/supabase/projects";

interface TaskItemProps {
  task: ParsedTask;
  isFocusTask?: boolean;
  onDragStart: (e: React.DragEvent<HTMLLIElement>, task: ParsedTask, sourceList: "todo" | "doneToday") => void;
  onComplete: (task: ParsedTask) => void;
  onDelete?: (task: ParsedTask) => void;
  onSave: (taskId: string, updates: Partial<ParsedTask>) => void;
  onMoveToFocus?: (task: ParsedTask) => void;
  onReturnToToDo?: (task: ParsedTask) => void;
  onSelectAndFocus?: (task: ParsedTask) => void;
  onDuplicate?: (task: ParsedTask) => void;
  onCancel?: (task: ParsedTask) => void;
  taskStats?: { totalTime: number; interruptions: number; totalBreakTime: number };
  projectsList: Project[];
}

const getCategoryColorClass = (category: ParsedTask["category"]) => {
  switch (category) {
    case "red":
      return "border-l-red-500";
    case "yellow":
      return "border-l-yellow-500";
    case "purple":
      return "border-l-purple-500";
    case "green":
      return "border-l-green-500";
    default:
      return "border-l-transparent";
  }
};

const TaskItem = ({
  task,
  isFocusTask = false,
  onDragStart,
  onComplete,
  onDelete,
  onSave,
  onMoveToFocus,
  onReturnToToDo,
  onSelectAndFocus,
  onDuplicate,
  onCancel,
  taskStats,
  projectsList,
}: TaskItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [projectId, setProjectId] = useState(task.project_id || "");
  const [hashtags, setHashtags] = useState(task.hashtags.join(" "));
  const [priority, setPriority] = useState<ParsedTask["priority"] | "none">(task.priority || "none");
  const [category, setCategory] = useState<ParsedTask["category"] | "none">(task.category || "none");
  const [dueDate, setDueDate] = useState<Date | undefined>(task.due_date ? parseISO(task.due_date) : undefined);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || "");
    setProjectId(task.project_id || "");
    setHashtags(task.hashtags.join(" "));
    setPriority(task.priority || "none");
    setCategory(task.category || "none");
    setDueDate(task.due_date ? parseISO(task.due_date) : undefined);
  }, [task]);

  const handleSave = () => {
    const hashtagsArray = hashtags.split(" ").filter((tag) => tag.trim() !== "");
    const updates: Partial<ParsedTask> = {
      title,
      description,
      project_id: projectId || null,
      hashtags: hashtagsArray,
      priority: priority === "none" ? null : priority,
      category: category === "none" ? null : category,
      due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
    };
    onSave(task.id, updates);
    setIsExpanded(false);
  };

  const sourceList = isFocusTask ? "doneToday" : "todo";
  const categoryColorClass = getCategoryColorClass(task.category);

  const totalMinutes = taskStats ? Math.round(taskStats.totalTime / 60) : 0;
  const interruptionCount = taskStats ? taskStats.interruptions : 0;
  const totalBreakMinutes = taskStats ? Math.round(taskStats.totalBreakTime / 60) : 0;
  const hasStarted = totalMinutes > 0 || interruptionCount > 0 || totalBreakMinutes > 0;

  const isOverdue = task.due_date && startOfDay(parseISO(task.due_date)) < startOfDay(new Date());
  const currentProjectName = projectsList.find((p) => p.id === projectId)?.name || null;

  const renderActionButtons = (isPrimaryRow: boolean) => {
    const sharedButtonClass = isFocusTask ? "text-primary-foreground hover:text-primary-foreground" : "";

    return (
      <div className="flex items-center space-x-1">
        {onDuplicate && !isFocusTask && (
          <Button variant="ghost" size="icon" className={sharedButtonClass} onClick={() => onDuplicate(task)}>
            <Copy className="h-4 w-4" />
            <span className="sr-only">Duplicar tarefa</span>
          </Button>
        )}
        {isPrimaryRow && onMoveToFocus && (
          <Button variant="ghost" size="icon" className={sharedButtonClass} onClick={() => onMoveToFocus(task)}>
            <ArrowUp className="h-4 w-4" />
            <span className="sr-only">Mover para foco</span>
          </Button>
        )}
        {onReturnToToDo && isFocusTask && (
          <Button variant="ghost" size="icon" className={sharedButtonClass} onClick={() => onReturnToToDo(task)}>
            <RotateCcw className="h-4 w-4" />
            <span className="sr-only">Retornar para Tarefas a Fazer</span>
          </Button>
        )}
        <Button variant="ghost" size="icon" className={sharedButtonClass} onClick={() => onComplete(task)}>
          <Check className="h-4 w-4" />
          <span className="sr-only">Marcar como concluída</span>
        </Button>
        {onCancel && (
          <Button variant="ghost" size="icon" className={sharedButtonClass} onClick={() => onCancel(task)}>
            <XCircle className="h-4 w-4" />
            <span className="sr-only">Cancelar tarefa</span>
          </Button>
        )}
        {onDelete && (
          <Button variant="ghost" size="icon" className={sharedButtonClass} onClick={() => onDelete(task)}>
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Deletar tarefa</span>
          </Button>
        )}
      </div>
    );
  };

  if (isFocusTask) {
    return (
      <li
        draggable
        onDragStart={(e) => onDragStart(e, task, sourceList)}
        className={cn(
          "border rounded-md",
          "bg-primary text-primary-foreground",
          isOverdue && "border-red-500 bg-red-900/20",
        )}
      >
        <div className={cn("flex items-center justify-between p-2 border-l-4", categoryColorClass)}>
          <div
            className="flex items-center gap-2 flex-wrap flex-grow cursor-pointer"
            onClick={() => onSelectAndFocus?.(task)}
          >
            {isOverdue && <Clock className="h-4 w-4 text-red-500" />}
            <span className="font-medium">{task.title}</span>
            {currentProjectName && <span className="text-xs opacity-70">@{currentProjectName}</span>}
            {task.hashtags.map((tag, tagIndex) => (
              <span key={tagIndex} className="text-xs opacity-70">
                #{tag}
              </span>
            ))}
            {task.due_date && (
              <Badge
                variant={isOverdue ? "destructive" : "secondary"}
                className={cn(
                  "text-xs",
                  isOverdue ? "bg-red-700 text-white" : "bg-primary-foreground text-primary",
                )}
              >
                <CalendarIcon className="h-3 w-3 mr-1" />
                {format(parseISO(task.due_date), "dd/MM", { locale: ptBR })}
              </Badge>
            )}
            {hasStarted && (
              <div className="flex items-center gap-2 text-xs opacity-70 ml-2">
                {totalMinutes > 0 && (
                  <div className="flex items-center gap-1" title={`Tempo focado: ${totalMinutes} minutos`}>
                    <Clock className="h-3 w-3" />
                    <span>{totalMinutes}m</span>
                  </div>
                )}
                {interruptionCount > 0 && (
                  <div className="flex items-center gap-1" title={`Interrupções: ${interruptionCount}`}>
                    <Zap className="h-3 w-3" />
                    <span>{interruptionCount}</span>
                  </div>
                )}
                {totalBreakMinutes > 0 && (
                  <div className="flex items-center gap-1" title={`Tempo de Pausa: ${totalBreakMinutes} minutos`}>
                    <PauseCircle className="h-3 w-3" />
                    <span>{totalBreakMinutes}m</span>
                  </div>
                )}
              </div>
            )}
          </div>
          {renderActionButtons(false)}
        </div>
      </li>
    );
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded} asChild className={cn("border rounded-md", "bg-secondary", isOverdue && "border-red-500 bg-red-50/20 dark:bg-red-900/20")}>
      <li draggable onDragStart={(e) => onDragStart(e, task, "todo")}>
        <div className={cn("flex items-center justify-between p-2 border-l-4", categoryColorClass)}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-2 flex-wrap flex-grow cursor-pointer">
              {isOverdue && <Clock className="h-4 w-4 text-red-500" />}
              <span className="font-medium">{title}</span>
              {currentProjectName && <span className="text-xs text-muted-foreground">@{currentProjectName}</span>}
              {task.hashtags.map((tag, tagIndex) => (
                <span key={tagIndex} className="text-xs text-muted-foreground">
                  #{tag}
                </span>
              ))}
              {task.due_date && (
                <Badge
                  variant={isOverdue ? "destructive" : "secondary"}
                  className={cn("text-xs", isOverdue ? "bg-red-700 text-white" : "bg-secondary-foreground text-secondary")}
                >
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {format(parseISO(task.due_date), "dd/MM", { locale: ptBR })}
                </Badge>
              )}
              {hasStarted && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground ml-2">
                  {totalMinutes > 0 && (
                    <div className="flex items-center gap-1" title={`Tempo focado: ${totalMinutes} minutos`}>
                      <Clock className="h-3 w-3" />
                      <span>{totalMinutes}m</span>
                    </div>
                  )}
                  {interruptionCount > 0 && (
                    <div className="flex items-center gap-1" title={`Interrupções: ${interruptionCount}`}>
                      <Zap className="h-3 w-3" />
                      <span>{interruptionCount}</span>
                    </div>
                  )}
                  {totalBreakMinutes > 0 && (
                    <div className="flex items-center gap-1" title={`Tempo de Pausa: ${totalBreakMinutes} minutos`}>
                      <PauseCircle className="h-3 w-3" />
                      <span>{totalBreakMinutes}m</span>
                    </div>
                  )}
                </div>
              )}
              <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
            </div>
          </CollapsibleTrigger>
          {renderActionButtons(true)}
        </div>
        <CollapsibleContent>
          <div className="p-4 border-t grid gap-4 bg-background text-foreground">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={`title-${task.id}`} className="text-right">
                Título
              </Label>
              <Input id={`title-${task.id}`} value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor={`description-${task.id}`} className="text-right pt-2">
                Descrição
              </Label>
              <Textarea
                id={`description-${task.id}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={`project-${task.id}`} className="text-right">
                Projeto
              </Label>
              <Select value={projectId || "none"} onValueChange={(v) => setProjectId(v === "none" ? "" : v)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {projectsList.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={`hashtags-${task.id}`} className="text-right">
                Tags
              </Label>
              <Input id={`hashtags-${task.id}`} value={hashtags} onChange={(e) => setHashtags(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={`priority-${task.id}`} className="text-right">
                Prioridade
              </Label>
              <Select value={priority || "none"} onValueChange={(v) => setPriority(v as any)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={`category-${task.id}`} className="text-right">
                Categoria
              </Label>
              <Select value={category || "none"} onValueChange={(v) => setCategory(v as any)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  <SelectItem value="red">Vermelha (Outra pessoa)</SelectItem>
                  <SelectItem value="yellow">Amarela (Melhor Fazer)</SelectItem>
                  <SelectItem value="purple">Roxa (Feel Good)</SelectItem>
                  <SelectItem value="green">Verde (Nice to have)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={`due-date-${task.id}`} className="text-right">
                Vencimento
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "col-span-3 justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="col-start-2 col-span-3 flex justify-end">
              <Button onClick={handleSave}>Salvar Alterações</Button>
            </div>
          </div>
        </CollapsibleContent>
      </li>
    </Collapsible>
  );
};

export default TaskItem;