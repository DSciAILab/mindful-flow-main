"use client";

import { useEffect, useRef } from 'react';
import { ParsedTask } from '@/utils/taskParser';
import { toast } from 'sonner';

const LOCAL_STORAGE_KEY = 'pomodoro_timer_state';

interface TimerState {
  timeLeft: number;
  totalDuration: number;
  isRunning: boolean;
  isBreak: boolean;
  pomodoroCount: number;
  isFocusMode: boolean;
  isBreakGracePeriod: boolean;
  breakGracePeriodTimeLeft: number;
  overtimeTaken: number; // Break overtime
  activeTask: ParsedTask | null;
  elapsedTime: number;
  lastNominalBreakDuration: number | null;
  // NEW: Add new states
  isTaskGracePeriod: boolean;
  taskGracePeriodTimeLeft: number;
  taskOvertimeTaken: number; // Task overtime
}

interface TimerSetters {
  setTimeLeft: (value: number) => void;
  setTotalDuration: (value: number) => void;
  setIsRunning: (value: boolean) => void;
  setIsBreak: (value: boolean) => void;
  setPomodoroCount: (value: number) => void;
  setIsFocusMode: (value: boolean) => void;
  setIsBreakGracePeriod: (value: boolean) => void;
  setBreakGracePeriodTimeLeft: (value: number) => void;
  setOvertimeTaken: (value: number) => void;
  setActiveTask: (value: ParsedTask | null) => void;
  setElapsedTime: (value: number) => void;
  setLastNominalBreakDuration: (value: number | null) => void;
  handlePomodoroEnd: () => void; // Callback to trigger pomodoro end logic
  handleBreakEnd: () => void;     // Callback to trigger break end logic
  // NEW: Add setters for new states
  setIsTaskGracePeriod: (value: boolean) => void;
  setTaskGracePeriodTimeLeft: (value: number) => void;
  setTaskOvertimeTaken: (value: number) => void;
}

