
import React, { useState, useEffect } from 'react';
import { TimerConfig } from '../types';
import { ChevronRight, Flame, Clock, Coffee, RefreshCw } from 'lucide-react';

interface EditTimerModalProps {
  isOpen: boolean;
  initialConfig?: TimerConfig | null;
  onClose: () => void;
  onSave: (config: TimerConfig) => void;
}

export const EditTimerModal: React.FC<EditTimerModalProps> = ({ isOpen, initialConfig, onClose, onSave }) => {
  const [title, setTitle] = useState('Focus');
  const [isInterval, setIsInterval] = useState(true);
  const [focusDuration, setFocusDuration] = useState(25);
  const [shortBreakDuration, setShortBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(25);
  const [sessionsPerCycle, setSessionsPerCycle] = useState(4);
  const [autoStartNextSession, setAutoStartNextSession] = useState(true);
  const [autoStartNextCycle, setAutoStartNextCycle] = useState(false);
  const [colorTheme, setColorTheme] = useState<'red' | 'green' | 'purple' | 'blue'>('red');

  useEffect(() => {
    if (isOpen) {
      if (initialConfig) {
        setTitle(initialConfig.title);
        setIsInterval(initialConfig.type === 'interval');
        setFocusDuration(initialConfig.focusDuration);
        setShortBreakDuration(initialConfig.shortBreakDuration);
        setLongBreakDuration(initialConfig.longBreakDuration);
        setSessionsPerCycle(initialConfig.sessionsPerCycle);
        setAutoStartNextSession(initialConfig.autoStartNextSession);
        setAutoStartNextCycle(initialConfig.autoStartNextCycle);
        setColorTheme(initialConfig.colorTheme);
      } else {
        // Defaults for new timer
        setTitle('New Timer');
        setIsInterval(false);
        setFocusDuration(30);
        setColorTheme('blue');
      }
    }
  }, [isOpen, initialConfig]);

  const handleSave = () => {
    onSave({
      id: initialConfig?.id || Date.now().toString(),
      title,
      type: isInterval ? 'interval' : 'countdown',
      focusDuration,
      shortBreakDuration,
      longBreakDuration,
      sessionsPerCycle,
      autoStartNextSession,
      autoStartNextCycle,
      colorTheme
    });
    onClose();
  };

  if (!isOpen) return null;

  const themeColors = {
    red: 'bg-red-500',
    green: 'bg-emerald-500',
    purple: 'bg-purple-600',
    blue: 'bg-blue-500'
  };

  const getIcon = () => {
    if (colorTheme === 'red') return <Clock size={20} className="text-white" />;
    if (colorTheme === 'green') return <Clock size={20} className="text-white" />;
    if (colorTheme === 'purple') return <Flame size={20} className="text-white" />;
    return <Clock size={20} className="text-white" />;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[#1c1c1e] h-[90vh] md:h-auto md:max-h-[85vh] md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-full md:zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-[#1c1c1e] shrink-0 border-b border-white/10">
          <button onClick={onClose} className="text-red-500 text-lg font-normal">Cancel</button>
          <h2 className="text-white font-bold text-lg">Edit</h2>
          <button onClick={handleSave} className="text-red-500 text-lg font-bold">Done</button>
        </div>

        {/* Content Scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Title Input */}
          <div className="flex items-center gap-3 p-3 bg-[#2c2c2e] rounded-xl">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${themeColors[colorTheme]}`}>
               {getIcon()}
            </div>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-transparent text-white text-lg font-medium w-full focus:outline-none placeholder:text-gray-500"
              placeholder="Timer Name"
            />
          </div>

          {/* Color Picker (Extra) */}
          <div className="flex justify-between px-2">
            {(Object.keys(themeColors) as Array<keyof typeof themeColors>).map(c => (
                <button 
                    key={c}
                    onClick={() => setColorTheme(c)}
                    className={`w-8 h-8 rounded-full ${themeColors[c]} ${colorTheme === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1c1c1e]' : 'opacity-50'}`}
                />
            ))}
          </div>

          {/* Interval Toggle Section */}
          <div className="bg-[#2c2c2e] rounded-xl overflow-hidden">
             <div className="flex items-center justify-between p-4 border-b border-white/10">
                <span className="text-white text-lg">Interval Timer</span>
                <button 
                  onClick={() => setIsInterval(!isInterval)}
                  className={`w-12 h-7 rounded-full transition-colors duration-200 ease-in-out relative ${isInterval ? 'bg-red-500' : 'bg-gray-600'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md absolute top-0.5 transition-transform duration-200 ${isInterval ? 'translate-x-5.5 left-[calc(100%-26px)]' : 'translate-x-0.5 left-0'}`} />
                </button>
             </div>

             <div className="flex items-center justify-between p-4 hover:bg-white/5 cursor-pointer">
                <span className="text-white text-lg">Focus Session Duration</span>
                <div className="flex items-center gap-2">
                    <input 
                        type="number"
                        value={focusDuration}
                        onChange={(e) => setFocusDuration(Number(e.target.value))}
                        className="bg-transparent text-gray-400 text-right w-16 focus:outline-none focus:text-white"
                    />
                    <span className="text-gray-400">min</span>
                </div>
             </div>
          </div>

          {/* Interval Specific Settings */}
          {isInterval && (
             <div className="bg-[#2c2c2e] rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                   <div className="flex items-center gap-2">
                      <span className="text-white text-lg">Short Break Duration</span>
                      <Coffee size={14} className="text-yellow-500" />
                   </div>
                   <div className="flex items-center gap-2">
                        <input 
                            type="number"
                            value={shortBreakDuration}
                            onChange={(e) => setShortBreakDuration(Number(e.target.value))}
                            className="bg-transparent text-gray-400 text-right w-16 focus:outline-none focus:text-white"
                        />
                        <span className="text-gray-400">min</span>
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 border-b border-white/10">
                   <div className="flex items-center gap-2">
                      <span className="text-white text-lg">Long Break Duration</span>
                      <Coffee size={14} className="text-yellow-500" />
                   </div>
                   <div className="flex items-center gap-2">
                        <input 
                            type="number"
                            value={longBreakDuration}
                            onChange={(e) => setLongBreakDuration(Number(e.target.value))}
                            className="bg-transparent text-gray-400 text-right w-16 focus:outline-none focus:text-white"
                        />
                        <span className="text-gray-400">min</span>
                    </div>
                </div>

                <div className="flex items-center justify-between p-4">
                   <div className="flex items-center gap-2">
                      <span className="text-white text-lg">Focus Sessions per Cycle</span>
                      <RefreshCw size={14} className="text-yellow-500" />
                   </div>
                   <div className="flex items-center gap-2">
                        <div className="bg-[#3a3a3c] rounded px-3 py-1 text-gray-300">
                             {sessionsPerCycle}
                        </div>
                   </div>
                </div>
             </div>
          )}

          {/* Auto Start Options */}
          {isInterval && (
              <div className="bg-[#2c2c2e] rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-4">
                 <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <span className="text-white text-lg">Auto-Start Next Session</span>
                    <button 
                        onClick={() => setAutoStartNextSession(!autoStartNextSession)}
                        className={`w-12 h-7 rounded-full transition-colors duration-200 ease-in-out relative ${autoStartNextSession ? 'bg-red-500' : 'bg-gray-600'}`}
                        >
                        <div className={`w-6 h-6 bg-white rounded-full shadow-md absolute top-0.5 transition-transform duration-200 ${autoStartNextSession ? 'translate-x-5.5 left-[calc(100%-26px)]' : 'translate-x-0.5 left-0'}`} />
                    </button>
                 </div>
                 <div className="flex items-center justify-between p-4">
                    <span className="text-white text-lg">Auto-Start Next Cycle</span>
                    <button 
                        onClick={() => setAutoStartNextCycle(!autoStartNextCycle)}
                        className={`w-12 h-7 rounded-full transition-colors duration-200 ease-in-out relative ${autoStartNextCycle ? 'bg-red-500' : 'bg-gray-600'}`}
                        >
                        <div className={`w-6 h-6 bg-white rounded-full shadow-md absolute top-0.5 transition-transform duration-200 ${autoStartNextCycle ? 'translate-x-5.5 left-[calc(100%-26px)]' : 'translate-x-0.5 left-0'}`} />
                    </button>
                 </div>
              </div>
          )}

          {/* Tags & Note Placeholder */}
          <div className="bg-[#2c2c2e] rounded-xl overflow-hidden">
             <div className="flex items-center justify-between p-4 border-b border-white/10 cursor-pointer hover:bg-white/5">
                <span className="text-white text-lg">Tags</span>
                <ChevronRight className="text-gray-500" />
             </div>
          </div>
          
          <div className="bg-[#2c2c2e] rounded-xl p-4 h-32">
             <textarea 
                placeholder="Add a note"
                className="bg-transparent w-full h-full text-white placeholder:text-gray-600 resize-none focus:outline-none"
             />
          </div>

        </div>
      </div>
    </div>
  );
};
