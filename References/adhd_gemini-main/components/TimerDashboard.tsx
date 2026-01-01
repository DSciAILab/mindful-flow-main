
import React from 'react';
import { TimerConfig, UserStats } from '../types';
import { EditTimerModal } from './EditTimerModal';
import { Play, MoreVertical, Plus, Clock, Flame, Zap, Shield, Coffee } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';

interface TimerDashboardProps {
  userId: string;
  stats: UserStats;
  onStartTimer: (config: TimerConfig) => void;
}

const DEFAULT_TIMERS: TimerConfig[] = [
  {
    id: '1',
    title: 'Focus',
    type: 'interval',
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsPerCycle: 4,
    autoStartNextSession: true,
    autoStartNextCycle: false,
    colorTheme: 'red'
  },
  {
    id: '2',
    title: 'Quick Focus',
    type: 'countdown',
    focusDuration: 10,
    shortBreakDuration: 0,
    longBreakDuration: 0,
    sessionsPerCycle: 1,
    autoStartNextSession: false,
    autoStartNextCycle: false,
    colorTheme: 'green'
  },
  {
    id: '3',
    title: 'Deep Focus',
    type: 'countdown',
    focusDuration: 90,
    shortBreakDuration: 0,
    longBreakDuration: 0,
    sessionsPerCycle: 1,
    autoStartNextSession: false,
    autoStartNextCycle: false,
    colorTheme: 'purple'
  }
];

export const TimerDashboard: React.FC<TimerDashboardProps> = ({ userId, stats, onStartTimer }) => {
  const [timers, setTimers, loading] = useFirestore<TimerConfig[]>('timers', DEFAULT_TIMERS, userId);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editingTimer, setEditingTimer] = React.useState<TimerConfig | null>(null);

  // Calculate stats from real data
  const totalMinutes = stats.totalFocusMinutes || 0;
  const focusedHours = Math.floor(totalMinutes / 60);
  const focusedMinutes = totalMinutes % 60;

  const handleEdit = (timer: TimerConfig) => {
    setEditingTimer(timer);
    setIsEditModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingTimer(null);
    setIsEditModalOpen(true);
  };

  const handleSaveTimer = (config: TimerConfig) => {
    if (editingTimer) {
      setTimers(prev => prev.map(t => t.id === config.id ? config : t));
    } else {
      setTimers(prev => [...prev, config]);
    }
  };

  const themeStyles = {
    red: { bg: 'bg-[#1a0f0f]', border: 'border-red-900/30', icon: 'bg-red-500/20 text-red-500', btn: 'bg-white text-black' },
    green: { bg: 'bg-[#0f1a13]', border: 'border-emerald-900/30', icon: 'bg-emerald-500/20 text-emerald-500', btn: 'bg-white text-black' },
    purple: { bg: 'bg-[#150f1a]', border: 'border-purple-900/30', icon: 'bg-purple-500/20 text-purple-400', btn: 'bg-white text-black' },
    blue: { bg: 'bg-[#0f151a]', border: 'border-blue-900/30', icon: 'bg-blue-500/20 text-blue-400', btn: 'bg-white text-black' }
  };

  if (loading && timers.length === 0) {
      return (
          <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
      );
  }

  return (
    <div className="min-h-[80vh] flex flex-col pb-24">
       
       {/* Header / Stats */}
       <div className="relative py-12 flex flex-col items-center justify-center text-center">
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-600/10 rounded-full blur-[80px] pointer-events-none"></div>
          
          <div className="flex items-center gap-2 mb-6">
            <span className="px-3 py-1 rounded-full border border-yellow-600/30 bg-yellow-900/20 text-yellow-500 text-[10px] font-bold flex items-center gap-1">
                <Flame size={10} fill="currentColor" /> PRO
            </span>
            <div className="flex-1"></div>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold flex items-center gap-1">
               Shield Off <Shield size={10} />
            </span>
          </div>

          <h2 className="text-slate-300 text-lg font-medium relative z-10">You stayed focused for</h2>
          <div className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-red-400 to-purple-600 relative z-10 mt-2 mb-2">
            {focusedHours}h {focusedMinutes}m
          </div>
          <p className="text-slate-500 text-sm max-w-xs relative z-10">
             {totalMinutes > 0 ? "Great job! Keep showing up." : "Start your first session today."}
          </p>
       </div>

       <div className="flex-1">
         <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Focus Timer</h3>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {timers.map(timer => {
                const styles = themeStyles[timer.colorTheme] || themeStyles.red;
                const totalDuration = timer.type === 'interval' 
                    ? (timer.focusDuration * timer.sessionsPerCycle) + (timer.shortBreakDuration * (timer.sessionsPerCycle - 1)) // Rough calc
                    : timer.focusDuration;
                
                return (
                    <div 
                        key={timer.id}
                        className={`${styles.bg} border ${styles.border} p-5 rounded-3xl relative group transition-transform hover:scale-[1.01]`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${styles.icon}`}>
                                    {timer.colorTheme === 'purple' ? <Flame size={16} fill="currentColor" /> : 
                                     timer.colorTheme === 'green' ? <Zap size={16} fill="currentColor" /> :
                                     <Clock size={16} />
                                    }
                                </div>
                                <h4 className="text-white font-bold text-lg">{timer.title}</h4>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleEdit(timer); }}
                                className="text-slate-500 hover:text-white p-1"
                            >
                                <MoreVertical size={20} />
                            </button>
                        </div>

                        <p className="text-slate-400 text-sm mb-1">{timer.type === 'interval' ? 'Interval Timer' : 'Countdown Timer'}</p>
                        <div className="text-4xl font-bold text-white mb-4">
                            {totalDuration}m
                        </div>

                        <div className="flex flex-col gap-1 mb-6 text-xs text-slate-500 font-medium">
                            <div className="flex items-center gap-2">
                                <Clock size={12} /> Focus {timer.focusDuration}m x{timer.sessionsPerCycle}
                            </div>
                            {timer.type === 'interval' && (
                                <div className="flex items-center gap-2">
                                    <Coffee size={12} /> Break {timer.shortBreakDuration}m x{timer.sessionsPerCycle - 1}
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={() => onStartTimer(timer)}
                            className={`w-full py-3 rounded-full font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${styles.btn}`}
                        >
                            Start <Play size={14} fill="currentColor" />
                        </button>
                    </div>
                )
            })}

            {/* Add New Card */}
            <button 
                onClick={handleAddNew}
                className="border border-dashed border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50 rounded-3xl p-5 flex flex-col items-center justify-center gap-4 min-h-[250px] hover:bg-slate-200 dark:hover:bg-slate-900 transition-all group"
            >
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-slate-300 dark:group-hover:bg-slate-700 group-hover:text-slate-600 dark:group-hover:text-white transition-colors">
                    <Plus size={24} />
                </div>
                <span className="text-slate-500 dark:text-slate-400 font-medium group-hover:text-slate-700 dark:group-hover:text-white">Add new timer</span>
            </button>

         </div>
       </div>

       <EditTimerModal 
         isOpen={isEditModalOpen}
         initialConfig={editingTimer}
         onClose={() => setIsEditModalOpen(false)}
         onSave={handleSaveTimer}
       />
    </div>
  );
};
