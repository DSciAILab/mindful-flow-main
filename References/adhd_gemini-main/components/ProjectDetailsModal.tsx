
import React, { useState } from 'react';
import { X, Plus, Trash2, Calendar } from 'lucide-react';
import { Project, Task, LifeArea, Energy } from '../types';
import { TaskCard } from './TaskCard';

interface ProjectDetailsModalProps {
  project: Project;
  tasks: Task[];
  onClose: () => void;
  onDeleteProject: (id: string) => void;
  onToggleTask: (id: string) => void;
  onFocusTask: (task: Task) => void;
  onAddTask: (title: string, dueDate: string, area: LifeArea, energy: Energy, projectId: string) => void;
  onDeleteTask: (id: string) => void;
}

export const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({
  project,
  tasks,
  onClose,
  onDeleteProject,
  onToggleTask,
  onFocusTask,
  onAddTask,
  onDeleteTask
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Calculate progress
  const total = tasks.length;
  const completed = tasks.filter(t => t.isCompleted).length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    // Default to Today for immediate action, inherit Area from Project
    onAddTask(newTaskTitle, 'Today', project.area, Energy.Medium, project.id);
    setNewTaskTitle('');
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this project? Tasks will be preserved but unlinked.')) {
      onDeleteProject(project.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
       {/* Backdrop */}
       <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
       
       {/* Modal Card */}
       <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-900/50">
             <div>
                <div className="flex items-center gap-2 mb-2">
                   <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                      {project.area}
                   </span>
                   {project.deadline && (
                     <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar size={12} /> Due {project.deadline}
                     </span>
                   )}
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white leading-tight">{project.title}</h2>
             </div>
             <div className="flex items-center gap-2">
                <button 
                  onClick={handleDelete}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete Project"
                >
                   <Trash2 size={20} />
                </button>
                <button 
                   onClick={onClose}
                   className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                   <X size={24} />
                </button>
             </div>
          </div>

          {/* Progress Section */}
          <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
             <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-slate-500">Project Progress</span>
                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{progress}%</span>
             </div>
             <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                   className="h-full bg-indigo-500 transition-all duration-500"
                   style={{ width: `${progress}%` }}
                />
             </div>
          </div>

          {/* Task List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50 dark:bg-slate-950/30">
             {tasks.length === 0 ? (
                <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                   <p>No tasks yet. Break it down into small steps!</p>
                </div>
             ) : (
                tasks.map(task => (
                   <TaskCard 
                      key={task.id} 
                      task={task} 
                      onToggle={onToggleTask} 
                      onFocus={onFocusTask}
                      onDelete={onDeleteTask}
                   />
                ))
             )}
          </div>

          {/* Add Task Input */}
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
             <form onSubmit={handleAddTask} className="flex gap-2">
                <input
                   type="text"
                   value={newTaskTitle}
                   onChange={(e) => setNewTaskTitle(e.target.value)}
                   placeholder="Add a next step..."
                   className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white placeholder:text-slate-400"
                />
                <button 
                   type="submit"
                   disabled={!newTaskTitle.trim()}
                   className="px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                   <Plus size={24} />
                </button>
             </form>
          </div>
       </div>
    </div>
  );
};
