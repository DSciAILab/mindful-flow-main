"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Check, X, RotateCcw, Info, FastForward } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ParsedTask } from "@/utils/taskParser";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTimer } from "@/contexts/TimerContext";
import CircularProgressTimer from "./CircularProgressTimer";

interface CurrentTaskCardProps {
  isFocusMode: boolean;
}

const CurrentTaskCard = ({ isFocusMode }: CurrentTaskCardProps) => {
  const {
    activeTask,
    timeLeft,
    totalDuration, // This is the total duration of the current phase (pomodoro or break)
    isRunning,
    isBreak,
    isBreakGracePeriod,
    breakGracePeriodTimeLeft,
    overtimeTaken, // Break overtime
    lastNominalBreakDuration,
    // NEW: Destructure new states
    isTaskGracePeriod,
    taskGracePeriodTimeLeft,
    taskOvertimeTaken,
    startTimer,
    pauseTimer,
    resetTimer,
    skipToBreak, // This is now "Start Break" from task grace period
    skipBreak,
    completeActiveTask,
    cancelActiveTask,
  } = useTimer();

  if (!activeTask && !isBreak && !isBreakGracePeriod && overtimeTaken === 0 && !isTaskGracePeriod && taskOvertimeTaken === 0) return null;

  const getPriorityDisplay = (priority: ParsedTask['priority']) => {
    switch (priority) {
      case 'high': return { text: 'Alta' };
      case 'medium': return { text: 'Média' };
      case 'low': return { text: 'Baixa' };
      default: return { text: 'Nenhuma' };
    }
  };

  const getCategoryDisplay = (category: ParsedTask['category']) => {
    switch (category) {
      case 'red': return { color: 'bg-red-500' };
      case 'yellow': return { color: 'bg-yellow-500' };
      case 'purple': return { color: 'bg-purple-500' };
      case 'green': return { color: 'bg-green-500' };
      default: return { color: 'bg-transparent' };
    }
  };

  const formatTime = (seconds: number) => {
    const sign = seconds < 0 ? "-" : "";
    const absSeconds = Math.abs(seconds);
    const minutes = Math.floor(absSeconds / 60);
    const remainingSeconds = absSeconds % 60;
    return `${sign}${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const cardTitle = taskOvertimeTaken > 0
    ? "Tarefa (Tempo Extra!)"
    : isTaskGracePeriod
      ? "Tarefa (Retorne!)"
      : overtimeTaken > 0
        ? "Pausa (Tempo Extra!)"
        : isBreakGracePeriod
          ? "Pausa (Retorne!)"
          : isBreak
            ? "Hora da Pausa!"
            : activeTask?.title;

  const { text: priorityText } = getPriorityDisplay(activeTask?.priority ?? null);
  const { color: categoryColor } = getCategoryDisplay(activeTask?.category ?? null);

  // Determine props for CircularProgressTimer
  let timerTimeLeft = timeLeft;
  let timerTotalDuration = totalDuration;
  let timerIsBreak = isBreak;
  let timerIsOvertime = false; // This is for break overtime
  let timerIsBreakGracePeriod = isBreakGracePeriod;
  let timerIsTaskGracePeriod = isTaskGracePeriod; // NEW
  let timerIsTaskOvertime = false; // NEW

  if (isTaskGracePeriod) { // NEW: Task grace period (yellow)
    timerTimeLeft = taskGracePeriodTimeLeft;
    timerTotalDuration = 10; // Task grace period is always 10 seconds
    timerIsBreak = false; // Still task phase
    timerIsTaskGracePeriod = true;
  } else if (taskOvertimeTaken > 0) { // NEW: Task overtime (red)
    timerTimeLeft = 0; // No countdown for the circle itself
    timerTotalDuration = 0; // No progress to show
    timerIsBreak = false; // Still task phase
    timerIsTaskOvertime = true;
  } else if (isBreakGracePeriod) { // Existing break grace period (yellow)
    timerTimeLeft = breakGracePeriodTimeLeft;
    timerTotalDuration = 20; // Break grace period is always 20 seconds
    timerIsBreak = true;
    timerIsBreakGracePeriod = true;
  } else if (overtimeTaken > 0) { // Existing break overtime (red)
    timerTimeLeft = 0;
    timerTotalDuration = 0;
    timerIsBreak = true;
    timerIsOvertime = true;
  } else if (isBreak) { // Nominal break (green)
    timerIsBreak = true;
  } else if (totalDuration > 0) { // Pomodoro (primary color)
    // Default values are already set
  }

  if (isFocusMode) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-4 md:p-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-4">
            {!isBreak && !isBreakGracePeriod && !overtimeTaken && !isTaskGracePeriod && !taskOvertimeTaken && activeTask?.category && (
              <div className={cn("w-4 h-4 rounded-full", categoryColor)}></div>
            )}
            <h2 className="text-3xl font-bold">{cardTitle}</h2>
          </div>
          {!isBreak && !isBreakGracePeriod && !overtimeTaken && !isTaskGracePeriod && !taskOvertimeTaken && activeTask?.priority && (
            <p className="text-muted-foreground mt-1">Prioridade: {priorityText}</p>
          )}
        </div>

        <div className="my-8 md:my-12 w-full max-w-[300px] md:max-w-[450px] lg:max-w-[550px] aspect-square">
          <CircularProgressTimer
            timeLeft={timerTimeLeft}
            totalDuration={timerTotalDuration}
            isBreak={timerIsBreak}
            isOvertime={timerIsOvertime} // Break overtime
            overtimeTaken={overtimeTaken} // Break overtime
            isBreakGracePeriod={timerIsBreakGracePeriod}
            isTaskGracePeriod={timerIsTaskGracePeriod} // NEW
            taskOvertimeTaken={taskOvertimeTaken} // NEW
            isTaskOvertime={timerIsTaskOvertime} // NEW
          >
            {isTaskGracePeriod ? ( // NEW: Display for task grace period
              <div className="flex flex-col items-center">
                <h3 className={cn(
                  "text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] font-bold tracking-tighter",
                  "text-yellow-500"
                )}>
                  {formatTime(taskGracePeriodTimeLeft)}
                </h3>
                <span className="text-2xl text-muted-foreground mt-1">
                  Iniciar Pausa
                </span>
              </div>
            ) : taskOvertimeTaken > 0 ? ( // NEW: Display for task overtime
              <div className="flex flex-col items-center">
                <h3 className={cn(
                  "font-bold tracking-tighter",
                  "text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[8rem]",
                  "text-red-500"
                )}>
                  +{formatTime(taskOvertimeTaken)}
                </h3>
                <span className="text-3xl text-primary mt-2">
                  Tarefa
                </span>
              </div>
            ) : isBreakGracePeriod ? (
              <div className="flex flex-col items-center">
                {lastNominalBreakDuration !== null && (
                  <span className="text-2xl text-muted-foreground mb-1">
                    {formatTime(lastNominalBreakDuration)}
                  </span>
                )}
                <h3 className={cn(
                  "text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] font-bold tracking-tighter",
                  "text-yellow-500"
                )}>
                  {formatTime(breakGracePeriodTimeLeft)}
                </h3>
              </div>
            ) : overtimeTaken > 0 ? ( // Break overtime
              <div className="flex flex-col items-center">
                <h3 className={cn(
                  "font-bold tracking-tighter",
                  "text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[8rem]", // Reduced size
                  "text-red-500"
                )}>
                  +{formatTime(overtimeTaken)}
                </h3>
                {lastNominalBreakDuration !== null && (
                  <span className="text-3xl text-green-500 mt-2"> {/* Increased size, green color, moved below */}
                    {formatTime(lastNominalBreakDuration)}
                  </span>
                )}
              </div>
            ) : (
              <h3 className={cn(
                "text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] font-bold tracking-tighter",
                isBreak ? "text-green-500" : "text-primary"
              )}>
                {formatTime(timeLeft)}
              </h3>
            )}
          </CircularProgressTimer>
        </div>

        <div className="flex justify-center items-center space-x-2">
          {isTaskGracePeriod ? ( // NEW: Button for task grace period
            <Button variant="outline" size="icon" className="h-16 w-16 bg-green-500 hover:bg-green-600 text-white" onClick={() => skipToBreak(true)}>
              <Play className="h-8 w-8" /> {/* Play icon to start break */}
            </Button>
          ) : (
            !(isBreakGracePeriod || overtimeTaken > 0) ? ( // Original logic for pomodoro/nominal break
              !isRunning ? (
                <Button variant="outline" size="icon" className="h-16 w-16 bg-green-500 hover:bg-green-600 text-white" onClick={startTimer}>
                  <Play className="h-8 w-8" />
                </Button>
              ) : (
                <Button variant="outline" size="icon" className="h-16 w-16 bg-yellow-500 hover:bg-yellow-600 text-white" onClick={pauseTimer}>
                  <Pause className="h-8 w-8" />
                </Button>
              )
            ) : ( // If in break grace period or break overtime, "Start Break" button becomes "Return to Task"
              <Button variant="outline" size="icon" className="h-16 w-16 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => skipBreak(false)}>
                <Check className="h-8 w-8" />
              </Button>
            )
          )}
          <Button variant="outline" size="icon" className="h-16 w-16" onClick={resetTimer}>
            <RotateCcw className="h-8 w-8" />
          </Button>
          {activeTask && !isBreak && !isBreakGracePeriod && !overtimeTaken && !isTaskGracePeriod && !taskOvertimeTaken && ( // Pular para Pausa (only during active pomodoro)
            <Button variant="outline" size="icon" className="h-16 w-16" onClick={() => skipToBreak(true)}>
              <FastForward className="h-8 w-8" />
            </Button>
          )}
          {activeTask && !isBreak && !isBreakGracePeriod && !overtimeTaken && ( // Concluir/Cancelar Tarefa (during pomodoro or task overtime)
            <>
              <Button variant="default" size="icon" className="h-16 w-16" onClick={completeActiveTask}>
                <Check className="h-8 w-8" />
              </Button>
              <Button variant="destructive" size="icon" className="h-16 w-16" onClick={() => cancelActiveTask()}>
                <X className="h-8 w-8" />
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Non-focus mode card (small card)
  return (
    <Card className="w-full mx-auto mt-4 max-w-lg border-none">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center space-x-2">
          {!isBreak && !isBreakGracePeriod && !overtimeTaken && !isTaskGracePeriod && !taskOvertimeTaken && <div className={`w-3 h-3 rounded-full ${categoryColor}`}></div>}
          <CardTitle className="text-lg font-semibold">{cardTitle}</CardTitle>
          {activeTask?.description && !isBreak && !isBreakGracePeriod && !overtimeTaken && !isTaskGracePeriod && !taskOvertimeTaken && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <p className="text-sm">{activeTask.description}</p>
              </PopoverContent>
            </Popover>
          )}
        </div>
        {activeTask && !isBreak && !isBreakGracePeriod && !overtimeTaken && !isTaskGracePeriod && !taskOvertimeTaken && activeTask.priority && <Badge variant="secondary">Prioridade: {priorityText}</Badge>}
      </CardHeader>
      <CardContent className="space-y-3">
        {activeTask && !isBreak && !isBreakGracePeriod && !overtimeTaken && !isTaskGracePeriod && !taskOvertimeTaken && (
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground justify-center">
            {activeTask.hashtags.map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-muted rounded-md">
                #{tag}
              </span>
            ))}
            {activeTask.project && (
              <span className="px-2 py-1 bg-muted rounded-md">
                @{activeTask.project}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center justify-center space-x-4 py-4">
          <CircularProgressTimer
            timeLeft={timerTimeLeft}
            totalDuration={timerTotalDuration}
            isBreak={timerIsBreak}
            isOvertime={timerIsOvertime} // Break overtime
            overtimeTaken={overtimeTaken} // Break overtime
            isBreakGracePeriod={timerIsBreakGracePeriod}
            isTaskGracePeriod={timerIsTaskGracePeriod} // NEW
            taskOvertimeTaken={taskOvertimeTaken} // NEW
            isTaskOvertime={timerIsTaskOvertime} // NEW
          >
            {isTaskGracePeriod ? ( // NEW: Display for task grace period
              <div className="flex flex-col items-center">
                <h3 className={cn(
                  "text-5xl font-extrabold",
                  "text-yellow-500"
                )}>
                  {formatTime(taskGracePeriodTimeLeft)}
                </h3>
                <span className="text-sm text-muted-foreground mt-1">
                  Iniciar Pausa
                </span>
              </div>
            ) : taskOvertimeTaken > 0 ? ( // NEW: Display for task overtime
              <div className="flex flex-col items-center">
                <h3 className={cn(
                  "text-4xl font-extrabold",
                  "text-red-500"
                )}>
                  +{formatTime(taskOvertimeTaken)}
                </h3>
                <span className="text-xl text-primary mt-1">
                  Tarefa
                </span>
              </div>
            ) : isBreakGracePeriod ? (
              <div className="flex flex-col items-center">
                {lastNominalBreakDuration !== null && (
                  <span className="text-sm text-muted-foreground mb-1">
                    {formatTime(lastNominalBreakDuration)}
                  </span>
                )}
                <h3 className={cn(
                  "text-5xl font-extrabold",
                  "text-yellow-500"
                )}>
                  {formatTime(breakGracePeriodTimeLeft)}
                </h3>
              </div>
            ) : overtimeTaken > 0 ? ( // Break overtime
              <div className="flex flex-col items-center">
                <h3 className={cn(
                  "text-4xl font-extrabold", // Reduced size
                  "text-red-500"
                )}>
                  +{formatTime(overtimeTaken)}
                </h3>
                {lastNominalBreakDuration !== null && (
                  <span className="text-xl text-green-500 mt-1"> {/* Increased size, green color, moved below */}
                    {formatTime(lastNominalBreakDuration)}
                  </span>
                )}
              </div>
            ) : (
              <h3 className={cn("text-5xl font-extrabold", isBreak ? "text-green-500" : "text-primary")}>
                {formatTime(timeLeft)}
              </h3>
            )}
          </CircularProgressTimer>
        </div>
        <div className="flex justify-center space-x-2">
          {isTaskGracePeriod ? ( // NEW: Button for task grace period
            <Button variant="outline" size="icon" className="h-10 w-10 md:h-12 md:w-12 bg-green-500 hover:bg-green-600 text-white" onClick={() => skipToBreak(true)}>
              <Play className="h-5 w-5 md:h-6 md:w-6" />
            </Button>
          ) : (
            !(isBreakGracePeriod || overtimeTaken > 0) ? ( // Original logic for pomodoro/nominal break
              !isRunning ? (
                <Button variant="outline" size="icon" className="h-10 w-10 md:h-12 md:w-12" onClick={startTimer}>
                  <Play className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
              ) : (
                <Button variant="outline" size="icon" className="h-10 w-10 md:h-12 md:w-12" onClick={pauseTimer}>
                  <Pause className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
              )
            ) : ( // If in break grace period or break overtime, "Start Break" button becomes "Return to Task"
              <Button variant="outline" size="icon" className="h-10 w-10 md:h-12 md:w-12 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => skipBreak(false)}>
                <Check className="h-5 w-5 md:h-6 md:w-6" />
              </Button>
            )
          )}
          <Button variant="outline" size="icon" className="h-10 w-10 md:h-12 md:w-12" onClick={resetTimer}>
            <RotateCcw className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
          {activeTask && !isBreak && !isBreakGracePeriod && !overtimeTaken && !isTaskGracePeriod && !taskOvertimeTaken && ( // Pular para Pausa (only during active pomodoro)
            <>
              <Button variant="outline" size="icon" className="h-10 w-10 md:h-12 md:w-12" onClick={() => skipToBreak(true)}>
                <FastForward className="h-5 w-5 md:h-6 md:w-6" />
              </Button>
              <Button variant="default" size="icon" className="h-10 w-10 md:h-12 md:w-12" onClick={completeActiveTask}>
                <Check className="h-5 w-5 md:h-6 md:w-6" />
              </Button>
              <Button variant="destructive" size="icon" className="h-10 w-10 md:h-12 md:w-12" onClick={() => cancelActiveTask()}>
                <X className="h-5 w-5 md:h-6 md:w-6" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentTaskCard;