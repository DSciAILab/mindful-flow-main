"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ParsedTask } from "@/utils/taskParser";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabaseDb } from "@/lib/supabase/index";
import { useSession } from "@/integrations/supabase/auth";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "./ui/skeleton";
import { Calendar as CalendarIcon, ChevronsUpDown, Copy, Clock, Zap, PauseCircle, XCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { MultiSelectCombobox } from "@/components/ui/multi-select-combobox";
import { Project } from "@/lib/supabase/projects";
import { toast } from "sonner";

interface TaskDetailSheetProps {
  task: ParsedTask | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, updates: Partial<ParsedTask>) => void;
  onDuplicate: (task: ParsedTask) => void;
  onCancel: (task: ParsedTask) => void;
  projectsList: Project[];
  hashtagsList: string[];
}

const TaskDetailSheet = ({ task, isOpen, onClose, onSave, onDuplicate, onCancel, projectsList, hashtagsList }: TaskDetailSheetProps) => {
  const { user } = useSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [priority, setPriority] = useState<ParsedTask['priority'] | "none">("none");
  const [category, setCategory] = useState<ParsedTask['category'] | "none">("none");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [timeLogs, setTimeLogs] = useState<{ duration_seconds: number; logged_at: string }[]>([]);
  const [interruptions, setInterruptions] = useState<{ interrupted_at: string }[]>([]);
  const [breakLogs, setBreakLogs] = useState<{ duration_seconds: number; created_at: string }[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isProjectComboboxOpen, setIsProjectComboboxOpen] = useState(false);
  const [projectInputName, setProjectInputName] = useState("");

  useEffect(() => {
    if (task && user?.id) {
      setTitle(task.title);
      setDescription(task.description || "");
      setProjectId(task.project_id || "");
      setProjectInputName(projectsList.find(p => p.id === task.project_id)?.name || "");
      setHashtags(task.hashtags || []);
      setPriority(task.priority || "none");
      setCategory(task.category || "none");
      setDueDate(task.due_date ? parseISO(task.due_date) : undefined);

      const fetchStats = async () => {
        setIsLoadingStats(true);
        const [logs, interruptionsData, breakLogsData] = await Promise.all([
          supabaseDb.getTimeLogsForTask(user.id, task.id),
          supabaseDb.getInterruptionLogsForTask(user.id, task.id),
          supabaseDb.getBreakLogsForTasks(user.id, [task.id]),
        ]);
        setTimeLogs(logs);
        setInterruptions(interruptionsData);
        setBreakLogs(breakLogsData);
        setIsLoadingStats(false);
      };
      fetchStats();
    }
  }, [task, user?.id, projectsList]);

  const handleSave = async () => {
    if (!task) return;

    let finalProjectId = projectId;
    if (projectInputName && !projectId) {
      const existingProject = projectsList.find(p => p.name.toLowerCase() === projectInputName.toLowerCase());
      if (existingProject) {
        finalProjectId = existingProject.id;
      } else {
        const newProject = await supabaseDb.addProject(user!.id, {
          name: projectInputName,
          description: null,
          woop_wish: null,
          woop_outcome: null,
          woop_obstacle: null,
          woop_plan: null,
          smart_specific: null,
          smart_measurable: null,
          smart_achievable: null,
          smart_relevant: null,
          smart_time_bound: null,
        });
        if (newProject) {
          finalProjectId = newProject.id;
          toast.success(`Novo projeto "${newProject.name}" criado!`);
        } else {
          toast.error("Falha ao criar novo projeto.");
          return;
        }
      }
    }

    onSave(task.id, {
      title,
      description,
      project_id: finalProjectId || null,
      hashtags: hashtags,
      priority: priority === "none" ? null : priority,
      category: category === "none" ? null : category,
      due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
    });
    onClose();
  };

  const handleDuplicate = () => {
    if (task) {
      onDuplicate(task);
      onClose();
    }
  };

  const handleCancelTask = () => {
    if (!task) return;
    onCancel(task);
    onClose();
  };

  const totalTimeInMinutes = Math.round(timeLogs.reduce((acc, log) => acc + log.duration_seconds, 0) / 60);
  const interruptionCount = interruptions.length;
  const totalBreakTimeInMinutes = Math.round(breakLogs.reduce((acc, log) => acc + log.duration_seconds, 0) / 60);

  if (!task) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:w-[400px] md:w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Detalhes da Tarefa</SheetTitle>
          <SheetDescription>
            Edite os detalhes da sua tarefa aqui. Clique em salvar quando terminar.
          </SheetDescription>
          <div className="border-t pt-4 mt-4">
            {isLoadingStats ? (
              <div className="grid grid-cols-3 gap-2 text-center">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xl font-bold">{totalTimeInMinutes}</p>
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" /> Min. Focados
                  </p>
                </div>
                <div>
                  <p className="text-xl font-bold">{interruptionCount}</p>
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Zap className="h-3 w-3" /> Interrupções
                  </p>
                </div>
                <div>
                  <p className="text-xl font-bold">{totalBreakTimeInMinutes}</p>
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <PauseCircle className="h-3 w-3" /> Min. Pausas
                  </p>
                </div>
              </div>
            )}
          </div>
        </SheetHeader>
        <div className="grid gap-4 py-4 flex-grow overflow-y-auto pr-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Título
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">
              Descrição
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="Adicione notas, links, ou qualquer detalhe relevante..."
              rows={5}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="project" className="text-right">
              Projeto
            </Label>
            <Popover open={isProjectComboboxOpen} onOpenChange={setIsProjectComboboxOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={isProjectComboboxOpen} className="col-span-3 justify-between">
                  {projectsList.find(p => p.id === projectId)?.name || projectInputName || "Selecione ou crie..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput
                    placeholder="Buscar ou criar projeto..."
                    value={projectInputName}
                    onValueChange={(value) => {
                      setProjectInputName(value);
                      const foundProject = projectsList.find(p => p.name.toLowerCase() === value.toLowerCase());
                      setProjectId(foundProject?.id || "");
                    }}
                  />
                  <CommandEmpty>
                    {projectInputName ? `Criar "${projectInputName}"` : "Nenhum projeto encontrado."}
                  </CommandEmpty>
                  <CommandGroup>
                    {projectsList.map((p) => (
                      <CommandItem key={p.id} value={p.name} onSelect={(currentValue) => {
                        const selected = projectsList.find(proj => proj.name.toLowerCase() === currentValue.toLowerCase());
                        setProjectId(selected?.id || "");
                        setProjectInputName(selected?.name || "");
                        setIsProjectComboboxOpen(false);
                      }}>
                        {p.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="hashtags" className="text-right pt-2">
              Tags
            </Label>
            <div className="col-span-3">
              <MultiSelectCombobox
                options={hashtagsList}
                selected={hashtags}
                onChange={setHashtags}
                placeholder="Selecione ou crie tags..."
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="priority" className="text-right">
              Prioridade
            </Label>
            <Select
              value={priority || "none"}
              onValueChange={(value) => setPriority(value as ParsedTask['priority'] | "none")}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Definir prioridade" />
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
            <Label htmlFor="category" className="text-right">
              Categoria
            </Label>
            <Select
              value={category || "none"}
              onValueChange={(value) => setCategory(value as ParsedTask['category'] | "none")}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Definir categoria" />
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
            <Label htmlFor="due-date" className="text-right">
              Vencimento
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
                {dueDate && (
                  <div className="p-2 border-t">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-500 hover:text-red-600"
                      onClick={() => setDueDate(undefined)}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Limpar Data
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
          <div className="col-span-4 border-t pt-4 mt-2">
            <h4 className="text-sm font-semibold mb-2 text-center">Histórico de Sessões</h4>
            {isLoadingStats ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <>
                {timeLogs.length > 0 ? (
                  <ul className="space-y-1 text-sm text-muted-foreground max-h-32 overflow-y-auto">
                    {timeLogs.map((log, index) => (
                      <li key={index} className="flex justify-between p-1 bg-muted rounded-sm">
                        <span>Sessão de {log.duration_seconds / 60} min</span>
                        <span>{format(new Date(log.logged_at), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-sm text-muted-foreground">Nenhum tempo registrado para esta tarefa.</p>
                )}
              </>
            )}
          </div>
        </div>
        <SheetFooter className="flex flex-wrap gap-2 justify-between items-center">
          <Button variant="outline" onClick={handleDuplicate} className="flex-1 sm:flex-none">
            <Copy className="mr-2 h-4 w-4" />
            Duplicar
          </Button>
          <Button variant="destructive" onClick={handleCancelTask} className="flex-1 sm:flex-none">
            Cancelar Tarefa
          </Button>
          <SheetClose asChild>
            <Button variant="outline" className="flex-1 sm:flex-none">Fechar</Button>
          </SheetClose>
          <Button onClick={handleSave} className="flex-1 sm:flex-none">Salvar Alterações</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default TaskDetailSheet;