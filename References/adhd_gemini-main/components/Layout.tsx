
import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Target, Timer, StickyNote, AlertCircle, Moon, Sun } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onEmergency: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onEmergency }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check local storage or system preference
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'notes', label: 'Notes', icon: StickyNote },
    { id: 'timer', label: 'Timer', icon: Timer },
    { id: 'life', label: 'Life', icon: Target },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pb-20 md:pb-0 md:pl-20 transition-colors duration-300">
      
      {/* Desktop Sidebar / Mobile Bottom Nav */}
      <nav className="fixed bottom-0 w-full h-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around items-center z-40 md:w-20 md:h-full md:flex-col md:justify-start md:pt-8 md:border-r md:border-t-0 md:left-0 transition-all">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center w-full h-full md:h-20 md:w-full space-y-1 transition-colors ${
              activeTab === item.id 
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border-t-2 border-indigo-600 dark:border-indigo-400 md:border-t-0 md:border-l-4' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <item.icon size={24} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}

        {/* Theme Toggle (Desktop Position: Bottom of sidebar) */}
        <div className="hidden md:flex flex-1 flex-col justify-end pb-8 w-full items-center">
            <button 
              onClick={toggleTheme}
              className="p-3 rounded-full text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              title="Toggle Dark Mode"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
        </div>
      </nav>

      {/* Header Mobile - Theme Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 shadow-sm"
          >
             {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
      </div>

      {/* Emergency Button - Floating */}
      <div className="fixed top-4 right-4 z-50">
        <button 
          onClick={onEmergency}
          className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-bold transition-transform active:scale-95 animate-pulse"
        >
          <AlertCircle size={20} />
          <span className="hidden sm:inline">I'm Overwhelmed</span>
          <span className="sm:hidden">Help</span>
        </button>
      </div>

      <main className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};
