"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ParsedTask } from "@/utils/taskParser";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Pencil, Trash2, Filter, Calendar as CalendarIcon } from "lucide-react";
import TaskItem from "./TaskItem";
import { Button } from "@/components/ui/button";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Project } from "@/lib/supabase/projects";
import { supabaseDb } from "@/lib/supabase";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ProjectsTabProps {
  projectTasks: ParsedTask[];
  onComplete: (task: ParsedTask) => void;
  onDelete: (task: ParsedTask) => void;
  onSave: (taskId: string, updates: Partial<ParsedTask>) => void;
  onDuplicate: (task: ParsedTask) => void;
  onCancel?: (task: ParsedTask) => void; // Adicionado onCancel como opcional
  onRefresh: () => void;
  projectsList: Project[];
}

const ProjectsTab = ({ projectTasks, onComplete, onDelete, onSave, onDuplicate, onCancel, onRefresh, projectsList }: ProjectsTabProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectDescription, setEditProjectDescription] = useState("");
  const [editWoopWish, setEditWoopWish] = useState("");
  const [editWoopOutcome, setEditWoopOutcome] = useState("");
  const [editWoopObstacle, setEditWoopObstacle] = useState("");
  const [editWoopPlan, setEditWoopPlan] = useState("");
  const [editSmartSpecific, setEditSmartSpecific] = useState("");
  const [editSmartMeasurable, setEditSmartMeasurable] = useState("");
  const [editSmartAchievable, setEditSmartAchievable] = useState("");
  const [editSmartRelevant, setEditSmartRelevant] = useState("");
  const [editSmartTimeBound, setEditSmartTimeBound] = useState<Date | undefined>(undefined);

  const [isProcessing, setIsProcessing] = useState(false);
  const [filterMode, setFilterMode] = useState<'active' | 'all' | 'completed'>('active');

  const filteredProjects = useMemo(() => {
    const projectsWithTasks: Record<string, ParsedTask[]> = {};
    projectTasks.forEach(task => {
      const projectId = task.project_id || "no-project";
      if (!projectsWithTasks[projectId]) {
        projectsWithTasks[projectId] = [];
      }
      projectsWithTasks[projectId].push(task);
    });

    let projectIdsToDisplay: string[] = [];

    if (filterMode === 'all') {
      projectIdsToDisplay = Object.keys(projectsWithTasks);
    } else {
      projectIdsToDisplay = Object.keys(projectsWithTasks).filter(projectId => {
        const tasksInProject = projectsWithTasks[projectId];
        if (tasksInProject.length === 0) return false;

        if (filterMode === 'active') {
          return tasksInProject.some(t => t.status !== 'completed');
        }
        if (filterMode === 'completed') {
          return tasksInProject.every(t => t.status === 'completed');
        }
        return false;
      });
    }

    const finalProjects: Record<string, ParsedTask[]> = {};
    projectIdsToDisplay.forEach(projectId => {
      const projectName = projectsList.find(p => p.id === projectId)?.name || "Sem Projeto";
      finalProjects[projectName] = projectsWithTasks[projectId];
    });

    return finalProjects;

  }, [projectTasks, filterMode, projectsList]);

  const handleEditClick = (project: Project) => {
    setSelectedProject(project);
    setEditProjectName(project.name);
    setEditProjectDescription(project.description || "");
    setEditWoopWish(project.woop_wish || "");
    setEditWoopOutcome(project.woop_outcome || "");
    setEditWoopObstacle(project.woop_obstacle || "");
    setEditWoopPlan(project.woop_plan || "");
    setEditSmartSpecific(project.smart_specific || "");
    setEditSmartMeasurable(project.smart_measurable || "");
    setEditSmartAchievable(project.smart_achievable || "");
    setEditSmartRelevant(project.smart_relevant || "");
    setEditSmartTimeBound(project.smart_time_bound ? parseISO(project.smart_time_bound) : undefined);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedProject || !editProjectName.trim()) {
      toast.error("O nome do projeto não pode estar vazio.");
      return;
    }
    setIsProcessing(true);
    try {
      const updates: Partial<Project> = {
        name: editProjectName.trim(),
        description: editProjectDescription.trim() || null,
        woop_wish: editWoopWish.trim() || null,
        woop_outcome: editWoopOutcome.trim() || null,
        woop_obstacle: editWoopObstacle.trim() || null,
        woop_plan: editWoopPlan.trim() || null,
        smart_specific: editSmartSpecific.trim() || null,
        smart_measurable: editSmartMeasurable.trim() || null,
        smart_achievable: editSmartAchievable.trim() || null,
        smart_relevant: editSmartRelevant.trim() || null,
        smart_time_bound: editSmartTimeBound ? format(editSmartTimeBound, "yyyy-MM-dd") : null,
      };

      if (selectedProject.name !== editProjectName.trim()) {
        const { error: edgeFunctionError } = await supabase.functions.invoke('manage-project-edit', {
          body: { oldProjectName: selectedProject.name, newProjectName: editProjectName.trim() },
        });
        if (edgeFunctionError) throw edgeFunctionError;
      }

      const successUpdateProject = await supabaseDb.updateProject(selectedProject.user_id, selectedProject.id, updates);
      if (!successUpdateProject) throw new Error("Falha ao atualizar o projeto no banco de dados.");

      toast.success(`Projeto "${editProjectName.trim()}" atualizado com sucesso!`);
      onRefresh();
    } catch (err: any) {
      toast.error(`Falha ao atualizar projeto: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setIsEditDialogOpen(false);
    }
  };

  const handleConfirmDelete = async (deleteItems: boolean) => {
    if (!selectedProject) return;
    setIsProcessing(true);
    try {
      const { error: edgeFunctionError } = await supabase.functions.invoke('manage-project-delete', {
        body: { projectName: selectedProject.name, deleteItems },
      });
      if (edgeFunctionError) throw edgeFunctionError;

      const successDeleteProject = await supabaseDb.deleteProject(selectedProject.user_id, selectedProject.id);
      if (!successDeleteProject) throw new Error("Falha ao deletar o projeto do banco de dados.");

      toast.success(`Projeto "${selectedProject.name}" removido com sucesso!`);
      onRefresh();
    } catch (err: any) {
      toast.error(`Falha ao remover projeto: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleFilterChange = () => {
    if (filterMode === 'active') setFilterMode('all');
    else if (filterMode === 'all') setFilterMode('completed');
    else setFilterMode('active');
  };

  const filterLabels = {
    active: "Ativos",
    all: "Todos",
    completed: "Concluídos",
  };

  const emptyStateMessages = {
    active: "Nenhum projeto ativo encontrado.",
    all: "Gerencie seus projetos aqui. Use @nome_do_projeto para agrupar tarefas.",
    completed: "Nenhum projeto concluído encontrado.",
  };

  return (
    <>
      <div className="mt-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Seus Projetos</CardTitle>
              <Button variant="outline" onClick={handleFilterChange}>
                <Filter className="mr-2 h-4 w-4" />
                Mostrando: {filterLabels[filterMode]}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {Object.keys(filteredProjects).length === 0 ? (
              <p className="text-muted-foreground">{emptyStateMessages[filterMode]}</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(filteredProjects).map(([projectName, tasks]) => {
                  const totalTasks = tasks.length;
                  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
                  const activeTasks = tasks.filter(t => t.status !== 'completed');
                  const projectObject = projectsList.find(p => p.name === projectName);

                  return (
                    <Collapsible key={projectName} defaultOpen className="border rounded-md p-4 bg-card space-y-3">
                      <div className="flex justify-between items-center">
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center gap-2 cursor-pointer flex-grow">
                            <h3 className="font-semibold text-lg">{projectName}</h3>
                            <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                          </div>
                        </CollapsibleTrigger>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{completedTasksCount} de {totalTasks} concluídas</span>
                          {projectName !== "Sem Projeto" && projectObject && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handleEditClick(projectObject)}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(projectObject)}><Trash2 className="h-4 w-4" /></Button>
                            </>
                          )}
                        </div>
                      </div>
                      <CollapsibleContent>
                        {projectObject && (
                          <div className="mt-4 space-y-4 text-sm text-muted-foreground">
                            {projectObject.description && (
                              <div>
                                <h4 className="font-semibold text-foreground">Descrição:</h4>
                                <p className="whitespace-pre-wrap">{projectObject.description}</p>
                              </div>
                            )}

                            {(projectObject.woop_wish || projectObject.woop_outcome || projectObject.woop_obstacle || projectObject.woop_plan) && (
                              <Collapsible>
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" className="w-full justify-between text-foreground hover:bg-accent">
                                    <span className="font-semibold">Objetivos WOOP</span>
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="space-y-2 p-2 border rounded-md bg-background">
                                  {projectObject.woop_wish && <div><span className="font-semibold">Desejo:</span> {projectObject.woop_wish}</div>}
                                  {projectObject.woop_outcome && <div><span className="font-semibold">Resultado:</span> {projectObject.woop_outcome}</div>}
                                  {projectObject.woop_obstacle && <div><span className="font-semibold">Obstáculo:</span> {projectObject.woop_obstacle}</div>}
                                  {projectObject.woop_plan && <div><span className="font-semibold">Plano:</span> {projectObject.woop_plan}</div>}
                                </CollapsibleContent>
                              </Collapsible>
                            )}

                            {(projectObject.smart_specific || projectObject.smart_measurable || projectObject.smart_achievable || projectObject.smart_relevant || projectObject.smart_time_bound) && (
                              <Collapsible>
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" className="w-full justify-between text-foreground hover:bg-accent">
                                    <span className="font-semibold">Objetivos SMART</span>
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="space-y-2 p-2 border rounded-md bg-background">
                                  {projectObject.smart_specific && <div><span className="font-semibold">Específico:</span> {projectObject.smart_specific}</div>}
                                  {projectObject.smart_measurable && <div><span className="font-semibold">Mensurável:</span> {projectObject.smart_measurable}</div>}
                                  {projectObject.smart_achievable && <div><span className="font-semibold">Atingível:</span> {projectObject.smart_achievable}</div>}
                                  {projectObject.smart_relevant && <div><span className="font-semibold">Relevante:</span> {projectObject.smart_relevant}</div>}
                                  {projectObject.smart_time_bound && <div><span className="font-semibold">Prazo:</span> {format(parseISO(projectObject.smart_time_bound), "PPP", { locale: ptBR })}</div>}
                                </CollapsibleContent>
                              </Collapsible>
                            )}
                          </div>
                        )}

                        {activeTasks.length > 0 ? (
                          <ul className="space-y-2 pt-2">
                            {activeTasks.map((item) => (
                              <TaskItem
                                key={item.id}
                                task={item}
                                onDragStart={(e) => e.preventDefault()}
                                onComplete={onComplete}
                                onDelete={onDelete}
                                onCancel={onCancel} // Passando onCancel para TaskItem
                                onSave={onSave}
                                onDuplicate={onDuplicate}
                                projectsList={projectsList}
                              />
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground pt-2 text-center">🎉 Todas as tarefas deste projeto foram concluídas!</p>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Projeto: {selectedProject?.name}</DialogTitle>
            <DialogDescription>Gerencie os detalhes e objetivos do seu projeto.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-project-name">Nome do Projeto</Label>
              <Input id="edit-project-name" value={editProjectName} onChange={(e) => setEditProjectName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-project-description">Descrição</Label>
              <Textarea id="edit-project-description" value={editProjectDescription} onChange={(e) => setEditProjectDescription(e.target.value)} rows={3} />
            </div>

            <Collapsible className="mt-4">
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>Objetivos WOOP</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="grid gap-2 py-2 px-1">
                <Label htmlFor="woop-wish">Desejo (Wish)</Label>
                <Textarea id="woop-wish" value={editWoopWish} onChange={(e) => setEditWoopWish(e.target.value)} rows={2} placeholder="O que você realmente quer alcançar?" />
                <Label htmlFor="woop-outcome">Resultado (Outcome)</Label>
                <Textarea id="woop-outcome" value={editWoopOutcome} onChange={(e) => setEditWoopOutcome(e.target.value)} rows={2} placeholder="Como será quando você conseguir? Quais os benefícios?" />
                <Label htmlFor="woop-obstacle">Obstáculo (Obstacle)</Label>
                <Textarea id="woop-obstacle" value={editWoopObstacle} onChange={(e) => setEditWoopObstacle(e.target.value)} rows={2} placeholder="Qual é o principal obstáculo interno que te impede?" />
                <Label htmlFor="woop-plan">Plano (Plan)</Label>
                <Textarea id="woop-plan" value={editWoopPlan} onChange={(e) => setEditWoopPlan(e.target.value)} rows={2} placeholder="Se [Obstáculo], então eu vou [Ação]." />
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
                <Label htmlFor="smart-specific">Específico (Specific)</Label>
                <Textarea id="smart-specific" value={editSmartSpecific} onChange={(e) => setEditSmartSpecific(e.target.value)} rows={2} placeholder="O que exatamente você quer alcançar?" />
                <Label htmlFor="smart-measurable">Mensurável (Measurable)</Label>
                <Textarea id="smart-measurable" value={editSmartMeasurable} onChange={(e) => setEditSmartMeasurable(e.target.value)} rows={2} placeholder="Como você vai medir o progresso e o sucesso?" />
                <Label htmlFor="smart-achievable">Atingível (Achievable)</Label>
                <Textarea id="smart-achievable" value={editSmartAchievable} onChange={(e) => setEditSmartAchievable(e.target.value)} rows={2} placeholder="É realista e alcançável com seus recursos?" />
                <Label htmlFor="smart-relevant">Relevante (Relevant)</Label>
                <Textarea id="smart-relevant" value={editSmartRelevant} onChange={(e) => setEditSmartRelevant(e.target.value)} rows={2} placeholder="Por que este objetivo é importante para você?" />
                <Label htmlFor="smart-time-bound">Prazo (Time-bound)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("justify-start text-left font-normal", !editSmartTimeBound && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editSmartTimeBound ? format(editSmartTimeBound, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={editSmartTimeBound} onSelect={setEditSmartTimeBound} initialFocus />
                  </PopoverContent>
                </Popover>
              </CollapsibleContent>
            </Collapsible>

          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" disabled={isProcessing}>Cancelar</Button></DialogClose>
            <Button onClick={handleSaveEdit} disabled={isProcessing}>{isProcessing ? "Salvando..." : "Salvar Alterações"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Projeto "{selectedProject?.name}"?</DialogTitle>
            <DialogDescription>O que você gostaria de fazer com as tarefas e notas dentro deste projeto?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
            <Button variant="destructive" onClick={() => handleConfirmDelete(true)} disabled={isProcessing}>
              {isProcessing ? "Excluindo..." : "Excluir projeto e todos os seus itens"}
            </Button>
            <Button variant="secondary" onClick={() => handleConfirmDelete(false)} disabled={isProcessing}>
              {isProcessing ? "Desassociando..." : "Manter itens e desassociar do projeto"}
            </Button>
            <DialogClose asChild><Button variant="outline" disabled={isProcessing}>Cancelar</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProjectsTab;