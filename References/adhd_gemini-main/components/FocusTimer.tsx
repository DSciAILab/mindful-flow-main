
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Check, Zap, X, ChevronDown, Coffee } from 'lucide-react';
import { Task } from '../types';

interface FocusTimerProps {
  initialTaskId?: string; // Made optional
  initialDuration?: number; // New optional prop
  initialTitle?: string; // New optional prop
  tasks: Task[];
  onClose: () => void;
  onCompleteTask: (taskId: string) => void;
  onSaveDistraction: (text: string) => void;
  onSessionComplete: (minutes: number) => void;
}

const MIN_MINUTES = 1;
const MAX_MINUTES = 120;

export const FocusTimer: React.FC<FocusTimerProps> = ({ 
  initialTaskId, 
  initialDuration = 25,
  initialTitle,
  tasks, 
  onClose, 
  onCompleteTask, 
  onSaveDistraction,
  onSessionComplete
}) => {
  const [activeTaskId, setActiveTaskId] = useState(initialTaskId || (tasks.length > 0 ? tasks[0].id : ''));
  
  // Timer State
  const [durationMinutes, setDurationMinutes] = useState(initialDuration);
  const [timeLeft, setTimeLeft] = useState(initialDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [distractions, setDistractions] = useState('');
  
  // Drag State for Time Adjustment
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startDurationRef = useRef(0);

  const activeTask = tasks.find(t => t.id === activeTaskId);
  // Fallback title if no task is selected or available
  const displayTitle = activeTask ? activeTask.title : (initialTitle || "Freestyle Focus");

  // Sync Timer Logic
  useEffect(() => {
    let interval: number;
    if (isRunning && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Sync Duration -> TimeLeft (Only when not started)
  useEffect(() => {
    if (!hasStarted && !isRunning) {
      setTimeLeft(durationMinutes * 60);
    }
  }, [durationMinutes, hasStarted, isRunning]);

  const toggleTimer = () => {
    if (!isRunning && !hasStarted) {
        setHasStarted(true);
    }
    setIsRunning(!isRunning);
  };

  const handleComplete = () => {
    // 1. Save Distractions
    if (distractions.trim()) {
        const items = distractions.split('\n').filter(s => s.trim().length > 0);
        items.forEach(item => onSaveDistraction(item));
    }

    // 2. Complete Task Logic
    if (activeTaskId && activeTask) {
        onCompleteTask(activeTaskId);
    }

    // 3. Calculate Real Focus Time
    // Calculate how much time actually passed based on remaining time
    // Total Seconds Started With - Seconds Left = Seconds Elapsed
    const totalSeconds = durationMinutes * 60;
    const elapsedSeconds = totalSeconds - timeLeft;
    
    // We award minutes rounded down, but at least 1 minute if they did something significant (> 30s)
    let elapsedMinutes = Math.floor(elapsedSeconds / 60);
    if (elapsedSeconds > 30 && elapsedMinutes === 0) elapsedMinutes = 1;
    
    if (elapsedMinutes > 0) {
        onSessionComplete(elapsedMinutes);
    }

    onClose();
  };

  const handleBreak = () => {
    setIsRunning(false);
    onClose();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- Invisible Dial / Drag Logic ---
  const handlePointerDown = (e: React.PointerEvent) => {
    if (hasStarted) return;
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startDurationRef.current = durationMinutes;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || hasStarted) return;
    
    const deltaX = e.clientX - startXRef.current;
    // Sensitivity: 1 minute per 10 pixels
    const deltaMinutes = Math.round(deltaX / 10);
    
    let newDuration = startDurationRef.current + deltaMinutes;
    if (newDuration < MIN_MINUTES) newDuration = MIN_MINUTES;
    if (newDuration > MAX_MINUTES) newDuration = MAX_MINUTES;
    
    setDurationMinutes(newDuration);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (hasStarted) return;
    // Scroll up to increase, down to decrease
    const change = e.deltaY < 0 ? 1 : -1;
    let newDuration = durationMinutes + change;
    if (newDuration < MIN_MINUTES) newDuration = MIN_MINUTES;
    if (newDuration > MAX_MINUTES) newDuration = MAX_MINUTES;
    setDurationMinutes(newDuration);
  };

  const showSideButtons = !isRunning && hasStarted;

  return (
    <div className="fixed inset-0 bg-[#020617] z-[100] flex flex-col text-white transition-colors duration-500 overflow-hidden font-sans">
      
      {/* Top Bar */}
      <div className="flex justify-between items-start p-6 z-20">
         <div className="px-3 py-1.5 rounded bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 backdrop-blur-md text-blue-100">
            <span>Shield On</span>
            <Zap size={10} className="text-blue-400 fill-current" />
         </div>
         <button onClick={onClose} className="p-2 text-white/30 hover:text-white transition-colors">
            <X size={24} />
         </button>
      </div>

      {/* Task Info */}
      <div className="flex flex-col items-center justify-center mt-8 px-6 z-20">
          <div className="relative group max-w-md w-full text-center space-y-2">
             <div className="flex items-center justify-center gap-2 text-indigo-400 uppercase tracking-[0.2em] text-[10px] font-bold">
                <span className="w-1 h-1 rounded-full bg-indigo-500"></span>
                Current Task
             </div>
             
             {/* Task Selector / Title Display */}
             {activeTaskId && activeTask ? (
                 <div className="relative inline-block">
                    <select
                        value={activeTaskId}
                        onChange={(e) => setActiveTaskId(e.target.value)}
                        className="appearance-none bg-transparent text-2xl md:text-3xl font-semibold text-white border-none focus:ring-0 p-0 pr-6 cursor-pointer text-center hover:text-indigo-200 transition-colors truncate max-w-[80vw]"
                    >
                        {tasks.filter(t => !t.isCompleted).map(t => (
                        <option key={t.id} value={t.id} className="bg-slate-900 text-base text-slate-300">
                            {t.title}
                        </option>
                        ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-0 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                 </div>
             ) : (
                <div className="text-2xl md:text-3xl font-semibold text-white text-center">
                    {displayTitle}
                </div>
             )}
             
             <div className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                 {activeTask?.area || "Focus Session"}
             </div>
          </div>
      </div>

      {/* Timer Display Area (Interactive) */}
      <div className="flex-1 flex flex-col items-center justify-center relative w-full select-none">
          
          <div 
             onPointerDown={handlePointerDown}
             onPointerMove={handlePointerMove}
             onPointerUp={handlePointerUp}
             onPointerLeave={handlePointerUp}
             onWheel={handleWheel}
             className={`cursor-grab active:cursor-grabbing p-10 rounded-3xl transition-all duration-300 ${!hasStarted ? 'hover:bg-white/5' : ''}`}
          >
              <div className="text-[6rem] md:text-[9rem] font-light tracking-tighter tabular-nums leading-none font-[Inter] text-white">
                  {formatTime(timeLeft)}
              </div>
          </div>
          
          <div className="mt-8 flex items-center gap-3 text-slate-500 font-bold tracking-[0.3em] text-xs h-6 uppercase">
             {isRunning ? (
               <span className="animate-pulse text-indigo-400">Focusing...</span>
             ) : (
               <span>{hasStarted ? 'Paused' : 'Drag to adjust'}</span>
             )}
          </div>

      </div>

      {/* Controls */}
      <div className="pb-16 flex items-end justify-center gap-12 relative w-full max-w-md mx-auto min-h-[120px]">
            
            {/* Break Button (Left) */}
            <div className={`transition-all duration-500 transform ${showSideButtons ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none absolute left-8'}`}>
                 <button 
                    onClick={handleBreak}
                    className="flex flex-col items-center gap-3 group"
                 >
                    <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 text-amber-500 group-hover:border-amber-500/50 group-hover:bg-amber-500/10 flex items-center justify-center transition-all">
                        <Coffee size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-amber-500 transition-colors">Break</span>
                </button>
            </div>

            {/* Play/Pause (Center) */}
            <button 
                onClick={toggleTimer}
                className={`
                    relative z-20 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-95
                    ${isRunning 
                        ? 'bg-transparent border-2 border-white/20 text-white hover:bg-white/10' 
                        : 'bg-white text-slate-950 hover:scale-105 shadow-white/20'}
                `}
            >
                {isRunning ? (
                    <Pause size={32} fill="currentColor" className="animate-in fade-in zoom-in duration-300" />
                ) : (
                    <Play size={32} fill="currentColor" className="ml-1 animate-in fade-in zoom-in duration-300" />
                )}
            </button>

            {/* Done Button (Right) */}
            <div className={`transition-all duration-500 transform ${showSideButtons ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none absolute right-8'}`}>
                <button 
                    onClick={handleComplete}
                    className="flex flex-col items-center gap-3 group"
                >
                    <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 text-emerald-500 group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10 flex items-center justify-center transition-all">
                        <Check size={24} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-emerald-500 transition-colors">Done</span>
                </button>
            </div>

      </div>

      {/* Distraction Pad */}
      <div className="w-full border-t border-white/5 bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-xl mx-auto">
            <input
                type="text"
                value={distractions}
                onChange={(e) => setDistractions(e.target.value)}
                placeholder="Distraction? Type it here to save for later..."
                className="w-full bg-transparent p-6 text-slate-400 placeholder:text-slate-700 focus:outline-none focus:text-white transition-colors text-center text-sm font-medium"
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        setDistractions('');
                        if (distractions.trim()) onSaveDistraction(distractions);
                    }
                }}
            />
        </div>
      </div>
    </div>
  );
};
