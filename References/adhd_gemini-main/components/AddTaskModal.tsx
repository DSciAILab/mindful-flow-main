
import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Tag, ArrowRight, Zap, Repeat, CheckSquare, LayoutGrid, Infinity } from 'lucide-react';
import { LifeArea, Energy, Project } from '../types';

interface AddTaskModalProps {
  isOpen: boolean;
  projects?: Project[]; // Optional list of projects
  onClose: () => void;
  onAdd: (title: string, dueDate: string, area: LifeArea, energy: Energy, projectId?: string) => void;
  onAddHabit: (title: string, frequency: string, area: LifeArea, energy: Energy) => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, projects = [], onClose, onAdd, onAddHabit }) => {
  const [mode, setMode] = useState<'task' | 'habit'>('task');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('Today');
  const [isAnytime, setIsAnytime] = useState(false); // New State for Anytime
  const [frequency, setFrequency] = useState('daily');
  const [area, setArea] = useState<LifeArea>(LifeArea.Growth);
  const [energy, setEnergy] = useState<Energy>(Energy.Medium);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Reset defaults
      setTitle(''); 
      setEnergy(Energy.Medium); 
      setMode('task');
      setSelectedProjectId('');
      setIsAnytime(false);
      setDueDate('Today');
    }
  }, [isOpen]);

  // When project changes, auto-set the area to match the project
  useEffect(() => {
    if (selectedProjectId) {
      const proj = projects.find(p => p.id === selectedProjectId);
      if (proj) {
        setArea(proj.area);
      }
    }
  }, [selectedProjectId, projects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (mode === 'task') {
      const finalDueDate = isAnytime ? 'Anytime' : dueDate;
      onAdd(title, finalDueDate, area, energy, selectedProjectId || undefined);
    } else {
      onAddHabit(title, frequency, area, energy);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300">
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Create New</h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setMode('task')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                mode === 'task' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <CheckSquare size={16} /> Task
            </button>
            <button
              type="button"
              onClick={() => setMode('habit')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                mode === 'habit' 
                  ? 'bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <Repeat size={16} /> Habit
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={mode === 'task' ? "What needs to be done?" : "What habit do you want to build?"}
                className="w-full text-2xl font-medium bg-transparent border-none placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-0 text-slate-800 dark:text-slate-100 p-0"
              />
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              {mode === 'task' ? (
                <>
                  {/* Date Selector or Anytime Badge */}
                  {!isAnytime ? (
                    <div className="relative animate-in zoom-in duration-200">
                      <select
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="appearance-none pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Today">Today</option>
                        <option value="Tomorrow">Tomorrow</option>
                        <option value="Next Week">Next Week</option>
                      </select>
                      <Calendar className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 pl-3 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 animate-in zoom-in duration-200">
                        <Infinity size={16} /> Anytime
                    </div>
                  )}

                  {/* Anytime Toggle */}
                  <div className="flex items-center gap-2 ml-2">
                    <button 
                        type="button"
                        onClick={() => setIsAnytime(!isAnytime)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isAnytime ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAnytime ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 cursor-pointer" onClick={() => setIsAnytime(!isAnytime)}>
                        Anytime
                    </span>
                  </div>
                </>
              ) : (
                <div className="relative">
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="appearance-none pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="weekdays">Weekdays</option>
                    <option value="weekends">Weekends</option>
                  </select>
                  <Repeat className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
                </div>
              )}

              <div className="relative">
                 <select
                  value={area}
                  onChange={(e) => setArea(e.target.value as LifeArea)}
                  className="appearance-none pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.values(LifeArea).map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <Tag className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>

            {/* Project Selection (Only in Task Mode) */}
            {mode === 'task' && projects.length > 0 && (
              <div className="relative">
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full appearance-none pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">No Project (Single Task)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
                <LayoutGrid className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
              </div>
            )}

            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Required Energy</label>
                <div className="flex gap-2">
                    {[Energy.Low, Energy.Medium, Energy.High].map((e) => {
                        const isSelected = energy === e;
                        let colorClass = "";
                        if (e === Energy.Low) colorClass = isSelected ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700" : "hover:bg-emerald-50 dark:hover:bg-emerald-900/10";
                        if (e === Energy.Medium) colorClass = isSelected ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700" : "hover:bg-amber-50 dark:hover:bg-amber-900/10";
                        if (e === Energy.High) colorClass = isSelected ? "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-700" : "hover:bg-rose-50 dark:hover:bg-rose-900/10";

                        return (
                            <button
                                key={e}
                                type="button"
                                onClick={() => setEnergy(e)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border transition-all text-sm font-medium ${isSelected ? 'shadow-sm border-transparent ring-1 ring-inset' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500'} ${colorClass}`}
                            >
                                <Zap size={14} className={isSelected ? "fill-current" : "opacity-50"} />
                                {e}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={!title.trim()}
                className={`
                  px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-lg 
                  ${mode === 'task' 
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20' 
                    : 'bg-pink-600 hover:bg-pink-700 text-white shadow-pink-500/20'}
                `}
              >
                {mode === 'task' ? 'Create Task' : 'Start Habit'} <ArrowRight size={18} />
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};
