"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ParsedTask } from '@/utils/taskParser';
import { supabaseDb } from '@/lib/supabase/index';
import { useSession } from '@/integrations/supabase/auth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useTimerSettings } from '@/hooks/useTimerSettings';
import { useTimerLogic } from '@/hooks/useTimerLogic';
import { useTimerPersistence } from '@/hooks/useTimerPersistence';

interface TimerContextType {
  activeTask: ParsedTask | null;
  setActiveTask: (task: ParsedTask | null) => void;
  timeLeft: number;
  totalDuration: number;
  isRunning: boolean;
  isBreak: boolean;
  pomodoroCount: number;
  isFocusMode: boolean;
  isBreakGracePeriod: boolean;
  breakGracePeriodTimeLeft: number;
  overtimeTaken: number;
  lastNominalBreakDuration: number | null;
  isTaskGracePeriod: boolean;
  taskGracePeriodTimeLeft: number;
  taskOvertimeTaken: number;
  toggleFocusMode: () => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  skipToBreak: (autoStart?: boolean) => void;
  skipBreak: (autoStart?: boolean) => void;
  completeActiveTask: () => void;
  cancelActiveTask: (newTask?: ParsedTask) => void;
  switchTask: (newTask: ParsedTask) => void;
  selectTask: (newTask: ParsedTask) => void;
  selectTaskAndEnterFocus: (newTask: ParsedTask) => void;
  elapsedTime: number;
  refreshSettings: () => Promise<void>;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useSession();
  const navigate = useNavigate();
  const [activeTask, setActiveTaskState] = useState<ParsedTask | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const { durations, soundEnabled, refreshSettings } = useTimerSettings();

  const handlePomodoroEnd = useCallback((pomodoroDuration: number) => {
    if (activeTask && user?.id) {
      const totalTaskTime = pomodoroDuration + taskOvertimeTaken;
      supabaseDb.addTimeLog(user.id, activeTask.id, totalTaskTime);
      toast.success("Sessão de foco registrada!");
    }
    toast.success("Pomodoro concluído! Hora da pausa.");
  }, [activeTask, user?.id]);

  const handleBreakEnd = useCallback(() => {
    toast.info("Pausa concluída! Você tem 20 segundos para retornar à tarefa.");
  }, []);

  const handleTaskComplete = useCallback(async () => {
    if (!activeTask || !user?.id) return;
    const success = await supabaseDb.updateTask(user.id, activeTask.id, { status: 'completed' });
    if (success) {
      toast.success(`Tarefa "${activeTask.title}" concluída!`);
      setActiveTaskState(null);
      setIsFocusMode(false);
    } else {
      toast.error("Falha ao concluir tarefa.");
    }
  }, [activeTask, user?.id]);

  const handleTaskCancel = useCallback(async () => {
    if (!activeTask || !user?.id) return;
    const success = await supabaseDb.updateTask(user.id, activeTask.id, { status: 'todo' });
    if (success) {
      toast.info(`Tarefa "${activeTask.title}" movida de volta para 'Tarefas a Fazer'.`);
      setActiveTaskState(null);
      setIsFocusMode(false);
    } else {
      toast.error("Falha ao cancelar tarefa.");
    }
  }, [activeTask, user?.id]);

  const handleTaskInterruption = useCallback(async (elapsedTime: number) => {
    if (activeTask && user?.id && (elapsedTime > 0 || taskOvertimeTaken > 0)) {
      await supabaseDb.addInterruptionLog(user.id, activeTask.id, elapsedTime + taskOvertimeTaken);
      toast.info(`Interrupção registrada para a tarefa "${activeTask.title}".`);
    }
  }, [activeTask, user?.id]);

  const handleBreakCompleted = useCallback(async (taskId: string, duration: number) => {
    if (user?.id && taskId && duration > 0) {
      await supabaseDb.addBreakLog(user.id, taskId, duration);
      toast.info(`Pausa de ${Math.round(duration / 60)} minutos registrada para a tarefa.`);
    }
  }, [user?.id]);

  const {
    timeLeft, totalDuration, isRunning, isBreak, pomodoroCount, elapsedTime,
    isBreakGracePeriod, breakGracePeriodTimeLeft, overtimeTaken, lastNominalBreakDuration,
    isTaskGracePeriod, taskGracePeriodTimeLeft, taskOvertimeTaken,
    startTimer: startTimerLogic, pauseTimer: pauseTimerLogic, resetTimer: resetTimerLogic,
    skipToBreak: skipToBreakLogic, skipBreak: skipBreakLogic,
    completeTask: completeTaskLogic, cancelTask: cancelTaskLogic,
    setTimeLeft, setTotalDuration, setIsRunning, setIsBreak, setPomodoroCount,
    setElapsedTime, setIsBreakGracePeriod, setBreakGracePeriodTimeLeft,
    setOvertimeTaken, setLastNominalBreakDuration,
    setIsTaskGracePeriod, setTaskGracePeriodTimeLeft, setTaskOvertimeTaken,
  } = useTimerLogic({
    initialDurations: durations,
    initialSoundEnabled: soundEnabled,
    activeTask,
    onPomodoroEnd: handlePomodoroEnd,
    onBreakEnd: handleBreakEnd,
    onTaskComplete: handleTaskComplete,
    onTaskCancel: handleTaskCancel,
    onTaskInterruption: handleTaskInterruption,
    onBreakCompleted: handleBreakCompleted,
  });

