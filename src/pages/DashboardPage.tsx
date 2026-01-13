import { DndContext } from "@dnd-kit/core";
import { Sparkles } from "lucide-react";
import { DailyMissionCard } from "@/components/daily-mission/DailyMissionCard";
import { QuickCapture } from "@/components/dashboard/QuickCapture";
import { Big3Widget } from "@/components/dashboard/Big3Widget";
import { TaskList } from "@/components/dashboard/TaskList";
import { InboxPreview } from "@/components/dashboard/InboxPreview";
import { TimerWidget } from "@/components/dashboard/TimerWidget";
import { HabitWidget } from "@/components/dashboard/HabitWidget";
import { DailyProgress } from "@/components/dashboard/DailyProgress";
import { DailyReflection } from "@/components/dashboard/DailyReflection";
import type { Task, CaptureItem } from "@/types";

interface DashboardPageProps {
  greetingName: string | null;
  missionConfig: any;
  dailyMission: any;
  handleTaskComplete: (taskId: string) => void;
  toggleHabit: (habitId: string, date: Date) => void;
  setActiveView: (view: string) => void;
  handleSelectTask: (task: Task) => void;
  handleCapture: (type: string, content: string, audioUrl?: string, projectId?: string) => Promise<void>;
  big3Tasks: Task[];
  toggleBig3: (taskId: string) => void;
  setIsSelectingForBig3: (val: boolean) => void;
  setIsTaskSelectorOpen: (val: boolean) => void;
  tasks: Task[];
  selectedTask: Task | null;
  setIsCreateModalOpen: (val: boolean) => void;
  handleDeleteTask: (taskId: string) => void;
  handleSplitTask: (taskId: string) => void;
  handleConvertSubtask: (parentTaskId: string, subtaskTitle: string, subtaskIndex: number) => void;
  handleEditTask: (task: Task) => void;
  isSplitting: boolean;
  subtasks: Record<string, string[]>;
  inboxItems: CaptureItem[];
  setProcessingInboxItem: (item: CaptureItem) => void;
  handleDeleteInboxItem: (id: string) => void;
  updateCaptureItem?: (id: string, content: string) => Promise<boolean>;
  timer: any;
  handleTaskDone: () => void;
  handleClearTask: () => void;
  stats: any;
  dailyGoals: any;
  handleReflectionComplete: (reflection: any) => void;
  sensors: any[];
  handleDragEnd: (event: any) => void;
}

export function DashboardPage({
  greetingName,
  missionConfig,
  dailyMission,
  handleTaskComplete,
  toggleHabit,
  setActiveView,
  handleSelectTask,
  handleCapture,
  big3Tasks,
  toggleBig3,
  setIsSelectingForBig3,
  setIsTaskSelectorOpen,
  tasks,
  selectedTask,
  setIsCreateModalOpen,
  handleDeleteTask,
  handleSplitTask,
  handleConvertSubtask,
  handleEditTask,
  isSplitting,
  subtasks,
  inboxItems,
  setProcessingInboxItem,
  handleDeleteInboxItem,
  updateCaptureItem,
  timer,
  handleTaskDone,
  handleClearTask,
  stats,
  dailyGoals,
  handleReflectionComplete,
  sensors,
  handleDragEnd,
}: DashboardPageProps) {
  return (
    <>
      {/* Welcome section */}
      <div className="mb-6 animate-fade-in">
        <h1 className="flex items-center gap-3 font-display text-2xl font-semibold text-foreground md:text-3xl">
          <Sparkles className="h-8 w-8 text-primary" />
          {greetingName 
            ? `Olá, ${greetingName}! Vamos conquistar o dia?`
            : 'Olá! Vamos conquistar o dia?'
          }
        </h1>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
          })}
        </p>
      </div>

      {/* Main grid */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-4 lg:col-span-2">
          {/* Daily Mission Card - shows at top if enabled */}
          {missionConfig?.showOnStartup && (
            <div className="animate-fade-in" style={{ animationDelay: '50ms' }}>
              <DailyMissionCard
                mission={dailyMission}
                onTaskComplete={handleTaskComplete}
                onHabitComplete={(habitId: string) => toggleHabit(habitId, new Date())}
                onViewAll={() => setActiveView('tasks')}
                onSelectTask={handleSelectTask}
              />
            </div>
          )}
          
          <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <QuickCapture onCapture={handleCapture} />
          </div>
          
          <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
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
              tasks={tasks}
              selectedTaskId={selectedTask?.id || null}
              onComplete={handleTaskComplete}
              onSelectTask={handleSelectTask}
              onAddTask={() => setIsCreateModalOpen(true)}
              onDeleteTask={handleDeleteTask}
              onSplitTask={handleSplitTask}
              onConvertSubtask={handleConvertSubtask}
              onEditTask={handleEditTask}
              onToggleBig3={toggleBig3}
              isSplitting={isSplitting}
              subtasks={subtasks}
            />
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <InboxPreview 
              items={inboxItems}
              onViewAll={() => setActiveView('inbox')}
              onProcess={(item) => setProcessingInboxItem(item)}
              onDelete={handleDeleteInboxItem}
              onUpdate={(id, content) => updateCaptureItem ? updateCaptureItem(id, content) : Promise.resolve(false)}
            />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
            <TimerWidget 
              formattedTime={timer.formattedTime}
              progress={timer.progress}
              isRunning={timer.isRunning}
              isPaused={timer.isPaused}
              type={timer.type}
              sessionsCompleted={timer.sessionsCompleted}
              totalBreakTime={timer.totalBreakTime}
              selectedTask={selectedTask}
              onStart={timer.start}
              onPause={timer.pause}
              onDone={handleTaskDone}
              onBreak={timer.goToBreak}
              onClearTask={handleClearTask}
              onRequestTaskSelection={() => setIsTaskSelectorOpen(true)}
            />
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <HabitWidget />
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '250ms' }}>
            <DailyProgress stats={stats} dailyGoals={dailyGoals} />
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '350ms' }}>
            <DailyReflection onComplete={handleReflectionComplete} />
          </div>
        </div>
      </div>
      </DndContext>
    </>
  );
}
