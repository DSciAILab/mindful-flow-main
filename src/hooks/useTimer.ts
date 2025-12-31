import { useState, useEffect, useCallback, useRef } from 'react';

interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  isPaused: boolean;
  type: 'focus' | 'break';
  sessionsCompleted: number;
  totalBreakTime: number;
  breakStartTime: number | null;
}

interface UseTimerOptions {
  focusDuration?: number;
  breakDuration?: number;
  onMinutePassed?: () => void;
  onSessionComplete?: () => void;
}

export function useTimer({
  focusDuration = 25 * 60,
  breakDuration = 5 * 60,
  onMinutePassed,
  onSessionComplete,
}: UseTimerOptions = {}) {
  const [state, setState] = useState<TimerState>({
    timeLeft: focusDuration,
    isRunning: false,
    isPaused: false,
    type: 'focus',
    sessionsCompleted: 0,
    totalBreakTime: 0,
    breakStartTime: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const secondsElapsedRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    setState(prev => {
      // If resuming from a break pause, calculate break time
      let additionalBreakTime = 0;
      if (prev.breakStartTime && prev.type === 'focus') {
        additionalBreakTime = Math.floor((Date.now() - prev.breakStartTime) / 60000);
      }
      
      return { 
        ...prev, 
        isRunning: true, 
        isPaused: false,
        totalBreakTime: prev.totalBreakTime + additionalBreakTime,
        breakStartTime: null,
      };
    });
  }, []);

  const pause = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isRunning: false, 
      isPaused: true,
    }));
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    secondsElapsedRef.current = 0;
    setState(prev => ({
      ...prev,
      timeLeft: prev.type === 'focus' ? focusDuration : breakDuration,
      isRunning: false,
      isPaused: false,
    }));
  }, [clearTimer, focusDuration, breakDuration]);

  const goToBreak = useCallback(() => {
    clearTimer();
    secondsElapsedRef.current = 0;
    setState(prev => ({
      ...prev,
      type: 'break',
      timeLeft: breakDuration,
      isRunning: true,
      isPaused: false,
      breakStartTime: Date.now(),
    }));
  }, [clearTimer, breakDuration]);

  const skipToFocus = useCallback(() => {
    clearTimer();
    secondsElapsedRef.current = 0;
    
    setState(prev => {
      // Calculate break time if coming from break
      let additionalBreakTime = 0;
      if (prev.breakStartTime) {
        additionalBreakTime = Math.floor((Date.now() - prev.breakStartTime) / 60000);
      }
      
      return {
        ...prev,
        type: 'focus',
        timeLeft: focusDuration,
        isRunning: false,
        isPaused: false,
        totalBreakTime: prev.totalBreakTime + additionalBreakTime,
        breakStartTime: null,
      };
    });
  }, [clearTimer, focusDuration]);

  const completeTask = useCallback(() => {
    clearTimer();
    secondsElapsedRef.current = 0;
    
    if (onSessionComplete) {
      onSessionComplete();
    }
    
    setState(prev => ({
      ...prev,
      timeLeft: focusDuration,
      isRunning: false,
      isPaused: false,
      type: 'focus',
      sessionsCompleted: prev.sessionsCompleted + 1,
    }));
  }, [clearTimer, focusDuration, onSessionComplete]);

  const resetAll = useCallback(() => {
    clearTimer();
    secondsElapsedRef.current = 0;
    setState({
      timeLeft: focusDuration,
      isRunning: false,
      isPaused: false,
      type: 'focus',
      sessionsCompleted: 0,
      totalBreakTime: 0,
      breakStartTime: null,
    });
  }, [clearTimer, focusDuration]);

  useEffect(() => {
    if (state.isRunning && state.timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        secondsElapsedRef.current += 1;

        // Call onMinutePassed every 60 seconds during focus
        if (state.type === 'focus' && secondsElapsedRef.current % 60 === 0 && onMinutePassed) {
          onMinutePassed();
        }

        setState(prev => {
          if (prev.timeLeft <= 1) {
            // Timer completed
            const newType = prev.type === 'focus' ? 'break' : 'focus';
            const newSessions = prev.type === 'focus' ? prev.sessionsCompleted + 1 : prev.sessionsCompleted;
            
            if (prev.type === 'focus' && onSessionComplete) {
              onSessionComplete();
            }

            secondsElapsedRef.current = 0;

            return {
              ...prev,
              timeLeft: newType === 'focus' ? focusDuration : breakDuration,
              type: newType,
              sessionsCompleted: newSessions,
              isRunning: false,
              isPaused: false,
              breakStartTime: newType === 'break' ? Date.now() : null,
            };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }

    return clearTimer;
  }, [state.isRunning, state.timeLeft, state.type, clearTimer, focusDuration, breakDuration, onMinutePassed, onSessionComplete]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    ...state,
    formattedTime: formatTime(state.timeLeft),
    progress: state.type === 'focus' 
      ? (focusDuration - state.timeLeft) / focusDuration 
      : (breakDuration - state.timeLeft) / breakDuration,
    start,
    pause,
    reset,
    goToBreak,
    skipToFocus,
    completeTask,
    resetAll,
  };
}
