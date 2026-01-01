
import React, { useState, useMemo } from 'react';
import { Task, Mood, Energy, Habit, LifeArea, Project } from '../types';
import { TaskCard } from './TaskCard';
import { AddTaskModal } from './AddTaskModal';
import { TaskVersusMode } from './TaskVersusMode';
import { 
  Sparkles, Calendar, AlertCircle, Layers, Flame, ChevronDown, Plus,
  Sun, Cloud, CloudRain, Smile, Meh, Swords
} from 'lucide-react';

interface DailyDashboardProps {
  tasks: Task[];
  projects: Project[];
  habits: Habit[];
  mood: Mood;
  energy: Energy;
  setMood: (m: Mood) => void;
  onToggleTask: (id: string) => void;
  onFocusTask: (task: Task) => void;
  onAddTask: (title: string, dueDate: string, area: LifeArea, energy: Energy, projectId?: string) => void;
  onDeleteTask: (id: string) => void;
  onAddHabit: (title: string, frequency: string, area: LifeArea, energy: Energy) => void;
  onVersusWinner?: (taskId: string) => void;
}

type FilterType = 'today' | 'upcoming' | 'overdue' | 'all';

const FILTERS: { id: FilterType; label: string; icon: any }[] = [
    { id: 'today', label: 'Today', icon: Sparkles },
    { id: 'upcoming', label: 'Upcoming', icon: Calendar },
    { id: 'overdue', label: 'Overdue', icon: AlertCircle },
    { id: 'all', label: 'All Tasks', icon: Layers },
];

const MOOD_ICONS = {
  [Mood.Great]: { icon: Sun, label: 'Great', color: 'text-amber-500' },
  [Mood.Good]: { icon: Smile, label: 'Good', color: 'text-emerald-500' },
  [Mood.Okay]: { icon: Meh, label: 'Okay', color: 'text-slate-500' },
  [Mood.Low]: { icon: Cloud, label: 'Low', color: 'text-blue-400' },
  [Mood.Awful]: { icon: CloudRain, label: 'Awful', color: 'text-indigo-500' },
};

