import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SwipeableCard } from "@/components/ui/SwipeableCard";
import { 
  FolderKanban, 
  Pencil, 
  Trash2, 
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  ListTodo,
  Plus
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { LifeAreaBadge } from "@/components/ui/LifeAreaBadge";
import { cn } from "@/lib/utils";
import type { Project, Task } from "@/types";

interface ProjectCardProps {
  project: Project;
  tasks: Task[];
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTaskClick?: (task: Task) => void;
  onAddTask?: () => void;
}

export function ProjectCard({ 
  project, 
  tasks, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete,
  onTaskClick,
  onAddTask
}: ProjectCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Calculate progress based on tasks
  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const completedTasks = projectTasks.filter(t => t.status === 'done');
  const progress = projectTasks.length > 0 
    ? Math.round((completedTasks.length / projectTasks.length) * 100) 
    : 0;

  return (
    <SwipeableCard onDelete={onDelete}>
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow-md group",
          isSelected 
            ? "ring-2 ring-primary border-primary/50" 
            : "hover:border-primary/30"
        )}
        onClick={onSelect}
      >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${project.color}20` }}
            >
              <FolderKanban 
                className="h-5 w-5" 
                style={{ color: project.color }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground truncate">
                  {project.name}
                </h3>
                {project.areaId && (
                  <LifeAreaBadge areaId={project.areaId} className="scale-90" />
                )}
              </div>
              {project.description && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {project.description}
                </p>
              )}
            </div>
          </div>

          {/* Action icons - appear on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="ghost" 
              size="icon-sm" 
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon-sm" 
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress section */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{completedTasks.length}/{projectTasks.length} tarefas</span>
            </div>
            <span className="font-medium" style={{ color: project.color }}>
              {progress}%
            </span>
          </div>
          <Progress 
            value={progress} 
            className="h-1.5"
            style={{ 
              // @ts-ignore
              '--progress-foreground': project.color 
            }}
          />
        </div>

        {/* Collapsible Task List */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-4">
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent text-xs text-muted-foreground hover:text-foreground group"
              onClick={(e) => { e.stopPropagation(); }}
            >
              <span className="flex items-center gap-1.5">
                <ListTodo className="h-3.5 w-3.5" />
                {isOpen ? "Ocultar tarefas" : "Ver tarefas"}
              </span>
              {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-2">
            {projectTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground italic pl-1">Nenhuma tarefa neste projeto.</p>
            ) : (
              <div className="space-y-1">
                {projectTasks.map(task => (
                  <div 
                    key={task.id}
                    className="flex items-center gap-2 text-xs p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskClick?.(task);
                    }}
                  >
                    <div className={cn(
                      "h-2 w-2 rounded-full border",
                      task.status === 'done' 
                        ? "bg-primary border-primary" 
                        : "border-muted-foreground"
                    )} />
                    <span className={cn(
                      "truncate flex-1",
                      task.status === 'done' && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add task button inside the card */}
            {onAddTask && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border/50 hover:border-primary/50"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddTask();
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Nova Tarefa
              </Button>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
    </SwipeableCard>
  );
}

// Minimal Project Item - clean list view with task count on left, expandable
interface MinimalProjectItemProps {
  project: Project;
  tasks: Task[];
  isSelected: boolean;
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onTaskClick?: (task: Task) => void;
  onAddTask?: () => void;
}

export function MinimalProjectItem({
  project,
  tasks,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onTaskClick,
  onAddTask,
}: MinimalProjectItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const completedTasks = projectTasks.filter(t => t.status === 'done');

  const handleClick = () => {
    setIsExpanded(!isExpanded);
    onSelect();
  };

  return (
    <div
      className={cn(
        "group rounded-xl transition-all duration-200 cursor-pointer",
        "bg-card/50 border border-border/50",
        "hover:bg-card hover:border-border",
        isExpanded && "bg-card border-border shadow-sm"
      )}
    >
      {/* Header row */}
      <div 
        className="flex items-center gap-4 py-3 px-4"
        onClick={handleClick}
      >
        {/* Task count on the left */}
        <div 
          className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ 
            backgroundColor: `${project.color}20`,
            color: project.color 
          }}
        >
          {projectTasks.length}
        </div>

        {/* Project name */}
        <div className="flex-1 min-w-0">
          <span className="font-medium text-foreground">
            {project.name}
          </span>
        </div>

        {/* Area badge */}
        {project.areaId && (
          <LifeAreaBadge areaId={project.areaId} className="scale-90" />
        )}

        {/* Action buttons - appear on hover */}
        <div className="flex items-center gap-1 opacity-100 pointer-events-auto md:opacity-0 md:pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto transition-all">
          {onEdit && (
            <Button 
              variant="ghost" 
              size="icon-sm" 
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="ghost" 
              size="icon-sm" 
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Expand indicator */}
        <div className="text-muted-foreground">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </div>

      {/* Expanded task list */}
      {isExpanded && (
        <div className="px-4 pb-3 pt-1 border-t border-border/30 animate-fade-in">
          {projectTasks.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">
              Nenhuma tarefa neste projeto.
            </p>
          ) : (
            <div className="space-y-1.5">
              {projectTasks.map(task => (
                <div 
                  key={task.id}
                  className="flex items-center gap-2 text-sm py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskClick?.(task);
                  }}
                >
                  <div className={cn(
                    "h-2.5 w-2.5 rounded-full border-2 flex-shrink-0",
                    task.status === 'done' 
                      ? "bg-primary border-primary" 
                      : "border-muted-foreground"
                  )} />
                  <span className={cn(
                    "flex-1 truncate",
                    task.status === 'done' && "line-through text-muted-foreground"
                  )}>
                    {task.title}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {/* Progress indicator */}
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{completedTasks.length}/{projectTasks.length} concluídas</span>
            </div>
            {onAddTask && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddTask();
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Nova Tarefa
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ProjectListProps {
  projects: Project[];
  tasks: Task[];
  selectedProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onEditTask?: (task: Task) => void;
  onAddTask?: (projectId: string) => void;
  viewMode?: 'cards' | 'minimal';
}

export function ProjectList({
  projects,
  tasks,
  selectedProjectId,
  onSelectProject,
  onEditProject,
  onDeleteProject,
  onEditTask,
  onAddTask,
  viewMode = 'cards',
}: ProjectListProps) {
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/50 p-8 text-center">
        <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground">Nenhum projeto criado ainda.</p>
        <p className="text-xs text-muted-foreground mt-1">
          Clique em "Novo Projeto" para começar.
        </p>
      </div>
    );
  }

  // Helper to get task counts for a project
  const getProjectTaskCounts = (projectId: string) => {
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    const completedTasks = projectTasks.filter(t => t.status === 'done');
    return { total: projectTasks.length, completed: completedTasks.length };
  };

  return (
    <div className={viewMode === 'minimal' ? "space-y-3" : "space-y-3"}>
      {/* Minimal view */}
      {viewMode === 'minimal' && projects.map((project) => (
        <MinimalProjectItem
          key={project.id}
          project={project}
          tasks={tasks}
          isSelected={selectedProjectId === project.id}
          onSelect={() => onSelectProject(selectedProjectId === project.id ? null : project.id)}
          onEdit={() => onEditProject(project)}
          onDelete={() => setProjectToDelete(project)}
          onTaskClick={onEditTask}
          onAddTask={onAddTask ? () => onAddTask(project.id) : undefined}
        />
      ))}

      {/* Card view */}
      {viewMode === 'cards' && projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          tasks={tasks}
          isSelected={selectedProjectId === project.id}
          onSelect={() => onSelectProject(selectedProjectId === project.id ? null : project.id)}
          onEdit={() => onEditProject(project)}
          onDelete={() => setProjectToDelete(project)}
          onTaskClick={onEditTask}
          onAddTask={onAddTask ? () => onAddTask(project.id) : undefined}
        />
      ))}

      <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir projeto "{projectToDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. As tarefas associadas a este projeto NÃO serão excluídas, mas ficarão sem projeto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (projectToDelete) {
                  onDeleteProject(projectToDelete.id);
                  setProjectToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Projeto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
