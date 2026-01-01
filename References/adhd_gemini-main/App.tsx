
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { LoginScreen } from './components/LoginScreen';
import { Layout } from './components/Layout';
import { DailyDashboard } from './components/DailyDashboard';
import { WheelOfLife } from './components/WheelOfLife';
import { FocusTimer } from './components/FocusTimer';
import { EmergencyMode } from './components/EmergencyMode';
import { CaptureInbox } from './components/CaptureInbox';
import { FloatingCoach } from './components/FloatingCoach';
import { AddProjectModal } from './components/AddProjectModal';
import { ProjectDetailsModal } from './components/ProjectDetailsModal'; 
import { TimerDashboard } from './components/TimerDashboard';
import { useFirestore } from './hooks/useFirestore';
import { 
  INITIAL_TASKS, 
  INITIAL_WHEEL_SCORES, 
  INITIAL_HABITS, 
  INITIAL_PROJECTS,
  INITIAL_INBOX
} from './constants';
import { Task, Mood, Energy, Project, WheelScore, LifeArea, InboxItem, JournalEntry, Habit, TimerConfig, UserStats } from './types';
import { Book, Plus, PenTool, Target, LayoutGrid, LogOut, Loader2 } from 'lucide-react';

// --- MAIN APP COMPONENT (Handles Auth) ---
function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
         <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <DashboardApp user={user} />;
}

// --- DASHBOARD LOGIC (Authenticated) ---
interface DashboardAppProps {
    user: User;
}

