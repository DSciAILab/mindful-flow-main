"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Layout from "@/components/Layout";
import { useSession } from "@/integrations/supabase/auth";
import { useInbox } from "@/hooks/useInbox";
import TaskCardNewDesign from "@/components/TaskCardNewDesign";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarIcon } from "@radix-ui/react-icons";
import { supabaseDb } from "@/lib/supabase";
import { toast } from "sonner";
import { IndexPageSkeleton } from "@/components/LoadingSkeletons";
import TaskDetailSheet from "@/components/TaskDetailSheet";
import DailyMoodTracker from "@/components/DailyMoodTracker";
import { useTimer } from "@/contexts/TimerContext";
import type { ParsedTask } from "@/utils/taskParser";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const TodayView = () => {
  const { user, isLoading: isSessionLoading } = useSession();
  const userId = user?.id;

  const {
    displayTasksToDo,
    tasksDoneToday,
    tasksCompleted,
    handleTaskCompletion,
    handleSaveTaskDetails,
    handleDuplicateTask,
    handleTaskCancellation,
    setIsSheetOpen,
    selectedTask,
    isSheetOpen,
    projectsList,
    hashtagsList,
    activeTasksStats,
    completedTasksStats,
  } = useInbox(userId);

  const [profile, setProfile] = useState<{
    first_name: string | null;
    avatar_url: string | null;
    xp_points: number | null;
  } | null>(null);

  const loadProfile = useCallback(async () => {
    if (userId) {
      const userProfile = await supabaseDb.getProfile(userId);
      setProfile(userProfile);
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const allTasksForDisplay = useMemo(() => {
    const combined: ParsedTask[] = [...tasksDoneToday];
    const focusIds = new Set(tasksDoneToday.map((task) => task.id));

    displayTasksToDo.forEach((task) => {
      if (!focusIds.has(task.id)) {
        combined.push(task);
      }
    });

    combined.sort((a, b) => {
      if (tasksDoneToday.find((task) => task.id === a.id)) return -1;
      if (tasksDoneToday.find((task) => task.id === b.id)) return 1;

      if (a.priority === "high" && b.priority !== "high") return -1;
      if (b.priority === "high" && a.priority !== "high") return 1;

      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;

      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    });

    return combined;
  }, [displayTasksToDo, tasksDoneToday]);

  const focusTaskIds = useMemo(
    () => new Set(tasksDoneToday.map((task) => task.id)),
    [tasksDoneToday],
  );

  const backlogTasks = useMemo(
    () => allTasksForDisplay.filter((task) => !focusTaskIds.has(task.id)),
    [allTasksForDisplay, focusTaskIds],
  );

  const completedTasksToday = useMemo(() => {
    return tasksCompleted.filter((task) => {
      const taskUpdatedAt = task.updated_at ? new Date(task.updated_at) : null;
      const today = new Date();
      return (
        taskUpdatedAt &&
        taskUpdatedAt.getDate() === today.getDate() &&
        taskUpdatedAt.getMonth() === today.getMonth() &&
        taskUpdatedAt.getFullYear() === today.getFullYear()
      );
    });
  }, [tasksCompleted]);

  const pendingCount = backlogTasks.length;
  const focusCount = tasksDoneToday.length;
  const completedTodayCount = completedTasksToday.length;

  const handleOpenAddTaskDialog = () => {
    toast.info("Funcionalidade de adicionar tarefa será implementada aqui.");
  };

  const { selectTaskAndEnterFocus } = useTimer();

  const handleTaskCardSelect = (task: ParsedTask) => {
    selectTaskAndEnterFocus(task);
  };

  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(today);
  const greetingName =
    profile?.first_name || (user?.email ? user.email.split("@")[0] : "você");

  if (isSessionLoading) {
    return <IndexPageSkeleton />;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <header className="flex flex-col-reverse gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-muted-foreground capitalize">{formattedDate}</p>
            <h1 className="text-3xl font-semibold mt-1">
              Ola, {greetingName}! Vamos planejar o seu dia?
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center bg-muted px-3 py-1 rounded-full text-sm font-medium">
              <StarIcon className="h-4 w-4 mr-2 text-yellow-500" />
              <span>{profile?.xp_points ?? 0} XP</span>
            </div>
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={profile?.avatar_url || "https://github.com/shadcn.png"}
                alt={profile?.first_name || "User"}
              />
              <AvatarFallback>{profile?.first_name ? profile.first_name[0] : "U"}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-3">
          <section className="space-y-6 xl:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Foco do Dia</CardTitle>
                <CardDescription>
                  As tarefas que você escolheu para dar atenção máxima hoje.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tasksDoneToday.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                    {tasksDoneToday.map((task) => (
                      <TaskCardNewDesign
                        key={task.id}
                        task={task}
                        onComplete={handleTaskCompletion}
                        onEdit={handleTaskCardSelect}
                        taskStats={activeTasksStats[task.id]}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Selecione até três tarefas na Inbox para focar aqui.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Próximas tarefas</CardTitle>
                <CardDescription>
                  Organize o que falta para avançar — priorize, reagende ou conclua.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {backlogTasks.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                    {backlogTasks.map((task) => (
                      <TaskCardNewDesign
                        key={task.id}
                        task={task}
                        onComplete={handleTaskCompletion}
                        onEdit={handleTaskCardSelect}
                        taskStats={activeTasksStats[task.id]}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma tarefa pendente por aqui. Continue assim!
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tarefas concluídas hoje</CardTitle>
                <CardDescription>
                  Revise suas vitórias para manter o ritmo de produtividade.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {completedTasksToday.length > 0 ? (
                  completedTasksToday.map((task) => (
                    <TaskCardNewDesign
                      key={task.id}
                      task={task}
                      onComplete={handleTaskCompletion}
                      onEdit={handleTaskCardSelect}
                      taskStats={completedTasksStats[task.id]}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Ainda não registramos conquistas hoje. Que tal começar agora?
                  </p>
                )}
              </CardContent>
            </Card>
          </section>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumo rápido</CardTitle>
                <CardDescription>Veja como está o seu progresso agora.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border bg-background p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Foco
                    </p>
                    <p className="text-3xl font-semibold">{focusCount}</p>
                    <p className="text-xs text-muted-foreground">
                      tarefas em andamento
                    </p>
                  </div>
                  <div className="rounded-lg border bg-background p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Pendentes
                    </p>
                    <p className="text-3xl font-semibold">{pendingCount}</p>
                    <p className="text-xs text-muted-foreground">
                      aguardando sua atenção
                    </p>
                  </div>
                  <div className="rounded-lg border bg-background p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Concluídas
                    </p>
                    <p className="text-3xl font-semibold">{completedTodayCount}</p>
                    <p className="text-xs text-muted-foreground">
                      tarefas finalizadas hoje
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-muted p-4">
                  <p className="text-sm text-muted-foreground">
                    XP acumulado
                  </p>
                  <p className="text-2xl font-semibold flex items-center gap-2 mt-2">
                    <StarIcon className="h-5 w-5 text-yellow-500" />
                    {profile?.xp_points ?? 0} pontos
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Continue concluindo tarefas para desbloquear mais recompensas.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="-mx-4 sm:mx-0">
              <DailyMoodTracker userId={userId} />
            </div>
          </aside>
        </div>
      </div>

      <Button
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg bg-green-500 hover:bg-green-600 text-white"
        size="icon"
        onClick={handleOpenAddTaskDialog}
      >
        <Plus className="h-7 w-7" />
      </Button>

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

export default TodayView;