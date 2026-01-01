
import React, { useState, useEffect } from 'react';
import { Task, LifeArea, Energy } from '../types';
import { X, Trophy, Swords, Zap, ArrowRight, ArrowLeft } from 'lucide-react';

interface TaskVersusModeProps {
  tasks: Task[];
  onClose: () => void;
  onWinnerFound: (winnerId: string) => void;
}

export const TaskVersusMode: React.FC<TaskVersusModeProps> = ({ tasks, onClose, onWinnerFound }) => {
  // We need at least 2 tasks to compare
  const [queue, setQueue] = useState<Task[]>([]);
  const [champion, setChampion] = useState<Task | null>(null);
  const [challenger, setChallenger] = useState<Task | null>(null);
  const [step, setStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    // Initialize: Filter only incomplete tasks
    const candidates = tasks.filter(t => !t.isCompleted);
    
    if (candidates.length < 2) {
      // Not enough tasks to battle
      onClose();
      return;
    }

    setChampion(candidates[0]);
    setChallenger(candidates[1]);
    setQueue(candidates.slice(2)); // The rest waiting in line
    setTotalSteps(candidates.length - 1);
  }, []); // Run once on mount

  const handleChoice = (winner: 'champion' | 'challenger') => {
    if (!champion || !challenger) return;

    const currentWinner = winner === 'champion' ? champion : challenger;
    
    // Animation/Transition delay could be added here
    
    if (queue.length === 0) {
      // Tournament Over
      setChampion(currentWinner);
      setChallenger(null);
      setIsFinished(true);
    } else {
      // Next Round
      setChampion(currentWinner);
      setChallenger(queue[0]);
      setQueue(prev => prev.slice(1));
      setStep(prev => prev + 1);
    }
  };

  const handleFinalize = () => {
    if (champion) {
      onWinnerFound(champion.id);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished) return;
      if (e.key === 'ArrowLeft') handleChoice('champion');
      if (e.key === 'ArrowRight') handleChoice('challenger');
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [champion, challenger, queue, isFinished]);

  if (!champion) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="absolute top-6 left-0 right-0 flex justify-between items-center px-6">
        <div className="flex items-center gap-2 text-white/70">
          <Swords size={20} />
          <span className="font-bold tracking-widest uppercase text-sm">Versus Mode</span>
        </div>
        <button onClick={onClose} className="p-2 text-white/50 hover:text-white transition-colors">
          <X size={24} />
        </button>
      </div>

      {!isFinished ? (
        <div className="w-full max-w-4xl flex flex-col items-center">
          
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Which is more important <span className="text-indigo-400">right now</span>?</h2>
          
          <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-12 w-full">
            
            {/* Champion Card (Left) */}
            <button 
              onClick={() => handleChoice('champion')}
              className="flex-1 bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-indigo-500 rounded-3xl p-8 text-left transition-all hover:scale-[1.02] group relative overflow-hidden"
            >
              <div className="absolute top-4 right-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Option A</div>
              <div className="mb-4">
                 <span className={`text-[10px] px-2 py-1 rounded border ${champion.area === 'Health' ? 'border-green-800 bg-green-900/20 text-green-400' : 'border-slate-600 bg-slate-700 text-slate-300'}`}>
                    {champion.area}
                 </span>
              </div>
              <h3 className="text-xl md:text-3xl font-bold text-white mb-4 leading-tight">{champion.title}</h3>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                 <Zap size={14} /> {champion.energyLevel || Energy.Medium} Energy
              </div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400">
                <ArrowLeft size={24} />
              </div>
            </button>

            {/* VS Badge */}
            <div className="flex items-center justify-center shrink-0 relative z-10 -my-6 md:my-0">
               <div className="w-16 h-16 rounded-full bg-slate-900 border-4 border-slate-800 flex items-center justify-center text-xl font-black text-white shadow-xl italic">
                 VS
               </div>
            </div>

            {/* Challenger Card (Right) */}
            {challenger && (
              <button 
                onClick={() => handleChoice('challenger')}
                className="flex-1 bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-pink-500 rounded-3xl p-8 text-left transition-all hover:scale-[1.02] group relative overflow-hidden"
              >
                <div className="absolute top-4 right-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Option B</div>
                <div className="mb-4">
                  <span className={`text-[10px] px-2 py-1 rounded border ${challenger.area === 'Health' ? 'border-green-800 bg-green-900/20 text-green-400' : 'border-slate-600 bg-slate-700 text-slate-300'}`}>
                      {challenger.area}
                  </span>
                </div>
                <h3 className="text-xl md:text-3xl font-bold text-white mb-4 leading-tight">{challenger.title}</h3>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Zap size={14} /> {challenger.energyLevel || Energy.Medium} Energy
                </div>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-pink-400">
                  <ArrowRight size={24} />
                </div>
              </button>
            )}
          </div>

          {/* Progress */}
          <div className="mt-12 flex flex-col items-center gap-2 w-full max-w-xs">
            <div className="flex justify-between w-full text-xs text-slate-500 uppercase font-bold">
               <span>Battle {step + 1}</span>
               <span>{totalSteps} Rounds</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-300" style={{ width: `${((step) / totalSteps) * 100}%` }}></div>
            </div>
          </div>
          
          <p className="mt-8 text-slate-500 text-sm hidden md:block">
            Tip: Use <kbd className="bg-slate-800 px-2 py-1 rounded border border-slate-700 text-white">←</kbd> and <kbd className="bg-slate-800 px-2 py-1 rounded border border-slate-700 text-white">→</kbd> arrow keys to choose.
          </p>

        </div>
      ) : (
        /* Winner Screen */
        <div className="max-w-md w-full text-center animate-in zoom-in-95 duration-500">
           <div className="inline-flex p-6 bg-yellow-500/10 rounded-full mb-6 relative">
              <div className="absolute inset-0 bg-yellow-500 blur-2xl opacity-20 animate-pulse"></div>
              <Trophy size={64} className="text-yellow-400 relative z-10" />
           </div>
           
           <h2 className="text-3xl font-bold text-white mb-2">We have a Winner!</h2>
           <p className="text-slate-400 mb-8">This is your absolute top priority right now.</p>
           
           <div className="bg-slate-800 p-6 rounded-2xl border border-yellow-500/30 mb-8 shadow-lg shadow-yellow-500/10">
              <h3 className="text-2xl font-bold text-white">{champion.title}</h3>
           </div>

           <button 
             onClick={handleFinalize}
             className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
           >
             Set as Priority & Start
           </button>
        </div>
      )}
    </div>
  );
};
