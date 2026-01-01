"use client";

import { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/integrations/supabase/auth";
import Layout from "@/components/Layout";
import { InboxPageSkeleton } from "@/components/LoadingSkeletons";
import { useInbox } from "@/hooks/useInbox";
import ToDoTab from "@/components/inbox/ToDoTab";
import ProjectsTab from "@/components/inbox/ProjectsTab";
import CompletedTab from "@/components/inbox/CompletedTab";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  Plus,
  List,
  LayoutGrid,
  Upload,
  ChevronsUpDown,
  ChevronDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabaseDb } from "@/lib/supabase";
import { ParsedTask } from "@/utils/taskParser";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTimer } from "@/contexts/TimerContext";
import { supabase, APP_ID } from "@/integrations/supabase/client";
import TimeBlockingView from "@/components/inbox/TimeBlockingView";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import TaskDetailSheet from "@/components/TaskDetailSheet";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Project } from "@/lib/supabase/projects";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const weekDays: Record<string, string> = {
  Sunday: "Domingo",
  Monday: "Segunda-feira",
  Tuesday: "Terça-feira",
  Wednesday: "Quarta-feira",
  Thursday: "Quinta-feira",
  Friday: "Sexta-feira",
  Saturday: "Sábado",
};

const Inbox = () => {
  const { user, isLoading } = useSession();
  const {
    displayTasksToDo,
    tasksDoneToday,
    tasksCompleted,
    projectTasks,
    completedTasksStats,
    activeTasksStats,
    filterPeriod,
    setFilterPeriod,
    loadAllTasks,
    handleMoveToFocus,
    handleReturnTaskToToDoList,
    handleTaskCompletion,
    handleTaskDeletion,
    handleTaskCancellation,
    handleSaveTaskDetails,
    handleDuplicateTask,
    selectedTask,
    isSheetOpen,
    setIsSheetOpen,
    projectsList,
    hashtagsList,
    filterQuery,
    setFilterQuery,
    setProjectsList,
  } = useInbox(user?.id);
  const { selectTaskAndEnterFocus } = useTimer();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<"list" | "time-blocking">("list");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [newProjectNameInput, setNewProjectNameInput] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [priority, setPriority] = useState<ParsedTask["priority"] | "none">("none");
  const [category, setCategory] = useState<ParsedTask["category"] | "none">("none");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [recurrenceType, setRecurrenceType] = useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [recurrenceValue, setRecurrenceValue] = useState("");
  const [isProjectComboboxOpen, setIsProjectComboboxOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newWoopWish, setNewWoopWish] = useState("");
  const [newWoopOutcome, setNewWoopOutcome] = useState("");
  const [newWoopObstacle, setNewWoopObstacle] = useState("");
  const [newWoopPlan, setNewWoopPlan] = useState("");
  const [newSmartSpecific, setNewSmartSpecific] = useState("");
  const [newSmartMeasurable, setNewSmartMeasurable] = useState("");
  const [newSmartAchievable, setNewSmartAchievable] = useState("");
  const [newSmartRelevant, setNewSmartRelevant] = useState("");
  const [newSmartTimeBound, setNewSmartTimeBound] = useState<Date | undefined>(undefined);
  const [isAddingProject, setIsAddingProject] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedProjectId(null);
    setNewProjectNameInput("");
    setHashtags("");
    setPriority("none");
    setCategory("none");
    setDueDate(undefined);
    setRecurrenceType("none");
    setRecurrenceValue("");
    setIsProjectComboboxOpen(false);
  };

  const resetAddProjectForm = () => {
    setNewProjectName("");
    setNewProjectDescription("");
    setNewWoopWish("");
    setNewWoopOutcome("");
    setNewWoopObstacle("");
    setNewWoopPlan("");
    setNewSmartSpecific("");
    setNewSmartMeasurable("");
    setNewSmartAchievable("");
    setNewSmartRelevant("");
    setNewSmartTimeBound(undefined);
  };

  const handleAddTask = async () => {
    if (!user?.id || !title.trim()) {
      toast.error("O título da tarefa não pode estar vazio.");
      return;
    }

    const hashtagsArray = hashtags.split(" ").filter((tag) => tag.trim() !== "");

    let finalProjectId = selectedProjectId;
    if (newProjectNameInput && !selectedProjectId) {
      const existingProject = projectsList.find(
        (p) => p.name.toLowerCase() === newProjectNameInput.toLowerCase(),
      );
      if (existingProject) {
        finalProjectId = existingProject.id;
      } else {
        const newProject = await supabaseDb.addProject(user.id, {
          name: newProjectNameInput,
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
          loadAllTasks();
        } else {
          toast.error("Falha ao criar novo projeto.");
          return;
        }
      }
    }

    if (recurrenceType !== "none") {
      if ((recurrenceType === "weekly" || recurrenceType === "monthly") && !recurrenceValue) {
        toast.error("O valor da recorrência é obrigatório.");
        return;
      }
      const { error } = await supabase.from("recurring_tasks").insert({
        user_id: user.id,
        app_id: APP_ID,
        title: title.trim(),
        project_id: finalProjectId,
        hashtags: hashtagsArray,
        priority: priority === "none" ? null : priority,
        description: description.trim() || null,
        recurrence_type: recurrenceType,
        recurrence_value: recurrenceType === "daily" ? null : recurrenceValue,
      });
      if (error) {
        toast.error(`Falha ao criar regra recorrente: ${error.message}`);
      } else {
        toast.success("Regra de recorrência criada com sucesso!");
        setIsAddDialogOpen(false);
        resetForm();
      }
    } else {
      const newTask: Partial<ParsedTask> = {
        title: title.trim(),
        description: description.trim() || null,
        project_id: finalProjectId,
        hashtags: hashtagsArray,
        priority: priority === "none" ? null : priority,
        category: category === "none" ? null : category,
        due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
        status: "todo",
      };
      const success = await supabaseDb.addTask(user.id, newTask as ParsedTask);
      if (success) {
        toast.success(`Tarefa "${newTask.title}" adicionada à caixa de entrada!`);
        setIsAddDialogOpen(false);
        resetForm();
        loadAllTasks();
      } else {
        toast.error("Falha ao adicionar tarefa.");
      }
    }
  };

  const handleAddProject = async () => {
    if (!user?.id || !newProjectName.trim()) {
      toast.error("O nome do projeto não pode estar vazio.");
      return;
    }
    setIsAddingProject(true);
    try {
      const newProjectData: Omit<Project, "id" | "user_id" | "app_id" | "created_at" | "updated_at"> = {
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || null,
        woop_wish: newWoopWish.trim() || null,
        woop_outcome: newWoopOutcome.trim() || null,
        woop_obstacle: newWoopObstacle.trim() || null,
        woop_plan: newWoopPlan.trim() || null,
        smart_specific: newSmartSpecific.trim() || null,
        smart_measurable: newSmartMeasurable.trim() || null,
        smart_achievable: newSmartAchievable.trim() || null,
        smart_relevant: newSmartRelevant.trim() || null,
        smart_time_bound: newSmartTimeBound ? format(newSmartTimeBound, "yyyy-MM-dd") : null,
      };
      const newProject = await supabaseDb.addProject(user.id, newProjectData);
      if (newProject) {
        toast.success(`Projeto "${newProject.name}" criado com sucesso!`);
        setIsAddProjectDialogOpen(false);
        resetAddProjectForm();
        loadAllTasks();
      } else {
        toast.error("Falha ao criar projeto.");
      }
    } catch (error: any) {
      toast.error(`Falha ao criar projeto: ${error.message}`);
    } finally {
      setIsAddingProject(false);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        let tasksToImport: any[] = [];

        if (file.name.endsWith(".csv")) {
          const result = Papa.parse(data as string, { header: true, skipEmptyLines: true });
          tasksToImport = result.data;
        } else if (file.name.endsWith(".xlsx")) {
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          tasksToImport = XLSX.utils.sheet_to_json(sheet);
        } else {
          throw new Error("Formato de arquivo não suportado. Use .csv ou .xlsx.");
        }

        const validTasks = (
          await Promise.all(
            tasksToImport.map(async (row: any) => {
              if (!row.title || typeof row.title !== "string" || !row.title.trim()) {
                return null;
              }

              const parseDate = (dateStr: string) => {
                if (!dateStr) return null;
                try {
                  let parsed = parse(dateStr, "yyyy-MM-dd", new Date());
                  if (!isNaN(parsed.getTime())) return format(parsed, "yyyy-MM-dd");
                  parsed = parse(dateStr, "dd/MM/yyyy", new Date());
                  if (!isNaN(parsed.getTime())) return format(parsed, "yyyy-MM-dd");
                  return null;
                } catch {
                  return null;
                }
              };

              let importedProjectId: string | null = null;
              if (row.project) {
                const existingProject = projectsList.find(
                  (p) => p.name.toLowerCase() === String(row.project).toLowerCase(),
                );
                if (existingProject) {
                  importedProjectId = existingProject.id;
                } else {
                  const newProject = await supabaseDb.addProject(user.id, {
                    name: String(row.project),
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
                    importedProjectId = newProject.id;
                    setProjectsList((prev: Project[]) => [...prev, newProject]);
                  } else {
                    toast.error(`Falha ao criar projeto "${row.project}" durante a importação.`);
                  }
                }
              }

              return {
                user_id: user.id,
                app_id: APP_ID,
                title: row.title.trim(),
                description: row.description || null,
                project_id: importedProjectId,
                hashtags: row.hashtags ? String(row.hashtags).split(" ").filter(Boolean) : [],
                priority: ["high", "medium", "low"].includes(row.priority) ? row.priority : null,
                category: ["red", "yellow", "purple", "green"].includes(row.category) ? row.category : null,
                due_date: parseDate(row.due_date),
                status: "todo",
              };
            }),
          )
        ).filter(Boolean);

        if (validTasks.length > 0) {
          const { error } = await supabase.from("tasks").insert(validTasks);
          if (error) throw error;
          toast.success(`${validTasks.length} tarefas importadas com sucesso!`);
          loadAllTasks();
        } else {
          toast.warning("Nenhuma tarefa válida encontrada no arquivo.");
        }
      } catch (error: any) {
        toast.error(`Falha na importação: ${error.message}`);
      } finally {
        setIsImporting(false);
        setIsImportDialogOpen(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    if (file.name.endsWith(".xlsx")) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
  };

  if (isLoading) {
    return <InboxPageSkeleton />;
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => setViewMode((prev) => (prev === "list" ? "time-blocking" : "list"))}>
        {viewMode === "list" ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
      </Button>
      <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
        <Upload className="mr-2 h-4 w-4" />
        Importar
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="rounded-full h-10 w-10" size="icon">
            <Plus className="h-5 w-5" />
            <span className="sr-only">Adicionar novo item</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar Tarefa
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsAddProjectDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar Projeto
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const currentProjectName = projectsList.find((p) => p.id === selectedProjectId)?.name || newProjectNameInput;

  return (
    <Layout headerActions={headerActions} onTaskAddedToInbox={loadAllTasks} onTaskAddedToProject={loadAllTasks} onNoteAdded={loadAllTasks}>
      {viewMode === "list" ? (
        <div className="p-4">
          <Tabs defaultValue="todo" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="todo">Tarefas a Fazer</TabsTrigger>
              <TabsTrigger value="projects">Projetos</TabsTrigger>
              <TabsTrigger value="completed">Tarefas Realizadas</TabsTrigger>
            </TabsList>

            <TabsContent value="todo">
              <ToDoTab
                tasksToDo={displayTasksToDo}
                tasksDoneToday={tasksDoneToday}
                activeTasksStats={activeTasksStats}
                onMoveToFocus={handleMoveToFocus}
                onReturnToToDo={handleReturnTaskToToDoList}
                onComplete={handleTaskCompletion}
                onDelete={handleTaskDeletion}
                onCancel={handleTaskCancellation}
                onSave={handleSaveTaskDetails}
                onDuplicate={handleDuplicateTask}
                onSelectAndFocus={selectTaskAndEnterFocus}
                filterPeriod={filterPeriod}
                onFilterPeriodChange={setFilterPeriod}
                filterQuery={filterQuery}
                onFilterChange={setFilterQuery}
                projectsList={projectsList}
              />
            </TabsContent>

            <TabsContent value="projects">
              <ProjectsTab
                projectTasks={projectTasks}
                onComplete={handleTaskCompletion}
                onDelete={handleTaskDeletion}
                onCancel={handleTaskCancellation}
                onSave={handleSaveTaskDetails}
                onDuplicate={handleDuplicateTask}
                onRefresh={loadAllTasks}
                projectsList={projectsList}
              />
            </TabsContent>

            <TabsContent value="completed">
              <CompletedTab tasksCompleted={tasksCompleted} completedTasksStats={completedTasksStats} onDuplicate={handleDuplicateTask} />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <TimeBlockingView />
      )}

      <TaskDetailSheet
        task={selectedTask}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSave={handleSaveTaskDetails}
        onDuplicate={handleDuplicateTask}
        onCancel={handleTaskCancellation}
        projectsList={projectsList}
        hashtagsList={hashtagsList}
      />

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="w-full max-w-full sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Tarefa</DialogTitle>
            <DialogDescription>Preencha os detalhes da sua nova tarefa.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Título
              </Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                Descrição
              </Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" rows={3} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project" className="text-right">
                Projeto
              </Label>
              <Popover open={isProjectComboboxOpen} onOpenChange={setIsProjectComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={isProjectComboboxOpen} className="col-span-3 justify-between">
                    {currentProjectName || "Selecione ou crie um projeto..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar ou criar projeto..." value={newProjectNameInput} onValueChange={setNewProjectNameInput} />
                    <CommandEmpty>{newProjectNameInput ? `Criar "${newProjectNameInput}"` : "Nenhum projeto encontrado."}</CommandEmpty>
                    <CommandGroup>
                      {projectsList.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={p.name}
                          onSelect={(currentValue) => {
                            const selected = projectsList.find((proj) => proj.name.toLowerCase() === currentValue.toLowerCase());
                            setSelectedProjectId(selected?.id || null);
                            setNewProjectNameInput(selected?.name || "");
                            setIsProjectComboboxOpen(false);
                          }}
                        >
                          {p.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="hashtags" className="text-right">
                Tags
              </Label>
              <Input id="hashtags" value={hashtags} onChange={(e) => setHashtags(e.target.value)} className="col-span-3" placeholder="urgente importante" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">
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
              <Label htmlFor="category" className="text-right">
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
              <Label htmlFor="recurrenceType" className="text-right">
                Repetir
              </Label>
              <Select
                value={recurrenceType}
                onValueChange={(v) => {
                  setRecurrenceType(v as any);
                  setRecurrenceValue("");
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não repetir</SelectItem>
                  <SelectItem value="daily">Diariamente</SelectItem>
                  <SelectItem value="weekly">Semanalmente</SelectItem>
                  <SelectItem value="monthly">Mensalmente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {recurrenceType === "weekly" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="recurrenceValue" className="text-right">
                  Dia da Semana
                </Label>
                <Select value={recurrenceValue} onValueChange={setRecurrenceValue}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione o dia" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(weekDays).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {recurrenceType === "monthly" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="recurrenceValue" className="text-right">
                  Dia do Mês
                </Label>
                <Input id="recurrenceValue" type="number" min="1" max="31" value={recurrenceValue} onChange={(e) => setRecurrenceValue(e.target.value)} className="col-span-3" />
              </div>
            )}
            {recurrenceType === "none" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="due-date" className="text-right">
                  Vencimento
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("col-span-3 justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            </DialogClose>
            <Button onClick={handleAddTask}>Adicionar Tarefa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="w-full max-w-full sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>Importar Tarefas</DialogTitle>
            <DialogDescription>
              Selecione um arquivo .csv ou .xlsx para importar tarefas em massa.
              <a href="/task_template.csv" download className="text-primary underline ml-1">
                Baixe o modelo aqui.
              </a>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".csv, .xlsx" className="hidden" />
            <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
              {isImporting ? "Importando..." : "Selecionar Arquivo"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Cabeçalhos esperados: title, description, project, hashtags, priority, category, due_date.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddProjectDialogOpen} onOpenChange={setIsAddProjectDialogOpen}>
        <DialogContent className="w-full max-w-full sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Projeto</DialogTitle>
            <DialogDescription>Defina os detalhes e objetivos do seu novo projeto.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-project-name">Nome do Projeto</Label>
              <Input id="new-project-name" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-project-description">Descrição</Label>
              <Textarea id="new-project-description" value={newProjectDescription} onChange={(e) => setNewProjectDescription(e.target.value)} rows={3} />
            </div>

            <Collapsible className="mt-4">
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>Objetivos WOOP</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="grid gap-2 py-2 px-1">
                <Label htmlFor="new-woop-wish">Desejo (Wish)</Label>
                <Textarea
                  id="new-woop-wish"
                  value={newWoopWish}
                  onChange={(e) => setNewWoopWish(e.target.value)}
                  rows={2}
                  placeholder="O que você realmente quer alcançar?"
                />
                <Label htmlFor="new-woop-outcome">Resultado (Outcome)</Label>
                <Textarea
                  id="new-woop-outcome"
                  value={newWoopOutcome}
                  onChange={(e) => setNewWoopOutcome(e.target.value)}
                  rows={2}
                  placeholder="Como será quando você conseguir? Quais os benefícios?"
                />
                <Label htmlFor="new-woop-obstacle">Obstáculo (Obstacle)</Label>
                <Textarea
                  id="new-woop-obstacle"
                  value={newWoopObstacle}
                  onChange={(e) => setNewWoopObstacle(e.target.value)}
                  rows={2}
                  placeholder="Qual é o principal obstáculo interno que te impede?"
                />
                <Label htmlFor="new-woop-plan">Plano (Plan)</Label>
                <Textarea
                  id="new-woop-plan"
                  value={newWoopPlan}
                  onChange={(e) => setNewWoopPlan(e.target.value)}
                  rows={2}
                  placeholder="Se [Obstáculo], então eu vou [Ação]."
                />
              </CollapsibleContent>
            </Collapsible>

            <Collapsible className="mt-2">
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>Objetivos SMART</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="grid gap-2 py-2 px-1">
                <Label htmlFor="new-smart-specific">Específico (Specific)</Label>
                <Textarea
                  id="new-smart-specific"
                  value={newSmartSpecific}
                  onChange={(e) => setNewSmartSpecific(e.target.value)}
                  rows={2}
                  placeholder="O que exatamente você quer alcançar?"
                />
                <Label htmlFor="new-smart-measurable">Mensurável (Measurable)</Label>
                <Textarea
                  id="new-smart-measurable"
                  value={newSmartMeasurable}
                  onChange={(e) => setNewSmartMeasurable(e.target.value)}
                  rows={2}
                  placeholder="Como você vai medir o progresso e o sucesso?"
                />
                <Label htmlFor="new-smart-achievable">Atingível (Achievable)</Label>
                <Textarea
                  id="new-smart-achievable"
                  value={newSmartAchievable}
                  onChange={(e) => setNewSmartAchievable(e.target.value)}
                  rows={2}
                  placeholder="É realista e alcançável com seus recursos?"
                />
                <Label htmlFor="new-smart-relevant">Relevante (Relevant)</Label>
                <Textarea
                  id="new-smart-relevant"
                  value={newSmartRelevant}
                  onChange={(e) => setNewSmartRelevant(e.target.value)}
                  rows={2}
                  placeholder="Por que este objetivo é importante para você?"
                />
                <Label htmlFor="new-smart-time-bound">Prazo (Time-bound)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start text-left font-normal", !newSmartTimeBound && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newSmartTimeBound ? format(newSmartTimeBound, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={newSmartTimeBound} onSelect={setNewSmartTimeBound} initialFocus />
                  </PopoverContent>
                </Popover>
              </CollapsibleContent>
            </Collapsible>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={resetAddProjectForm} disabled={isAddingProject}>
                Cancelar
              </Button>
            </DialogClose>
            <Button onClick={handleAddProject} disabled={isAddingProject}>
              {isAddingProject ? "Criando..." : "Criar Projeto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Inbox;