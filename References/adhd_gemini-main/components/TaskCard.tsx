
import React from 'react';
import { CheckCircle2, Circle, Clock, Tag, CalendarDays, AlertCircle, Flame, Zap, Trash2, Infinity } from 'lucide-react';
import { Task, LifeArea, Energy } from '../types';

interface TaskCardProps {
  task: Task;
  streak?: number;
  onToggle: (id: string) => void;
  onFocus: (task: Task) => void;
  onDelete: (id: string) => void;
}

// Updated colors to include Dark Mode variants
const areaColors: Record<LifeArea, string> = {
  [LifeArea.Health]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
  [LifeArea.Career]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  [LifeArea.Finance]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  [LifeArea.Relationships]: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200 dark:border-pink-800',
  [LifeArea.Growth]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  [LifeArea.Leisure]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  [LifeArea.Environment]: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  [LifeArea.Spirituality]: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300 border-violet-200 dark:border-violet-800',
};

const energyColors: Record<Energy, string> = {
    [Energy.Low]: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400',
    [Energy.Medium]: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
    [Energy.High]: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400',
};

const isDateInPast = (dateStr: string) => {
  if (dateStr === 'Anytime') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const due = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, streak, onToggle, onFocus, onDelete }) => {
  const isToday = task.dueDate === 'Today';
  const isAnytime = task.dueDate === 'Anytime';
  const isOverdue = !isToday && !isAnytime && !task.isCompleted && isDateInPast(task.dueDate);

  // Dynamic border and background styles based on status
  let cardStyles = "border-slate-100 bg-white dark:bg-slate-900 dark:border-slate-800";
  
  if (task.isCompleted) {
    cardStyles = "border-slate-100 bg-slate-50 dark:bg-slate-900/50 dark:border-slate-800 opacity-60";
  } else if (isToday) {
    // Priority focus
    cardStyles = "border-orange-200 bg-white dark:bg-slate-900 dark:border-orange-900/50 shadow-md ring-1 ring-orange-100 dark:ring-orange-900/30"; 
  } else if (isOverdue) {
    // Warning
    cardStyles = "border-red-200 bg-red-50/30 dark:bg-red-900/10 dark:border-red-900/50"; 
  }

  return (
    <>
      <style>{`
        @keyframes flame-pulse {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.1); filter: brightness(1.2); }
        }
        @keyframes pop-in {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-flame {
          animation: flame-pulse 2s ease-in-out infinite;
        }
        .animate-pop {
          animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
      
      <div className={`
        group flex items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-md
        ${cardStyles}
      `}>
        <button 
          onClick={() => onToggle(task.id)}
          className="text-slate-400 dark:text-slate-600 hover:text-green-500 dark:hover:text-green-400 transition-colors relative shrink-0"
        >
          {task.isCompleted ? (
            <CheckCircle2 className="w-6 h-6 text-green-500 dark:text-green-400 animate-in zoom-in spin-in-90 duration-300" />
          ) : (
            <Circle className="w-6 h-6" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <h3 className={`font-medium truncate ${task.isCompleted ? 'line-through text-slate-500 dark:text-slate-600' : 'text-slate-800 dark:text-slate-200'}`}>
            {task.title}
          </h3>
          <div className="flex gap-2 mt-1 flex-wrap items-center">
            {/* Due Date Badge */}
            <span className={`flex items-center text-xs font-medium px-2 py-0.5 rounded border
              ${isToday 
                ? 'text-orange-700 bg-orange-50 border-orange-100 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-900/50' 
                : isOverdue
                  ? 'text-red-700 bg-red-50 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/50'
                  : 'text-slate-500 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}
            `}>
              {isToday ? <Clock className="w-3 h-3 mr-1" /> : 
               isAnytime ? <Infinity className="w-3 h-3 mr-1" /> :
               isOverdue ? <AlertCircle className="w-3 h-3 mr-1" /> :
               <CalendarDays className="w-3 h-3 mr-1" />
              } 
              {task.dueDate}
              {isOverdue && " (Overdue)"}
            </span>

            {/* Area Badge */}
            <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${areaColors[task.area]}`}>
              {task.area}
            </span>

            {/* Energy Badge */}
            {task.energyLevel && (
                 <span className={`flex items-center text-[10px] px-2 py-0.5 rounded border border-transparent font-medium ${energyColors[task.energyLevel]}`}>
                    <Zap size={10} className="mr-1 fill-current" />
                    {task.energyLevel}
                 </span>
            )}
            
            {/* Habit Badge */}
            {task.habitId && typeof streak !== 'number' && (
              <span className="flex items-center text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                <Tag className="w-3 h-3 mr-1" /> Habit
              </span>
            )}

            {/* Streak Counter - Celebratory Animation */}
            {typeof streak === 'number' && (
               <div className={`
                 flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all duration-500 overflow-hidden
                 ${task.isCompleted 
                   ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900 shadow-[0_0_15px_rgba(249,115,22,0.15)] ring-1 ring-orange-100 dark:ring-orange-900 animate-pop' 
                   : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'}
               `}>
                 <Flame 
                   size={14} 
                   className={`transition-all duration-500 ${task.isCompleted ? 'fill-orange-500 text-orange-600 dark:text-orange-400 animate-flame' : 'text-slate-300 dark:text-slate-600'}`} 
                 />
                 <span className={`text-xs ${task.isCompleted ? 'text-orange-700 dark:text-orange-300' : ''}`}>
                   {streak}
                 </span>
                 <span className="font-normal opacity-70 ml-0.5">streak</span>
               </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {!task.isCompleted && (
            <button 
                onClick={() => onFocus(task)}
                className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs font-bold px-3 py-1.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-800 mr-1"
            >
                Focus
            </button>
            )}
            <button 
                onClick={() => onDelete(task.id)}
                className="p-2 text-slate-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
                title="Delete"
            >
                <Trash2 size={16} />
            </button>
        </div>
      </div>
    </>
  );
};