export const DailyDashboard: React.FC<DailyDashboardProps> = ({
  tasks,
  projects,
  habits,
  mood,
  energy,
  setMood,
  onToggleTask,
  onFocusTask,
  onAddTask,
  onDeleteTask,
  onAddHabit,
  onVersusWinner
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('today');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMoodOpen, setIsMoodOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isVersusModeOpen, setIsVersusModeOpen] = useState(false);

  // --- Date Helpers ---
  const getStartOfToday = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  };

  const parseDate = (dateStr: string): Date | null => {
    if (dateStr === 'Anytime') return null; // Special handling
    if (dateStr === 'Today') return getStartOfToday();
    if (dateStr === 'Tomorrow') {
        const d = getStartOfToday();
        d.setDate(d.getDate() + 1);
        return d;
    }
    if (dateStr === 'Next Week') {
        const d = getStartOfToday();
        d.setDate(d.getDate() + 7);
        return d;
    }
    // Handle YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
    }
    return null;
  };

  const getTaskCategory = (dateStr: string): FilterType | 'unknown' => {
      if (dateStr === 'Today') return 'today';
      if (dateStr === 'Tomorrow') return 'upcoming';
      if (dateStr === 'Next Week') return 'upcoming';
      if (dateStr === 'Anytime') return 'upcoming'; // Treat anytime as upcoming/backlog
      
      const date = parseDate(dateStr);
      if (!date) return 'unknown';

      const today = getStartOfToday();
      if (date.getTime() === today.getTime()) return 'today';
      if (date < today) return 'overdue';
      return 'upcoming';
  };

  // --- Filtering & Sorting ---
  const priorityTasks = tasks.filter(t => t.isPriority);
  const totalPriorityItems = priorityTasks.length;
  const completedPriorityItems = priorityTasks.filter(t => t.isCompleted).length;
  const progress = totalPriorityItems === 0 ? 0 : Math.round((completedPriorityItems / totalPriorityItems) * 100);

  const filteredTasks = tasks.filter(task => {
    if (task.habitId) return false; 
    
    const category = getTaskCategory(task.dueDate);

    if (activeFilter === 'all') return true;
    if (activeFilter === 'overdue') return category === 'overdue' && !task.isCompleted;
    if (activeFilter === 'today') return category === 'today';
    if (activeFilter === 'upcoming') return category === 'upcoming';
    
    return false;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    if (a.isPriority !== b.isPriority) return b.isPriority ? 1 : -1;
    // Sort logic for dates can be tricky with 'Anytime', pushing 'Anytime' to bottom of upcoming
    if (activeFilter === 'upcoming' && a.dueDate === 'Anytime' && b.dueDate !== 'Anytime') return 1;
    if (activeFilter === 'upcoming' && b.dueDate === 'Anytime' && a.dueDate !== 'Anytime') return -1;
    return 0;
  });

  const todaysHabitTasks = tasks.filter(t => t.habitId);
  const activeFilterData = FILTERS.find(f => f.id === activeFilter) || FILTERS[0];
  const activeMoodData = MOOD_ICONS[mood];

  // --- Calculate Counts for Dropdown ---
  const filterCounts = useMemo(() => {
    const counts = { today: 0, upcoming: 0, overdue: 0, all: 0 };
    tasks.forEach(task => {
      if (task.habitId) return;
      
      const category = getTaskCategory(task.dueDate);
      counts.all++;
      
      if (category === 'today') counts.today++;
      if (category === 'upcoming') counts.upcoming++;
      if (category === 'overdue' && !task.isCompleted) counts.overdue++;
    });
    return counts;
  }, [tasks]);

  const handleVersusWinner = (winnerId: string) => {
    setIsVersusModeOpen(false);
    if (onVersusWinner) onVersusWinner(winnerId);
  };

  // Filter tasks for Versus Mode (only today/overdue and incomplete, exclude Anytime for urgency battles)
  const versusCandidates = tasks.filter(t => 
    !t.isCompleted && 
    !t.habitId && 
    t.dueDate !== 'Anytime' &&
    (getTaskCategory(t.dueDate) === 'today' || getTaskCategory(t.dueDate) === 'overdue')
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-24">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
            Daily Plan
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Small steps lead to big changes.</p>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-indigo-600 dark:bg-indigo-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden border border-indigo-500/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl"></div>
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-lg">Daily Velocity</h2>
            <p className="text-indigo-200 text-sm">You completed {completedPriorityItems} out of {totalPriorityItems} priorities.</p>
          </div>
          <div className="text-3xl font-bold">{progress}%</div>
        </div>
        <div className="w-full bg-indigo-900/30 dark:bg-black/30 h-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white transition-all duration-1000 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Controls Grid: Versus | Mood | Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* 1. Versus Button */}
        {versusCandidates.length >= 2 ? (
            <button 
              onClick={() => setIsVersusModeOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-pink-500 to-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all font-bold text-sm"
            >
              <Swords size={18} />
              Prioritize (Versus)
            </button>
        ) : (
            <div className="hidden md:flex w-full items-center justify-center gap-2 px-4 py-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-sm">
                <Swords size={16} /> Prioritize (Needs 2+ tasks)
            </div>
        )}

        {/* 2. Mood Selector */}
        <div className="relative z-30">
            <button 
                onClick={() => setIsMoodOpen(!isMoodOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all text-slate-700 dark:text-slate-200 font-bold text-sm"
            >
                 <div className="flex items-center gap-2">
                    <activeMoodData.icon size={18} className={activeMoodData.color} />
                    <span>{mood}</span>
                 </div>
                 <ChevronDown size={14} className={`text-slate-400 transition-transform ${isMoodOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMoodOpen && (
                 <div className="absolute top-full mt-2 left-0 w-full bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 p-2 animate-in zoom-in-95 duration-200 flex flex-col gap-1 z-50">
                    {Object.values(Mood).map((m) => {
                       const { icon: Icon, color } = MOOD_ICONS[m];
                       const isSelected = mood === m;
                       return (
                          <button
                            key={m}
                            onClick={() => { setMood(m); setIsMoodOpen(false); }}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                               isSelected 
                                 ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                                 : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                             <Icon size={18} className={color} />
                             {m}
                          </button>
                       );
                    })}
                 </div>
            )}
        </div>

        {/* 3. Filter Selector */}
        <div className="relative z-20">
            <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all text-slate-700 dark:text-slate-200 font-bold text-sm"
            >
                <div className="flex items-center gap-2">
                    <activeFilterData.icon size={16} className="text-indigo-500" />
                    {activeFilterData.label}
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isFilterOpen && (
                <div className="absolute top-full mt-2 right-0 w-full bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 p-2 animate-in zoom-in-95 duration-200 flex flex-col gap-1 z-50">
                    {FILTERS.map(f => {
                        const count = filterCounts[f.id as keyof typeof filterCounts];
                        const isEmpty = count === 0;
                        return (
                            <button
                                key={f.id}
                                onClick={() => { setActiveFilter(f.id); setIsFilterOpen(false); }}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    activeFilter === f.id 
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                                        : isEmpty
                                            ? 'text-red-400 dark:text-red-400/80 hover:bg-red-50 dark:hover:bg-red-900/10'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <f.icon size={16} />
                                    {f.label}
                                </div>
                                <span className={`text-xs ${isEmpty ? 'text-red-300' : 'text-slate-400 opacity-50'}`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>

      </div>

      {/* Task List */}
      <div className="grid gap-3">
        {sortedTasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onToggle={onToggleTask} 
            onFocus={onFocusTask} 
            onDelete={onDeleteTask}
          />
        ))}
        
        {sortedTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
             <div className="p-4 bg-white dark:bg-slate-900 rounded-full mb-3 shadow-sm">
                <activeFilterData.icon size={24} className="text-slate-300 dark:text-slate-600" />
             </div>
             <p className="text-slate-400 dark:text-slate-500 font-medium">Nothing here for {activeFilterData.label.toLowerCase()}.</p>
          </div>
        )}
      </div>

      {/* Habits */}
      <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
           <Flame className="text-orange-500" size={20} />
           Habits & Routine
        </h2>
        <div className="grid md:grid-cols-2 gap-3">
          {todaysHabitTasks.map(task => {
            const relatedHabit = habits.find(h => h.id === task.habitId);
            return (
              <TaskCard 
                key={task.id} 
                task={task} 
                streak={relatedHabit?.streak}
                onToggle={onToggleTask} 
                onFocus={onFocusTask} 
                onDelete={onDeleteTask}
              />
            );
          })}
        </div>
      </div>

      {/* Add Task FAB (Fixed Above Coach) */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-36 right-4 md:bottom-28 md:right-8 z-40 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-600/30 flex items-center justify-center hover:bg-indigo-700 hover:scale-110 transition-all active:scale-95 group"
        title="Add New Task"
      >
        <Plus size={28} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Add Task Modal */}
      <AddTaskModal 
        isOpen={isAddModalOpen} 
        projects={projects}
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={onAddTask}
        onAddHabit={onAddHabit}
      />

      {/* Versus Mode Overlay */}
      {isVersusModeOpen && (
          <TaskVersusMode 
              tasks={versusCandidates} 
              onClose={() => setIsVersusModeOpen(false)}
              onWinnerFound={handleVersusWinner}
          />
      )}

    </div>
  );
};
