import { FolderKanban, ListTodo, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectList } from "@/components/projects/ProjectCard";
import { KanbanBoard } from "@/components/projects/KanbanBoard";
import { useToast } from "@/hooks/use-toast";
import type { Task, Project } from "@/types";

interface ProjectsPageProps {
  projects: Project[];
  tasks: Task[];
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  handleEditProject: (project: Project) => void;
  deleteProject: (id: string) => Promise<boolean>;
  setEditingTask: (task: Task | null) => void;
  setIsEditModalOpen: (val: boolean) => void;
  setCreateTaskProjectId: (id: string | undefined) => void;
  setIsCreateModalOpen: (val: boolean) => void;
  projectViewMode: 'minimal' | 'cards';
  setProjectViewMode: (mode: 'minimal' | 'cards') => void;
  updateTask: (id: string, updates: Partial<Task>) => Promise<boolean>;
  handleSelectTask: (task: Task) => void;
  setIsProjectModalOpen: (val: boolean) => void;
}

export function ProjectsPage({
  projects,
  tasks,
  selectedProjectId,
  setSelectedProjectId,
  handleEditProject,
  deleteProject,
  setEditingTask,
  setIsEditModalOpen,
  setCreateTaskProjectId,
  setIsCreateModalOpen,
  projectViewMode,
  setProjectViewMode,
  updateTask,
  handleSelectTask,
  setIsProjectModalOpen,
}: ProjectsPageProps) {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="mb-2 flex items-center gap-3 font-display text-2xl font-semibold text-foreground md:text-3xl">
          <FolderKanban className="h-8 w-8 text-primary" />
          Projetos & Tarefas
        </h1>
        <p className="text-muted-foreground">
          Gerencie seus projetos e acompanhe o progresso das tarefas
        </p>
      </div>
      
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Seus Projetos</h2>
        <div className="flex items-center gap-2">
          {/* View mode toggle - single icon */}
          <button
            onClick={() => setProjectViewMode(projectViewMode === 'minimal' ? 'cards' : 'minimal')}
            className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title={projectViewMode === 'minimal' ? 'Visualizar cards' : 'Visualizar lista'}
          >
            {projectViewMode === 'minimal' ? (
              <FolderKanban className="h-4 w-4" />
            ) : (
              <ListTodo className="h-4 w-4" />
            )}
          </button>
          <Button onClick={() => setIsProjectModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Projeto
          </Button>
        </div>
      </div>

      <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
        <ProjectList
          projects={projects}
          tasks={tasks}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          onEditProject={handleEditProject}
          onDeleteProject={deleteProject}
          onEditTask={(task) => {
            setEditingTask(task);
            setIsEditModalOpen(true);
          }}
          onAddTask={(projectId) => {
            setCreateTaskProjectId(projectId);
            setIsCreateModalOpen(true);
          }}
          viewMode={projectViewMode}
        />
      </div>

      <div className="animate-fade-in space-y-4" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {selectedProjectId 
              ? `Tarefas: ${projects.find(p => p.id === selectedProjectId)?.name}`
              : "Todas as Tarefas"
            }
          </h2>
        </div>
        
        <KanbanBoard 
          tasks={selectedProjectId ? tasks.filter(t => t.projectId === selectedProjectId) : tasks}
          onTaskMove={async (taskId, newStatus) => {
            const success = await updateTask(taskId, { status: newStatus as Task['status'] });
            if (success) {
              toast({
                title: "Tarefa movida!",
                description: `Status atualizado com sucesso`,
              });
            }
          }}
          onTaskClick={(task) => handleSelectTask(task)}
        />
      </div>
    </div>
  );
}
