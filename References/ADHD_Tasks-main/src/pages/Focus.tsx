"use client";

import { useState, useEffect } from "react";
import { useTimer } from "@/contexts/TimerContext";
import { useInbox } from "@/hooks/useInbox";
import { useSession } from "@/integrations/supabase/auth";
import { supabaseDb } from "@/lib/supabase";
import { ParsedTask } from "@/utils/taskParser";
import { Button } from "@/components/ui/button";
import { Play, Pause, Coffee, Check, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import CircularProgressTimer from "@/components/CircularProgressTimer";
import { PomodoroIndicators } from "@/components/focus/PomodoroIndicators";
import { CompletionOverlay } from "@/components/focus/CompletionOverlay";
import { useNavigate } from "react-router-dom";
import QuoteDisplay from "@/components/QuoteDisplay";

const Focus = () => {
  const { user } = useSession();
  const navigate = useNavigate();
  const {
    activeTask,
    setActiveTask,
    timeLeft,
    totalDuration,
    isRunning,
    isBreak,
    startTimer,
    pauseTimer,
    skipToBreak,
    completeActiveTask,
    pomodoroCount,
    overtimeTaken,
    taskOvertimeTaken,
    isBreakGracePeriod,
    skipBreak
  } = useTimer();

  const { tasksDoneToday, loadAllTasks } = useInbox(user?.id);
  const [isTaskSelectorOpen, setIsTaskSelectorOpen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);
  const [quoteDuration, setQuoteDuration] = useState(30);

  // Carregar tarefas e configurações ao entrar
  useEffect(() => {
    loadAllTasks();
    const fetchProfile = async () => {
      if (user?.id) {
        const profile = await supabaseDb.getProfile(user.id);
        if (profile?.quote_duration_seconds) {
          setQuoteDuration(profile.quote_duration_seconds);
        }
      }
    };
    fetchProfile();
  }, [user?.id]);

  useEffect(() => {
    if (!isRunning && activeTask && !isBreak && !isBreakGracePeriod) {
        setShowControls(true);
    } else if (isBreak) {
        setShowControls(true);
    } else {
        setShowControls(false);
    }
  }, [isRunning, activeTask, isBreak, isBreakGracePeriod]);

  const formatTime = (seconds: number) => {
    const absSeconds = Math.abs(seconds);
    const minutes = Math.floor(absSeconds / 60);
    const remainingSeconds = absSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    if (isRunning) {
      pauseTimer();
    } else {
      if (!activeTask) {
        setIsTaskSelectorOpen(true);
        return;
      }
      startTimer();
    }
  };

  const handleStartBreak = () => {
    if (!isBreak) {
        skipToBreak(true); // Auto start break
    } else {
        skipBreak(true); // Auto start focus
    }
  };

  const handleCompleteTask = () => {
    setShowCompletionOverlay(true);
  };

  const handleFinishCompletion = () => {
    completeActiveTask();
    setShowCompletionOverlay(false);
    setShowControls(false);
  };

  const selectTask = (task: ParsedTask) => {
    setActiveTask(task);
    setIsTaskSelectorOpen(false);
  };

  // Helpers para badges
  const getPriorityLabel = (priority: string | null) => {
    switch (priority) {
      case 'high': return { label: 'Alta Prioridade', color: 'bg-red-500/10 text-red-500 border-red-500/20' };
      case 'medium': return { label: 'Média Prioridade', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' };
      case 'low': return { label: 'Baixa Prioridade', color: 'bg-green-500/10 text-green-500 border-green-500/20' };
      default: return null;
    }
  };

  const getCategoryLabel = (category: string | null) => {
    switch (category) {
      case 'red': return { label: 'Outros (Red)', color: 'bg-red-500' };
      case 'yellow': return { label: 'Melhor Fazer (Yellow)', color: 'bg-yellow-500' };
      case 'purple': return { label: 'Feel Good (Purple)', color: 'bg-purple-500' };
      case 'green': return { label: 'Nice to Have (Green)', color: 'bg-green-500' };
      default: return null;
    }
  };

  const bgColor = isBreak ? "bg-teal-900/20" : "bg-background";
  const timerColor = isBreak ? "text-teal-500" : overtimeTaken > 0 || taskOvertimeTaken > 0 ? "text-red-500" : "text-primary";

  return (
    <div className={cn("h-[100dvh] w-full flex flex-col transition-colors duration-500 overflow-hidden relative", bgColor)}>
      {/* Header */}
      <header className="p-4 flex items-center justify-between w-full z-20 bg-transparent absolute top-0 left-0">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="font-semibold text-lg opacity-80">Focus Mode</h1>
        <div className="w-10"></div>
      </header>

      {showCompletionOverlay && (
        <CompletionOverlay onClose={handleFinishCompletion} />
      )}

      <main className="flex-grow flex flex-col items-center justify-between w-full h-full pt-16 pb-6 px-4">
        
        {/* 1. Quotes Area - Compact and Flexible */}
        <div className="w-full max-w-md flex-shrink-0 min-h-[40px] flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity z-10">
           <QuoteDisplay durationInSeconds={quoteDuration} />
        </div>

        {/* Container Central */}
        <div className="flex flex-col items-center justify-center flex-grow w-full gap-4 md:gap-8">
            
            {/* 2. Task Display / Selector Button */}
            <div className="w-full flex justify-center z-20 flex-shrink-0">
              {activeTask ? (
                <div onClick={() => setIsTaskSelectorOpen(true)} className="cursor-pointer group text-center w-full max-w-2xl px-4">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {activeTask.title}
                    </h2>
                    
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        {activeTask.project && (
                            <Badge variant="secondary" className="text-xs">@{activeTask.project}</Badge>
                        )}
                        
                        {(() => {
                            const priority = getPriorityLabel(activeTask.priority);
                            if (priority) return <Badge variant="outline" className={cn("text-xs", priority.color)}>{priority.label}</Badge>;
                        })()}
                        
                        {(() => {
                            const cat = getCategoryLabel(activeTask.category);
                            if (cat) return <div className={cn("w-3 h-3 rounded-full", cat.color)} title={cat.label} />;
                        })()}
                    </div>
                </div>
              ) : (
                <Button 
                    className="rounded-full w-24 h-24 md:w-32 md:h-32 text-xl md:text-2xl font-bold bg-muted text-muted-foreground hover:bg-muted/80 hover:text-primary shadow-inner transition-all duration-300"
                    onClick={() => setIsTaskSelectorOpen(true)}
                >
                    Focus
                </Button>
              )}
            </div>

            {/* 3. Auto-Adjustable Timer Display */}
            {/* vmin ensures it scales with the smallest viewport dimension */}
            <div className="relative w-[60vmin] h-[60vmin] max-w-[450px] max-h-[450px] aspect-square flex-shrink-0 flex items-center justify-center">
                <CircularProgressTimer
                    timeLeft={isBreak ? timeLeft : (timeLeft === 0 && taskOvertimeTaken > 0 ? 0 : timeLeft)}
                    totalDuration={totalDuration}
                    isBreak={isBreak}
                    isOvertime={overtimeTaken > 0}
                    overtimeTaken={overtimeTaken}
                    isBreakGracePeriod={isBreakGracePeriod}
                    isTaskGracePeriod={false} 
                    taskOvertimeTaken={taskOvertimeTaken}
                    isTaskOvertime={taskOvertimeTaken > 0}
                >
                    <div className="flex flex-col items-center justify-center">
                        {/* Font size based on vmin to match container */}
                        <span className={cn("text-[16vmin] font-bold tracking-tighter leading-none tabular-nums", timerColor)}>
                            {isBreak 
                                ? formatTime(timeLeft) 
                                : taskOvertimeTaken > 0 
                                    ? `+${formatTime(taskOvertimeTaken)}`
                                    : formatTime(timeLeft)
                            }
                        </span>
                        <span className="text-sm md:text-base text-muted-foreground mt-2 uppercase tracking-widest opacity-70 font-medium">
                            {isBreak ? "Break" : taskOvertimeTaken > 0 ? "Overtime" : "Focus"}
                        </span>
                    </div>
                </CircularProgressTimer>
            </div>

            <PomodoroIndicators totalSessions={4} completedSessions={pomodoroCount % 4} />
        </div>

        {/* Controls Section */}
        <div className="relative flex items-center justify-center h-20 w-full max-w-md flex-shrink-0 z-20 mb-2">
            
            {/* Left Button (Break/Focus) */}
            <div className={cn(
                "absolute transition-all duration-500 ease-out transform",
                showControls ? "translate-x-[-80px] opacity-100 scale-100" : "translate-x-0 opacity-0 scale-50 pointer-events-none"
            )}>
                <Button 
                    variant="secondary" 
                    size="icon" 
                    className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-secondary/80 hover:bg-secondary backdrop-blur-sm shadow-lg"
                    onClick={handleStartBreak}
                >
                    {isBreak ? <Play className="h-5 w-5 md:h-6 md:w-6 ml-1" /> : <Coffee className="h-5 w-5 md:h-6 md:w-6" />}
                </Button>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] md:text-xs text-muted-foreground font-medium">
                    {isBreak ? "Focus" : "Break"}
                </span>
            </div>

            {/* Center Button (Play/Pause) */}
            <div className="z-20">
                <Button 
                    size="icon" 
                    className={cn(
                        "h-16 w-16 md:h-20 md:w-20 rounded-full shadow-xl transition-all duration-300",
                        isRunning 
                            ? "bg-background border-2 border-primary text-primary hover:bg-primary/10" 
                            : "bg-primary text-primary-foreground hover:scale-105 hover:bg-primary/90"
                    )}
                    onClick={handlePlayPause}
                >
                    {isRunning ? <Pause className="h-7 w-7 md:h-8 md:w-8 fill-current" /> : <Play className="h-7 w-7 md:h-8 md:w-8 ml-1 fill-current" />}
                </Button>
            </div>

            {/* Right Button (Done) */}
            <div className={cn(
                "absolute transition-all duration-500 ease-out transform",
                showControls ? "translate-x-[80px] opacity-100 scale-100" : "translate-x-0 opacity-0 scale-50 pointer-events-none"
            )}>
                <Button 
                    variant="secondary" 
                    size="icon" 
                    className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-secondary/80 hover:bg-secondary backdrop-blur-sm shadow-lg"
                    onClick={handleCompleteTask}
                >
                    <Check className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] md:text-xs text-muted-foreground font-medium">
                    Done
                </span>
            </div>
        </div>

      </main>

      {/* Task Selector Dialog */}
      <Dialog open={isTaskSelectorOpen} onOpenChange={setIsTaskSelectorOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Select a Task for Focus</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 mt-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Focus of the Day</h3>
                {tasksDoneToday.length > 0 ? (
                    tasksDoneToday.map(task => (
                        <div 
                            key={task.id} 
                            className="p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors flex justify-between items-center"
                            onClick={() => selectTask(task)}
                        >
                            <span className="font-medium">{task.title}</span>
                            <div className="flex gap-2">
                                {task.priority === 'high' && <Badge variant="outline" className="text-[10px] border-red-200 text-red-500">High</Badge>}
                                {task.project && <span className="text-xs text-muted-foreground">@{task.project}</span>}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No tasks in "Focus of the Day". Add some from Inbox!
                    </p>
                )}
                
                <div className="pt-4 border-t mt-4">
                    <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={() => navigate('/inbox')}>
                        Go to Inbox to plan
                    </Button>
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Focus;