function DashboardApp({ user }: DashboardAppProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lifeTab, setLifeTab] = useState<'wheel' | 'projects' | 'journal'>('projects');
  
  // Persisted State using Firestore
  const [tasks, setTasks, loadingTasks] = useFirestore<Task[]>('tasks', INITIAL_TASKS, user.uid);
  const [inbox, setInbox] = useFirestore<InboxItem[]>('inbox', INITIAL_INBOX, user.uid);
  const [wheelScores, setWheelScores] = useFirestore<WheelScore[]>('wheel', INITIAL_WHEEL_SCORES, user.uid);
  const [projects, setProjects] = useFirestore<Project[]>('projects', INITIAL_PROJECTS, user.uid);
  const [habits, setHabits] = useFirestore<Habit[]>('habits', INITIAL_HABITS, user.uid);
  const [mood, setMood] = useFirestore<Mood>('mood', Mood.Okay, user.uid);
  const [energy, setEnergy] = useFirestore<Energy>('energy', Energy.Medium, user.uid);
  const [stats, setStats] = useFirestore<UserStats>('stats', { totalFocusMinutes: 0, sessionsCompleted: 0 }, user.uid);
  
  const [journalEntries, setJournalEntries] = useFirestore<JournalEntry[]>('journal', [
    { id: 'j1', date: '2023-10-24', content: 'Feeling productive today.', mood: Mood.Good, energy: Energy.High }
  ], user.uid);

  const [newJournalEntry, setNewJournalEntry] = useState('');

  // Local State (Modal visibility, etc.)
  const [focusState, setFocusState] = useState<{
    type: 'task' | 'config';
    taskId?: string;
    config?: { duration: number; title: string; };
  } | null>(null);

  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleLogout = () => {
    if(confirm("Sign out?")) {
        signOut(auth);
    }
  };

  const toggleTask = (id: string) => {
    setTasks(prevTasks => {
      const taskIndex = prevTasks.findIndex(t => t.id === id);
      if (taskIndex === -1) return prevTasks;

      const task = prevTasks[taskIndex];
      const newStatus = !task.isCompleted;

      // Handle Habit Streak Logic (Update habits collection independently)
      if (task.habitId) {
        setHabits(prevHabits => prevHabits.map(h => {
          if (h.id === task.habitId) {
            const newStreak = newStatus 
              ? h.streak + 1 
              : Math.max(0, h.streak - 1);
            return { ...h, streak: newStreak };
          }
          return h;
        }));
      }

      const newTasks = [...prevTasks];
      newTasks[taskIndex] = { ...task, isCompleted: newStatus };
      return newTasks;
    });
  };

  const addTask = (title: string, dueDate: string, area: LifeArea, energyLevel: Energy = Energy.Medium, projectId?: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      projectId, 
      isCompleted: false,
      isPriority: false, 
      dueDate,
      area,
      energyLevel
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (!taskToDelete) return;

    if (taskToDelete.habitId) {
      if (window.confirm("Do you want to delete this Habit entirely?")) {
        setHabits(prev => prev.filter(h => h.id !== taskToDelete.habitId));
        setTasks(prev => prev.filter(t => t.habitId !== taskToDelete.habitId));
      }
    } else {
        if(window.confirm("Delete this task?")) {
            setTasks(prev => prev.filter(t => t.id !== id));
        }
    }
  };

  const addHabit = (title: string, frequency: string, area: LifeArea, energyVal: Energy = Energy.Medium) => {
    const newHabit: Habit = {
      id: `h-${Date.now()}`,
      title,
      frequency,
      area,
      streak: 0
    };
    setHabits(prev => [...prev, newHabit]);

    const habitTask: Task = {
      id: `ht-${Date.now()}`,
      title: `${title} (Habit)`,
      habitId: newHabit.id,
      isCompleted: false,
      isPriority: true,
      dueDate: 'Today',
      area,
      energyLevel: energyVal
    };
    setTasks(prev => [habitTask, ...prev]);
  };

  const addProject = (title: string, deadline: string, area: LifeArea) => {
      const newProject: Project = {
          id: `p-${Date.now()}`,
          title,
          deadline,
          area,
          goalId: '', 
          progress: 0
      };
      setProjects(prev => [...prev, newProject]);
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setTasks(prev => prev.map(t => t.projectId === id ? { ...t, projectId: undefined } : t));
  };

  const updateWheelScore = (area: LifeArea, score: number) => {
    setWheelScores(prev => prev.map(s => s.area === area ? { ...s, score } : s));
  };

  const addJournalEntry = () => {
    if (!newJournalEntry.trim()) return;
    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      content: newJournalEntry,
      mood: mood,
      energy: energy
    };
    setJournalEntries(prev => [entry, ...prev]);
    setNewJournalEntry('');
  };

  const addInboxItem = (text: string) => {
    const newItem: InboxItem = {
      id: Date.now().toString(),
      content: text,
      createdAt: Date.now(),
      isProcessed: false
    };
    setInbox(prev => [newItem, ...prev]);
  };

  const removeInboxItem = (id: string) => {
    setInbox(prev => prev.filter(item => item.id !== id));
  };

  const handleConvertInboxToTask = (title: string, area: LifeArea, energyVal: Energy) => {
    addTask(title, 'Today', area, energyVal);
  };

  const handleCompleteTinyStep = () => {
    setIsEmergencyMode(false);
  };

  const handleVersusWinner = (winnerId: string) => {
    setTasks(prev => {
        const winner = prev.find(t => t.id === winnerId);
        if (!winner) return prev;
        const others = prev.filter(t => t.id !== winnerId);
        const updatedWinner = { ...winner, isPriority: true };
        return [updatedWinner, ...others];
    });
  };

  const handleStartTimerConfig = (config: TimerConfig) => {
      setFocusState({
          type: 'config',
          config: {
              duration: config.focusDuration,
              title: config.title
          }
      });
  };

  const handleStartTaskFocus = (task: Task) => {
      setFocusState({
          type: 'task',
          taskId: task.id
      });
  };

  const handleSessionComplete = (minutes: number) => {
      setStats(prev => ({
          ...prev,
          totalFocusMinutes: (prev.totalFocusMinutes || 0) + minutes,
          sessionsCompleted: (prev.sessionsCompleted || 0) + 1
      }));
  };

  // Wait for critical data (tasks) to load to prevent overwrite
  if (loadingTasks) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-4">
           <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
           <p className="text-slate-500 animate-pulse">Syncing your Life OS...</p>
        </div>
     )
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      onEmergency={() => setIsEmergencyMode(true)}
    >
      
      {/* Logout Button (Top Right Absolute or integrated) */}
      <button 
         onClick={handleLogout}
         className="fixed top-4 right-16 md:right-4 z-50 p-2 text-slate-400 hover:text-red-500 transition-colors"
         title="Sign Out"
      >
          <LogOut size={20} />
      </button>

      {/* --- DASHBOARD TAB --- */}
      {activeTab === 'dashboard' && (
        <DailyDashboard 
          tasks={tasks}
          projects={projects}
          habits={habits}
          mood={mood}
          energy={energy}
          setMood={setMood}
          onToggleTask={toggleTask}
          onFocusTask={handleStartTaskFocus}
          onAddTask={addTask}
          onDeleteTask={deleteTask}
          onAddHabit={addHabit}
          onVersusWinner={handleVersusWinner}
        />
      )}

      {/* --- NOTES TAB (Inbox) --- */}
      {activeTab === 'notes' && (
        <CaptureInbox 
          items={inbox}
          projects={projects}
          onAdd={addInboxItem}
          onRemove={removeInboxItem}
          onConvertToTask={handleConvertInboxToTask}
        />
      )}

      {/* --- TIMER TAB --- */}
      {activeTab === 'timer' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <TimerDashboard userId={user.uid} stats={stats} onStartTimer={handleStartTimerConfig} />
        </div>
      )}

      {/* --- LIFE TAB (Wheel, Goals, Journal) --- */}
      {activeTab === 'life' && (
        <div className="space-y-6 pb-24">
           <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm pt-2 pb-4 border-b border-slate-200/50 dark:border-slate-800/50 -mx-4 px-4 md:-mx-8 md:px-8">
               <div className="flex items-center justify-between mb-4">
                   <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Target className="text-pink-500" /> Life OS
                   </h1>
               </div>
               
               <div className="flex p-1 bg-slate-200 dark:bg-slate-800 rounded-xl">
                   <button 
                     onClick={() => setLifeTab('projects')} 
                     className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${lifeTab === 'projects' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                   >
                      <LayoutGrid size={16} /> Projects
                   </button>
                   <button 
                     onClick={() => setLifeTab('wheel')} 
                     className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${lifeTab === 'wheel' ? 'bg-white dark:bg-slate-700 shadow-sm text-pink-600 dark:text-pink-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                   >
                      <Target size={16} /> Balance
                   </button>
                   <button 
                     onClick={() => setLifeTab('journal')} 
                     className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${lifeTab === 'journal' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                   >
                      <Book size={16} /> Journal
                   </button>
               </div>
           </div>

           <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               {lifeTab === 'projects' && (
                 <div className="space-y-6">
                    <div className="grid gap-4">
                      {projects.map(p => {
                        const projectTasks = tasks.filter(t => t.projectId === p.id);
                        const total = projectTasks.length;
                        const completed = projectTasks.filter(t => t.isCompleted).length;
                        const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

                        return (
                          <div 
                            key={p.id} 
                            onClick={() => setSelectedProject(p)} 
                            className="group p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-800"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{p.title}</h4>
                                <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500 dark:text-slate-400 mt-1 inline-block uppercase tracking-wider">{p.area}</span>
                              </div>
                              <span className="font-mono font-bold text-indigo-500">{progress}%</span>
                            </div>
                            
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
                              <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
                            </div>
                            
                            <div className="flex justify-between items-center text-xs text-slate-400">
                               <span>Deadline: {p.deadline}</span>
                               <span className="text-indigo-600 dark:text-indigo-400 hover:underline">View & Edit Tasks</span>
                            </div>
                          </div>
                        );
                      })}
                      
                      <button 
                        onClick={() => setIsAddProjectModalOpen(true)}
                        className="p-5 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
                      >
                          <Plus size={20} /> New Project
                      </button>
                    </div>
                 </div>
               )}

               {lifeTab === 'wheel' && (
                  <WheelOfLife scores={wheelScores} onUpdate={updateWheelScore} />
               )}

               {lifeTab === 'journal' && (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <textarea
                        value={newJournalEntry}
                        onChange={(e) => setNewJournalEntry(e.target.value)}
                        placeholder="What's on your mind? Reflect on your day..."
                        className="w-full bg-slate-50 dark:bg-slate-950/50 border-none rounded-xl p-3 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/50 resize-none h-32 mb-2"
                      />
                      <div className="flex justify-between items-center">
                         <div className="flex gap-2">
                            <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-500">Mood: {mood}</span>
                         </div>
                         <button 
                          onClick={addJournalEntry}
                          disabled={!newJournalEntry.trim()}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                        >
                          <PenTool size={14} /> Log Entry
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider">Recent Entries</h3>
                      {journalEntries.map(entry => (
                        <div key={entry.id} className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 py-1">
                          <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                          <div className="text-xs text-slate-400 mb-1 font-mono">{entry.date}</div>
                          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                             {entry.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
               )}
           </div>
        </div>
      )}

      {/* Global Elements */}
      <FloatingCoach 
        tasks={tasks}
        wheel={wheelScores}
        mood={mood}
        energy={energy}
        onAddTask={addTask}
        onUpdateMood={setMood}
      />

      {focusState && (
        <FocusTimer 
          initialTaskId={focusState.taskId}
          initialDuration={focusState.config?.duration}
          initialTitle={focusState.config?.title}
          tasks={tasks}
          onClose={() => setFocusState(null)}
          onCompleteTask={toggleTask}
          onSaveDistraction={addInboxItem}
          onSessionComplete={handleSessionComplete}
        />
      )}

      {isEmergencyMode && (
        <EmergencyMode 
          tasks={tasks}
          onClose={() => setIsEmergencyMode(false)}
          onCompleteTinyStep={handleCompleteTinyStep}
        />
      )}

      <AddProjectModal 
        isOpen={isAddProjectModalOpen} 
        onClose={() => setIsAddProjectModalOpen(false)}
        onAdd={addProject}
      />

      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          tasks={tasks.filter(t => t.projectId === selectedProject.id)}
          onClose={() => setSelectedProject(null)}
          onDeleteProject={deleteProject}
          onToggleTask={toggleTask}
          onFocusTask={handleStartTaskFocus}
          onAddTask={addTask}
          onDeleteTask={deleteTask}
        />
      )}

    </Layout>
  );
}

export default App;
