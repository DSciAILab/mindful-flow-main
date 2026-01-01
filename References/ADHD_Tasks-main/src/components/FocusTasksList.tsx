"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ParsedTask } from "@/utils/taskParser";
import TaskItem from "@/components/inbox/TaskItem"; // Reusing this component
import { Project } from "@/lib/supabase/projects"; // NEW IMPORT

interface FocusTasksListProps {
  tasks: ParsedTask[];
  onReturnToToDo: (task: ParsedTask) => void;
  onComplete: (task: ParsedTask) => void;
  onDelete: (task: ParsedTask) => void;
  onSave: (taskId: string, updates: Partial<ParsedTask>) => void;
  projectsList: Project[]; // NEW PROP
}

const FocusTasksList = ({
  tasks,
  onReturnToToDo,
  onComplete,
  onDelete,
  onSave,
  projectsList, // NEW
}: FocusTasksListProps) => {
  // TaskItem requires onDragStart, but we don't need dragging here.
  const handleDragStart = (e: React.DragEvent<HTMLLIElement>) => {
    e.dataTransfer.setData("text/plain", ""); // Necessary for drag to work in some browsers
    e.dataTransfer.effectAllowed = "none";
  };

  return (
    <Card className="mx-4 mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Foco do Dia</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhuma tarefa no seu Foco do Dia. Adicione tarefas na Inbox.
          </p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isFocusTask
                onDragStart={handleDragStart}
                onComplete={onComplete}
                onSave={onSave}
                onReturnToToDo={onReturnToToDo}
                onDelete={onDelete}
                projectsList={projectsList} // NEW: Passar projectsList
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default FocusTasksList;