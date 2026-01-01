import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FolderKanban, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  ListTodo
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
}

export function ProjectCard({ 
  project, 
  tasks, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete,
  onTaskClick
}: ProjectCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Calculate progress based on tasks
  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const completedTasks = projectTasks.filter(t => t.status === 'done');
  const progress = projectTasks.length > 0 
    ? Math.round((completedTasks.length / projectTasks.length) * 100) 
    : 0;

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
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
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {project.description}
                </p>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon-sm" className="flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
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
}

export function ProjectList({
  projects,
  tasks,
  selectedProjectId,
  onSelectProject,
  onEditProject,
  onDeleteProject,
  onEditTask,
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

  return (
    <div className="space-y-3">
      {/* All tasks option */}
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow-md",
          selectedProjectId === null 
            ? "ring-2 ring-primary border-primary/50" 
            : "hover:border-primary/30"
        )}
        onClick={() => onSelectProject(null)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
              <Circle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Todas as Tarefas</h3>
              <p className="text-xs text-muted-foreground">
                {tasks.length} tarefas no total
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project cards */}
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          tasks={tasks}
          isSelected={selectedProjectId === project.id}
          onSelect={() => onSelectProject(project.id)}
          onEdit={() => onEditProject(project)}
          onDelete={() => setProjectToDelete(project)}
          onTaskClick={onEditTask}
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
