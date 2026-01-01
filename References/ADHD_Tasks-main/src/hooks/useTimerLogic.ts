"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { ParsedTask } from '@/utils/taskParser';
import { useSound } from '@/hooks/useSound';
import confetti from 'canvas-confetti';

// Função para disparar a animação de confete
const triggerConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  });
};

interface TimerDurations {
  pomodoro: number;
  shortBreak: number;
  longBreak: number;
}

interface UseTimerLogicProps {
  initialDurations: TimerDurations;
  initialSoundEnabled: boolean;
  activeTask: ParsedTask | null;
  onPomodoroEnd: (pomodoroDuration: number) => void;
  onBreakEnd: () => void;
  onTaskComplete: () => void;
  onTaskCancel: () => void;
  onTaskInterruption: (elapsedTime: number) => void;
  onBreakCompleted: (taskId: string, duration: number) => void;
}

export const useTimerLogic = ({
  initialDurations,
  initialSoundEnabled,
  activeTask,
  onPomodoroEnd,
  onBreakEnd,
  onTaskComplete,
  onTaskCancel,
  onTaskInterruption,
  onBreakCompleted,
}: UseTimerLogicProps) => {
  const { playSound } = useSound();

  const [timeLeft, setTimeLeft] = useState(initialDurations.pomodoro);
  const [totalDuration, setTotalDuration] = useState(initialDurations.pomodoro);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [isBreak, setIsBreak] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const [isBreakGracePeriod, setIsBreakGracePeriod] = useState(false);
  const [breakGracePeriodTimeLeft, setBreakGracePeriodTimeLeft] = useState(20);
  const [overtimeTaken, setOvertimeTaken] = useState(0); // Overtime for the break
  const [lastNominalBreakDuration, setLastNominalBreakDuration] = useState<number | null>(null);

  // NEW: State for task grace period and task overtime
  const [isTaskGracePeriod, setIsTaskGracePeriod] = useState(false);
  const [taskGracePeriodTimeLeft, setTaskGracePeriodTimeLeft] = useState(10); // 10 seconds
  const [taskOvertimeTaken, setTaskOvertimeTaken] = useState(0); // Overtime for the task itself

  // Update durations and soundEnabled when initial props change
  const durationsRef = useRef(initialDurations);
  const soundEnabledRef = useRef(initialSoundEnabled);

  useEffect(() => {
    durationsRef.current = initialDurations;
    soundEnabledRef.current = initialSoundEnabled;
  }, [initialDurations, initialSoundEnabled]);

  // Ref to store the ID of the active task that was last used to initialize the timer.
  const initializedTaskIdRef = useRef<string | null>(null);

  // Reset timer state when activeTask changes, but only if the ID is truly different.
  useEffect(() => {
    if (!activeTask || activeTask.id !== initializedTaskIdRef.current) {
      console.log("useTimerLogic: Active task changed or cleared. Resetting timer state.");
      setIsRunning(false);
      setTimeLeft(durationsRef.current.pomodoro);
      setTotalDuration(durationsRef.current.pomodoro);
      setPomodoroCount(0);
      setIsBreak(false);
      setStartTime(null);
      setElapsedTime(0);
      setIsBreakGracePeriod(false);
      setBreakGracePeriodTimeLeft(20);
      setOvertimeTaken(0);
      setLastNominalBreakDuration(null);
      // NEW: Reset task grace period and task overtime
      setIsTaskGracePeriod(false);
      setTaskGracePeriodTimeLeft(10);
      setTaskOvertimeTaken(0);

      initializedTaskIdRef.current = activeTask?.id || null; // Update the ref
    } else {
      console.log("useTimerLogic: Active task reference changed, but ID is the same. Skipping full reset.");
    }
  }, [activeTask]);

  const handlePomodoroPhaseEnd = useCallback(() => {
    console.log("useTimerLogic: handlePomodoroPhaseEnd called.");
    setIsRunning(false);
    setStartTime(null);
    // elapsedTime is the nominal pomodoro duration here.
    // onPomodoroEnd will be called by TimerContext with total time including task overtime.

    if (soundEnabledRef.current) {
      playSound('pomodoro');
    }
    triggerConfetti();

    // Transition to task grace period
    setIsTaskGracePeriod(true);
    setTaskGracePeriodTimeLeft(10);
    setOvertimeTaken(0); // Ensure break overtime is reset
    setIsBreak(false); // Ensure not in break mode yet
    setTimeLeft(0); // No countdown for main timer
    setTotalDuration(0); // No progress for main timer
    setLastNominalBreakDuration(null); // Reset this for clarity
    console.log("useTimerLogic: Pomodoro ended. Entering task grace period.");
  }, [pomodoroCount, playSound]); // Removed onPomodoroEnd from dependencies as it's called by TimerContext

  const handleBreakPhaseEnd = useCallback(() => {
    console.log("useTimerLogic: handleBreakPhaseEnd called.");
    setIsRunning(false);
    setStartTime(null);
    setElapsedTime(0);

    if (soundEnabledRef.current) {
      playSound('break');
    }
    onBreakEnd(); // Notify parent context
    setIsBreakGracePeriod(true);
    setBreakGracePeriodTimeLeft(20);
    setOvertimeTaken(0);
    setTimeLeft(0); // Indicates that the nominal break has ended
    console.log("useTimerLogic: Nominal break ended. Entering grace period. isBreakGracePeriod: true, isRunning: false.");
  }, [playSound, onBreakEnd]);

  // Main timer effect (pomodoro or nominal break)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && timeLeft > 0 && !isBreakGracePeriod && overtimeTaken === 0 && !isTaskGracePeriod && taskOvertimeTaken === 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
        if (startTime) {
          setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }
      }, 1000);
    } else if (timeLeft === 0 && isRunning && !isBreakGracePeriod && overtimeTaken === 0 && !isTaskGracePeriod && taskOvertimeTaken === 0) {
      console.log(`useTimerLogic: TimeLeft reached 0. isBreak: ${isBreak}`);
      if (!isBreak) {
        handlePomodoroPhaseEnd();
      } else {
        handleBreakPhaseEnd();
      }
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, startTime, isBreak, isBreakGracePeriod, overtimeTaken, isTaskGracePeriod, taskOvertimeTaken, handlePomodoroPhaseEnd, handleBreakPhaseEnd]);

  // Grace period countdown effect (for break)
  useEffect(() => {
    let graceTimer: NodeJS.Timeout;
    if (isBreakGracePeriod && breakGracePeriodTimeLeft > 0) {
      console.log(`[Break Grace Period Countdown] Active. Time left: ${breakGracePeriodTimeLeft}`);
      graceTimer = setInterval(() => {
        setBreakGracePeriodTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    }
    return () => clearInterval(graceTimer);
  }, [isBreakGracePeriod, breakGracePeriodTimeLeft]);

  // Grace period end effect (transition to break overtime)
  useEffect(() => {
    if (isBreakGracePeriod && breakGracePeriodTimeLeft === 0) {
      console.log("[Break Grace Period End] Triggered. Transitioning to break overtime.");
      setIsBreakGracePeriod(false);
      setBreakGracePeriodTimeLeft(0); // Ensure it's explicitly 0
      setOvertimeTaken(1); // Set overtime to 1 immediately to break the loop
      setIsRunning(true); // Automatically start overtime
    }
  }, [isBreakGracePeriod, breakGracePeriodTimeLeft, setIsRunning]);

  // Overtime effect (for break)
  useEffect(() => {
    let overtimeTimer: NodeJS.Timeout;
    if (isRunning && isBreak && !isBreakGracePeriod && overtimeTaken > 0) {
      console.log(`useTimerLogic: Break Overtime active. Overtime taken: ${overtimeTaken}`);
      overtimeTimer = setInterval(() => {
        setOvertimeTaken((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(overtimeTimer);
  }, [isRunning, isBreak, isBreakGracePeriod, overtimeTaken]);

  // NEW: Task Grace Period countdown effect
  useEffect(() => {
    let taskGraceTimer: NodeJS.Timeout;
    if (isTaskGracePeriod && taskGracePeriodTimeLeft > 0) {
      console.log(`[Task Grace Period Countdown] Active. Time left: ${taskGracePeriodTimeLeft}`);
      taskGraceTimer = setInterval(() => {
        setTaskGracePeriodTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    }
    return () => clearInterval(taskGraceTimer);
  }, [isTaskGracePeriod, taskGracePeriodTimeLeft]);

  // NEW: Task Grace Period end effect (transition to task overtime)
  useEffect(() => {
    if (isTaskGracePeriod && taskGracePeriodTimeLeft === 0) {
      console.log("[Task Grace Period End] Triggered. Transitioning to task overtime.");
      setIsTaskGracePeriod(false);
      setTaskGracePeriodTimeLeft(0);
      setTaskOvertimeTaken(1); // Start task overtime
      setIsRunning(true); // Automatically start counting task overtime
    }
  }, [isTaskGracePeriod, taskGracePeriodTimeLeft, setIsRunning]);

  // NEW: Task Overtime effect
  useEffect(() => {
    let taskOvertimeTimer: NodeJS.Timeout;
    if (isRunning && !isBreak && !isTaskGracePeriod && taskOvertimeTaken > 0) {
      console.log(`useTimerLogic: Task Overtime active. Task overtime taken: ${taskOvertimeTaken}`);
      taskOvertimeTimer = setInterval(() => {
        setTaskOvertimeTaken((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(taskOvertimeTimer);
  }, [isRunning, isBreak, isTaskGracePeriod, taskOvertimeTaken]);


  const startTimer = () => {
    console.log("useTimerLogic: startTimer called.");
    setIsRunning(true);
    setStartTime(Date.now() - elapsedTime * 1000); // Resume from elapsed time
  };

  const pauseTimer = () => {
    console.log("useTimerLogic: pauseTimer called.");
    setIsRunning(false);
    setStartTime(null);
    // Log interruption only if it was a task phase (pomodoro or task overtime)
    if (activeTask && !isBreak && (elapsedTime > 0 || taskOvertimeTaken > 0)) {
      onTaskInterruption(elapsedTime + taskOvertimeTaken); // Log total time including task overtime
    }
  };

  const resetTimer = () => {
    console.log("useTimerLogic: resetTimer called.");
    setIsRunning(false);
    setStartTime(null);
    setElapsedTime(0);
    setOvertimeTaken(0); // Break overtime
    setIsBreakGracePeriod(false);
    setBreakGracePeriodTimeLeft(20);
    setLastNominalBreakDuration(null);
    setTimeLeft(durationsRef.current.pomodoro);
    setTotalDuration(durationsRef.current.pomodoro);
    setIsBreak(false);
    setPomodoroCount(0);
    initializedTaskIdRef.current = null; // Reset the ref as well

    // NEW: Reset task grace period and task overtime
    setIsTaskGracePeriod(false);
    setTaskGracePeriodTimeLeft(10);
    setTaskOvertimeTaken(0);
  };

  const skipToBreak = (autoStart = false) => {
    console.log("useTimerLogic: skipToBreak (Start Break) called.", { autoStart });
    
    // Reset Task states
    setIsTaskGracePeriod(false);
    setTaskGracePeriodTimeLeft(10); 
    setTaskOvertimeTaken(0); // Stop task overtime if any

    // Log the time spent if skipping manually from task
    // (Optional: you might want to log this as a session here, but typically explicit "Done" logs the session)

    // Transition to break state
    setIsBreak(true);
    const breakDuration = (pomodoroCount + 1) % 4 === 0 ? durationsRef.current.longBreak : durationsRef.current.shortBreak;
    setLastNominalBreakDuration(breakDuration);
    setTimeLeft(breakDuration);
    setTotalDuration(breakDuration);
    
    setIsRunning(autoStart); 
    if (autoStart) {
        setStartTime(Date.now());
    } else {
        setStartTime(null);
    }
    setElapsedTime(0);
    console.log(`useTimerLogic: Break started. Duration: ${breakDuration}s. AutoStart: ${autoStart}`);
  };

  const skipBreak = (autoStart = false) => {
    console.log("useTimerLogic: skipBreak called.", { autoStart });
    // Calculate actual break duration before resetting
    if (activeTask && (lastNominalBreakDuration !== null || overtimeTaken > 0)) {
      const actualBreakDuration = (lastNominalBreakDuration || 0) + overtimeTaken;
      onBreakCompleted(activeTask.id, actualBreakDuration); // Log break duration
    }

    setIsRunning(autoStart); // Configura o estado de execução baseado no argumento
    if (autoStart) {
      setStartTime(Date.now());
    } else {
      setStartTime(null);
    }
    
    setElapsedTime(0);
    setOvertimeTaken(0);
    setIsBreakGracePeriod(false);
    setBreakGracePeriodTimeLeft(20);
    setLastNominalBreakDuration(null);
    setIsBreak(false);
    setTimeLeft(durationsRef.current.pomodoro);
    setTotalDuration(durationsRef.current.pomodoro);

    // NEW: Also reset task grace period and task overtime when skipping break
    setIsTaskGracePeriod(false);
    setTaskGracePeriodTimeLeft(10);
    setTaskOvertimeTaken(0);
  };

  const completeTask = () => {
    console.log("useTimerLogic: completeTask called.");
    setIsRunning(false);
    setStartTime(null);
    // Log total time spent on task, including any task overtime
    if (activeTask && (elapsedTime > 0 || taskOvertimeTaken > 0)) {
      onPomodoroEnd(elapsedTime + taskOvertimeTaken); // Log total time spent on task
    }
    onTaskComplete(); // Notify parent context
    setLastNominalBreakDuration(null);
    initializedTaskIdRef.current = null; // Reset the ref as task is completed

    // NEW: Reset task grace period and task overtime
    setIsTaskGracePeriod(false);
    setTaskGracePeriodTimeLeft(10);
    setTaskOvertimeTaken(0);
  };

  const cancelTask = () => {
    console.log("useTimerLogic: cancelTask called.");
    setIsRunning(false);
    setStartTime(null);
    // Log total time spent on task, including any task overtime, as an interruption
    if (activeTask && (elapsedTime > 0 || taskOvertimeTaken > 0)) {
      onTaskInterruption(elapsedTime + taskOvertimeTaken); // Log total time spent on task as interruption
    }
    onTaskCancel(); // Notify parent context
    setLastNominalBreakDuration(null);
    initializedTaskIdRef.current = null; // Reset the ref as task is cancelled

    // NEW: Reset task grace period and task overtime
    setIsTaskGracePeriod(false);
    setTaskGracePeriodTimeLeft(10);
    setTaskOvertimeTaken(0);
  };

  return {
    timeLeft,
    totalDuration,
    isRunning,
    isBreak,
    pomodoroCount,
    elapsedTime,
    isBreakGracePeriod,
    breakGracePeriodTimeLeft,
    overtimeTaken,
    lastNominalBreakDuration,
    // NEW: Export new states
    isTaskGracePeriod,
    taskGracePeriodTimeLeft,
    taskOvertimeTaken,
    startTimer,
    pauseTimer,
    resetTimer,
    skipToBreak,
    skipBreak,
    completeTask,
    cancelTask,
    setTimeLeft, // Expose setters for persistence hook
    setIsRunning,
    setIsBreak,
    setPomodoroCount,
    setStartTime,
    setElapsedTime,
    setIsBreakGracePeriod,
    setBreakGracePeriodTimeLeft,
    setOvertimeTaken,
    setTotalDuration,
    setLastNominalBreakDuration,
    // NEW: Expose setters for new states
    setIsTaskGracePeriod,
    setTaskGracePeriodTimeLeft,
    setTaskOvertimeTaken,
  };
};