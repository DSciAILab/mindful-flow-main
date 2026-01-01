
import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Tag, ArrowRight, Target, LayoutGrid } from 'lucide-react';
import { LifeArea } from '../types';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, deadline: string, area: LifeArea) => void;
}

export const AddProjectModal: React.FC<AddProjectModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [area, setArea] = useState<LifeArea>(LifeArea.Career);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      // Default deadline to 1 month from now
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      setDeadline(d.toISOString().split('T')[0]);
    } else {
      setTitle('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title, deadline, area);
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
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <LayoutGrid className="text-indigo-500" /> New Project
            </h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Project Name (e.g., 'Launch Website')"
                className="w-full text-2xl font-medium bg-transparent border-none placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-0 text-slate-800 dark:text-slate-100 p-0"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="relative">
                 <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="appearance-none pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                 />
                 <Calendar className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
              </div>

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

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={!title.trim()}
                className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20"
              >
                Create Project <ArrowRight size={18} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
