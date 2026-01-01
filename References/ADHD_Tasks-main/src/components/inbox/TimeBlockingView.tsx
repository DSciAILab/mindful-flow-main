"use client";

import { useState, useEffect, useCallback } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import DraggableTaskList from "./DraggableTaskList";
import TimeGrid from "./TimeGrid";
import { useSession } from "@/integrations/supabase/auth";
import { supabaseDb } from "@/lib/supabase";
import { ParsedTask } from "@/utils/taskParser";

const TimeBlockingView = () => {
  const { user } = useSession();
  const userId = user?.id;
  const [unscheduledTasks, setUnscheduledTasks] = useState<ParsedTask[]>([]);

  const loadUnscheduledTasks = useCallback(async () => {
    if (userId) {
      const tasks = await supabaseDb.getUnscheduledTasks(userId);
      setUnscheduledTasks(tasks);
    }
  }, [userId]);

  useEffect(() => {
    loadUnscheduledTasks();
  }, [loadUnscheduledTasks]);

  const handleTaskScheduled = (scheduledTask: ParsedTask) => {
    // Optimistically remove the task from the list for a real-time feel
    setUnscheduledTasks(prevTasks => prevTasks.filter(t => t.id !== scheduledTask.id));
  };

  return (
    <div className="h-[calc(100vh-180px)] p-4"> {/* Adjust height based on header/footer */}
      <ResizablePanelGroup direction="horizontal" className="rounded-lg border">
        <ResizablePanel defaultSize={30} minSize={20}>
          <div className="flex h-full items-center justify-center p-2">
            <DraggableTaskList tasks={unscheduledTasks} />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={70} minSize={50}>
          <div className="flex h-full items-center justify-center p-2">
            <TimeGrid
              onScheduledBlockAdded={handleTaskScheduled}
              onScheduledBlockDeleted={loadUnscheduledTasks}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default TimeBlockingView;