export const useTimerPersistence = (
  currentState: TimerState,
  setters: TimerSetters,
  durations: { pomodoro: number; shortBreak: number; longBreak: number }
) => {
  const {
    setTimeLeft,
    setTotalDuration,
    setIsRunning,
    setIsBreak,
    setPomodoroCount,
    setIsFocusMode,
    setIsBreakGracePeriod,
    setBreakGracePeriodTimeLeft,
    setOvertimeTaken,
    setActiveTask,
    setElapsedTime,
    setLastNominalBreakDuration,
    handlePomodoroEnd,
    handleBreakEnd,
    // NEW: Destructure new setters
    setIsTaskGracePeriod,
    setTaskGracePeriodTimeLeft,
    setTaskOvertimeTaken,
  } = setters;

  const currentStateRef = useRef(currentState);

  useEffect(() => {
    currentStateRef.current = currentState;
  }, [currentState]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log(`useTimerPersistence: Visibility changed. Document hidden: ${document.hidden}`);
      if (document.hidden) {
        if (currentStateRef.current.isRunning || currentStateRef.current.isBreakGracePeriod || currentStateRef.current.overtimeTaken > 0 || currentStateRef.current.isTaskGracePeriod || currentStateRef.current.taskOvertimeTaken > 0) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
            ...currentStateRef.current,
            timestamp: Date.now(),
          }));
          console.log("useTimerPersistence: State saved to localStorage.");
        }
      } else {
        const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedState) {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          const parsedState: TimerState & { timestamp: number } = JSON.parse(savedState);
          const timeInBackground = Date.now() - parsedState.timestamp;
          console.log(`useTimerPersistence: State restored from localStorage. Time in background: ${timeInBackground / 1000}s.`);

          if (parsedState.isRunning || parsedState.isBreakGracePeriod || parsedState.overtimeTaken > 0 || parsedState.isTaskGracePeriod || parsedState.taskOvertimeTaken > 0) {
            setActiveTask(parsedState.activeTask);
            setPomodoroCount(parsedState.pomodoroCount);
            setIsFocusMode(parsedState.isFocusMode);
            setIsBreak(parsedState.isBreak);
            setTotalDuration(parsedState.totalDuration);
            setElapsedTime(parsedState.elapsedTime);
            setLastNominalBreakDuration(parsedState.lastNominalBreakDuration);

            // NEW: Handle task grace period persistence
            if (parsedState.isTaskGracePeriod) {
              let newGraceTimeLeft = parsedState.taskGracePeriodTimeLeft - Math.floor(timeInBackground / 1000);
              console.log(`useTimerPersistence: Restoring task grace period. Old time left: ${parsedState.taskGracePeriodTimeLeft}, New time left: ${newGraceTimeLeft}`);
              if (newGraceTimeLeft <= 0) {
                const taskOvertimeFromGrace = Math.abs(newGraceTimeLeft);
                setIsTaskGracePeriod(false);
                setTaskGracePeriodTimeLeft(0);
                setTaskOvertimeTaken(parsedState.taskOvertimeTaken + taskOvertimeFromGrace);
                setIsRunning(true);
                toast.warning("Período de carência da tarefa expirou. Tempo extra da tarefa está sendo contabilizado!");
                console.log("useTimerPersistence: Task grace period ended in background, transitioned to task overtime.");
              } else {
                setTaskGracePeriodTimeLeft(newGraceTimeLeft);
                setIsTaskGracePeriod(true);
                setIsRunning(false); // Grace period is paused if app is hidden
                console.log("useTimerPersistence: Task grace period resumed.");
              }
            }
            // NEW: Handle task overtime persistence
            else if (parsedState.taskOvertimeTaken > 0) {
              setTaskOvertimeTaken(parsedState.taskOvertimeTaken + Math.floor(timeInBackground / 1000));
              setIsRunning(true);
              console.log("useTimerPersistence: Task overtime resumed and adjusted.");
            }
            // Existing logic for break grace period
            else if (parsedState.isBreakGracePeriod) {
              let newGraceTimeLeft = parsedState.breakGracePeriodTimeLeft - Math.floor(timeInBackground / 1000);
              console.log(`useTimerPersistence: Restoring break grace period. Old time left: ${parsedState.breakGracePeriodTimeLeft}, New time left: ${newGraceTimeLeft}`);
              if (newGraceTimeLeft <= 0) {
                const overtimeFromGrace = Math.abs(newGraceTimeLeft);
                setIsBreakGracePeriod(false);
                setBreakGracePeriodTimeLeft(0);
                setOvertimeTaken(parsedState.overtimeTaken + overtimeFromGrace);
                setIsRunning(true);
                toast.warning("Pausa estendida em segundo plano. Tempo extra está sendo contabilizado!");
                console.log("useTimerPersistence: Break grace period ended in background, transitioned to overtime.");
              } else {
                setBreakGracePeriodTimeLeft(newGraceTimeLeft);
                setIsBreakGracePeriod(true);
                setIsRunning(false);
                console.log("useTimerPersistence: Break grace period resumed.");
              }
            }
            // Existing logic for break overtime
            else if (parsedState.overtimeTaken > 0) {
              setOvertimeTaken(parsedState.overtimeTaken + Math.floor(timeInBackground / 1000));
              setIsRunning(true);
              console.log("useTimerPersistence: Break overtime resumed and adjusted.");
            }
            // Existing logic for normal pomodoro/break countdown
            else {
              let newTimeLeft = parsedState.timeLeft - Math.floor(timeInBackground / 1000);
              console.log(`useTimerPersistence: Restoring main timer. Old time left: ${parsedState.timeLeft}, New time left: ${newTimeLeft}`);
              if (newTimeLeft <= 0) {
                setTimeLeft(0);
                if (!parsedState.isBreak) {
                  console.log("useTimerPersistence: Pomodoro ended in background.");
                  setTimeout(() => handlePomodoroEnd(), 0);
                } else {
                  console.log("useTimerPersistence: Nominal break ended in background.");
                  setTimeout(() => handleBreakEnd(), 0);
                }
              } else {
                setTimeLeft(newTimeLeft);
                setIsRunning(parsedState.isRunning);
              }
            }
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    setTimeLeft, setTotalDuration, setIsRunning, setIsBreak, setPomodoroCount,
    setIsFocusMode, setIsBreakGracePeriod, setBreakGracePeriodTimeLeft,
    setOvertimeTaken, setActiveTask, setElapsedTime, setLastNominalBreakDuration,
    handlePomodoroEnd, handleBreakEnd, durations,
    // NEW: Add new states to dependencies
    setIsTaskGracePeriod, setTaskGracePeriodTimeLeft, setTaskOvertimeTaken,
  ]);
};