  const currentTimerState = {
    timeLeft, totalDuration, isRunning, isBreak, pomodoroCount, isFocusMode,
    isBreakGracePeriod, breakGracePeriodTimeLeft, overtimeTaken, activeTask, elapsedTime, lastNominalBreakDuration,
    isTaskGracePeriod, taskGracePeriodTimeLeft, taskOvertimeTaken,
  };

  const timerSetters = {
    setTimeLeft, setTotalDuration, setIsRunning, setIsBreak, setPomodoroCount,
    setIsFocusMode, setIsBreakGracePeriod, setBreakGracePeriodTimeLeft,
    setOvertimeTaken, setActiveTask: setActiveTaskState, setElapsedTime,
    setLastNominalBreakDuration, handlePomodoroEnd: () => handlePomodoroEnd(durations.pomodoro), handleBreakEnd,
    setIsTaskGracePeriod, setTaskGracePeriodTimeLeft, setTaskOvertimeTaken,
  };

  useTimerPersistence(currentTimerState, timerSetters, durations);

  const startTimer = () => {
    if (!activeTask && !isBreak && !isBreakGracePeriod && overtimeTaken === 0 && !isTaskGracePeriod && taskOvertimeTaken === 0) {
      toast.error("Nenhuma tarefa ativa para iniciar o cronômetro.");
      return;
    }

    if (isTaskGracePeriod) {
      skipToBreakLogic(true); // Auto-start break if coming from grace period
      toast.info("Pausa iniciada!");
      return;
    }

    if (isBreakGracePeriod || (isBreak && overtimeTaken > 0)) {
      skipBreakLogic();
      toast.info("Pausa encerrada. Pomodoro iniciado!");
      return;
    }

    startTimerLogic();
    setIsFocusMode(true);
    toast.info(isBreak ? "Pausa iniciada!" : "Pomodoro iniciado!");
  };

  const pauseTimer = () => {
    pauseTimerLogic();
    toast.info(isBreak ? "Pausa pausada." : "Pomodoro pausado.");
  };

  const resetTimer = () => {
    resetTimerLogic();
    toast.info("Timer resetado.");
  };

  const skipToBreak = (autoStart = false) => {
    // Removed guard clause that prevented manual skipping
    if (!activeTask || !user?.id) {
      toast.error("Nenhuma tarefa ativa.");
      return;
    }
    
    skipToBreakLogic(autoStart);
    toast.info("Pausa iniciada!");
  };

  const skipBreak = (autoStart = false) => {
    if (!isBreak && !isBreakGracePeriod && overtimeTaken === 0) return;
    skipBreakLogic(autoStart);
    toast.info("Pausa encerrada. De volta ao trabalho!");
  };

  const completeActiveTask = () => {
    completeTaskLogic();
  };

  const cancelActiveTask = (newTask?: ParsedTask) => {
    cancelTaskLogic();
    if (newTask) {
      setActiveTaskState(newTask);
      navigate('/');
    } else {
      setActiveTaskState(null);
    }
  };

  const switchTask = useCallback(async (newTask: ParsedTask) => {
    if (activeTask && user?.id && isRunning && (elapsedTime > 0 || taskOvertimeTaken > 0)) {
      await supabaseDb.addInterruptionLog(user.id, activeTask.id, elapsedTime + taskOvertimeTaken);
      toast.info(`Interrupção registrada para a tarefa "${activeTask.title}".`);
    }
    setActiveTaskState(newTask);
    navigate('/');
  }, [activeTask, user?.id, isRunning, elapsedTime, taskOvertimeTaken, navigate]);

  const selectTask = useCallback((newTask: ParsedTask) => {
    if (!isRunning && elapsedTime === 0 && !isBreakGracePeriod && overtimeTaken === 0 && !isTaskGracePeriod && taskOvertimeTaken === 0) {
      setActiveTaskState(newTask);
      navigate('/');
    } else {
      switchTask(newTask);
    }
  }, [isRunning, elapsedTime, isBreakGracePeriod, overtimeTaken, isTaskGracePeriod, taskOvertimeTaken, switchTask, navigate]);

  const selectTaskAndEnterFocus = useCallback((newTask: ParsedTask) => {
    if (isRunning && activeTask?.id !== newTask.id) {
      switchTask(newTask);
    } 
    else if (activeTask?.id !== newTask.id) {
      setActiveTaskState(newTask);
    }
    setIsFocusMode(true);
    navigate('/dashboard-legacy');
  }, [isRunning, activeTask, switchTask, setActiveTaskState, navigate]);

  const toggleFocusMode = () => {
    if (!activeTask && !isBreak && !isBreakGracePeriod && overtimeTaken === 0 && !isTaskGracePeriod && taskOvertimeTaken === 0) {
      toast.error("Selecione uma tarefa para entrar no Modo Foco.");
      return;
    }
    const newFocusState = !isFocusMode;
    setIsFocusMode(newFocusState);
    if (!newFocusState && isRunning) {
      pauseTimer();
    }
  };

  const value = {
    activeTask,
    setActiveTask: setActiveTaskState,
    timeLeft,
    totalDuration,
    isRunning,
    isBreak,
    pomodoroCount,
    isFocusMode,
    isBreakGracePeriod,
    breakGracePeriodTimeLeft,
    overtimeTaken,
    lastNominalBreakDuration,
    isTaskGracePeriod,
    taskGracePeriodTimeLeft,
    taskOvertimeTaken,
    toggleFocusMode,
    startTimer,
    pauseTimer,
    resetTimer,
    skipToBreak,
    skipBreak,
    completeActiveTask,
    cancelActiveTask,
    switchTask,
    selectTask,
    selectTaskAndEnterFocus,
    elapsedTime,
    refreshSettings,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};