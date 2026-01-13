import { DndContext } from "@dnd-kit/core";
import { CheckSquare, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Big3Widget } from "@/components/dashboard/Big3Widget";
import { TaskList } from "@/components/dashboard/TaskList";
import { TaskPriorityCompareModal } from "@/components/dashboard/TaskPriorityCompareModal";
import type { Task } from "@/types";

interface TasksPageProps {
  sensors: any[];
  handleDragEnd: (event: any) => void;
  tasks: Task[];
  visibleTasks: Task[];
  showCompletedTasks: boolean;
  handleToggleCompletedTasks: () => void;
  selectedTask: Task | null;
  handleTaskComplete: (taskId: string) => void;
  handleSelectTask: (task: Task) => void;
  setIsCreateModalOpen: (val: boolean) => void;
  handleDeleteTask: (taskId: string) => void;
  handleSplitTask: (taskId: string) => void;
  handleConvertSubtask: (parentTaskId: string, subtaskTitle: string, subtaskIndex: number) => void;
  handleEditTask: (task: Task) => void;
  isSplitting: boolean;
  subtasks: Record<string, string[]>;
  isPriorityCompareOpen: boolean;
  setIsPriorityCompareOpen: (val: boolean) => void;
  big3Tasks: Task[];
  toggleBig3: (taskId: string) => void;
  setIsSelectingForBig3: (val: boolean) => void;
  setIsTaskSelectorOpen: (val: boolean) => void;
  reorderTasksByPriority: (sortedTaskIds: string[]) => void;
}

export function TasksPage({
  sensors,
  handleDragEnd,
  tasks,
  visibleTasks,
  showCompletedTasks,
  handleToggleCompletedTasks,
  selectedTask,
  handleTaskComplete,
  handleSelectTask,
  setIsCreateModalOpen,
  handleDeleteTask,
  handleSplitTask,
  handleConvertSubtask,
  handleEditTask,
  isSplitting,
  subtasks,
  isPriorityCompareOpen,
  setIsPriorityCompareOpen,
  big3Tasks,
  toggleBig3,
  setIsSelectingForBig3,
  setIsTaskSelectorOpen,
  reorderTasksByPriority,
}: TasksPageProps) {
  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        <div className="animate-fade-in flex items-start justify-between">
          <div>
            <h1 className="mb-2 flex items-center gap-3 font-display text-2xl font-semibold text-foreground md:text-3xl">
              <CheckSquare className="h-8 w-8 text-primary" />
              Tarefas
            </h1>
            <p className="text-muted-foreground">
              Gerencie suas tarefas e subtarefas
            </p>
          </div>
          {tasks.filter(t => !t.completedAt).length >= 2 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPriorityCompareOpen(true)}
              className="flex items-center gap-2"
            >
              <Scale className="h-4 w-4" />
              Priorizar
            </Button>
          )}
        </div>
        
        {/* Big 3 Widget - espelho do dashboard */}
        <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <Big3Widget 
            big3Tasks={big3Tasks} 
            onSelectTask={handleSelectTask}
            onToggleBig3={toggleBig3}
            onAddBig3={() => {
              setIsSelectingForBig3(true);
              setIsTaskSelectorOpen(true);
            }}
          />
        </div>
        
        <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <TaskList 
            tasks={visibleTasks}
            showCompleted={showCompletedTasks}
            onToggleCompleted={handleToggleCompletedTasks}
            selectedTaskId={selectedTask?.id || null}
            onComplete={handleTaskComplete}
            onSelectTask={handleSelectTask}
            onAddTask={() => setIsCreateModalOpen(true)}
            onDeleteTask={handleDeleteTask}
            onSplitTask={handleSplitTask}
            onConvertSubtask={handleConvertSubtask}
            onEditTask={handleEditTask}
            isSplitting={isSplitting}
            subtasks={subtasks}
          />
        </div>

        {/* Priority Compare Modal */}
        <TaskPriorityCompareModal
          isOpen={isPriorityCompareOpen}
          onClose={() => setIsPriorityCompareOpen(false)}
          tasks={tasks.filter(t => !t.completedAt)}
          onComplete={reorderTasksByPriority}
        />
      </div>
    </DndContext>
  );
}
