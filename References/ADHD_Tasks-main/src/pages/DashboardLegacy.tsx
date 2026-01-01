"use client";

import { useState, useEffect, useCallback } from "react";
import Layout from "@/components/Layout";
import { useSession } from "@/integrations/supabase/auth";
import { useInbox } from "@/hooks/useInbox";
import DailyFocusTasks from "@/components/DailyFocusTasks";
import RoutineChecklist from "@/components/RoutineChecklist";
import DailyMoodTracker from "@/components/DailyMoodTracker";
import QuoteDisplay from "@/components/QuoteDisplay";
import CompletedTasksList from "@/components/CompletedTasksList";
import { supabaseDb } from "@/lib/supabase";
import { IndexPageSkeleton } from "@/components/LoadingSkeletons";
import { useTimer } from "@/contexts/TimerContext";
import CurrentTaskCard from "@/components/CurrentTaskCard";
import TaskDetailSheet from "@/components/TaskDetailSheet";
import { Habit } from "@/components/habits/types";

const Index = () => {
  const { user, isLoading: isSessionLoading } = useSession();
  const userId = user?.id;
  const { isFocusMode, toggleFocusMode, activeTask } = useTimer();

  const {
    tasksDoneToday,
    tasksCompleted,
    handleReturnTaskToToDoList,
    handleTaskCompletion,
    handleTaskDeletion,
    handleTaskCancellation,
    handleSaveTaskDetails,
    handleDuplicateTask,
    setIsSheetOpen,
    selectedTask,
    isSheetOpen,
    projectsList,
    hashtagsList,
    loadAllTasks,
    activeTasksStats,
  } = useInbox(userId);

  const [habits, setHabits] = useState<Habit[]>([]);
  const [profile, setProfile] = useState<{ quote_duration_seconds: number | null } | null>(null);

  const loadHabits = useCallback(async () => {
    if (userId) {
      const userHabits = await supabaseDb.getHabits(userId);
      setHabits(userHabits);
    }
  }, [userId]);

  const loadProfile = useCallback(async () => {
    if (userId) {
      const userProfile = await supabaseDb.getProfile(userId);
      setProfile(userProfile);
    }
  }, [userId]);

  useEffect(() => {
    loadHabits();
    loadProfile();
  }, [loadHabits, loadProfile]);

  const handleTaskAddedToInbox = () => {
    loadAllTasks();
  };

  const handleTaskAddedToProject = () => {
    loadAllTasks();
  };

  const handleNoteAdded = () => {};

  if (isSessionLoading) {
    return <IndexPageSkeleton />;
  }

  return (
    <Layout
      onTaskAddedToInbox={handleTaskAddedToInbox}
      onTaskAddedToProject={handleTaskAddedToProject}
      onNoteAdded={handleNoteAdded}
    >
      {isFocusMode && activeTask ? (
        <div
          className="fixed inset-0 bg-background z-40 flex flex-col items-center justify-center p-4 transition-transform duration-300 ease-in-out translate-x-0"
        >
          <CurrentTaskCard isFocusMode={isFocusMode} />
          <button
            onClick={toggleFocusMode}
            className="mt-4 text-sm text-muted-foreground underline"
          >
            Voltar para o Dashboard
          </button>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row h-full">
          <div className="flex-grow overflow-y-auto">
            <QuoteDisplay durationInSeconds={profile?.quote_duration_seconds || 30} />
            <DailyFocusTasks
              tasks={tasksDoneToday}
              onReturnToToDo={handleReturnTaskToToDoList}
              onComplete={handleTaskCompletion}
              onDelete={handleTaskDeletion}
              activeTasksStats={activeTasksStats}
            />
            <RoutineChecklist habits={habits} />
            <DailyMoodTracker userId={userId} />
            <CompletedTasksList
              tasks={tasksCompleted.filter(task => {
                const taskUpdatedAt = task.updated_at ? new Date(task.updated_at) : null;
                const today = new Date();
                return taskUpdatedAt && taskUpdatedAt.getDate() === today.getDate() &&
                       taskUpdatedAt.getMonth() === today.getMonth() &&
                       taskUpdatedAt.getFullYear() === today.getFullYear();
              })}
              onDuplicate={handleDuplicateTask}
            />
          </div>
        </div>
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
    </Layout>
  );
};

export default Index;