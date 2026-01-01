
import React, { useState, useEffect } from 'react';
import { generateEmergencyStep } from '../services/geminiService';
import { Task } from '../types';
import { Wind, ArrowRight, Check } from 'lucide-react';

interface EmergencyModeProps {
  tasks: Task[];
  onClose: () => void;
  onCompleteTinyStep: () => void;
}

export const EmergencyMode: React.FC<EmergencyModeProps> = ({ tasks, onClose, onCompleteTinyStep }) => {
  const [step, setStep] = useState<'breathe' | 'action'>('breathe');
  const [suggestion, setSuggestion] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Simulate breathing time then load suggestion
    if (step === 'breathe') {
      const timer = setTimeout(() => {
        setLoading(true);
        generateEmergencyStep(tasks).then(res => {
          setSuggestion(res);
          setLoading(false);
          setStep('action');
        });
      }, 4000); // 4 seconds of forced breathing
      return () => clearTimeout(timer);
    }
  }, [step, tasks]);

  return (
    <div className="fixed inset-0 bg-red-50 dark:bg-red-950/90 z-[60] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300 backdrop-blur-sm">
      
      {step === 'breathe' && (
        <div className="max-w-md w-full">
          <div className="mb-8">
            <Wind className="w-24 h-24 text-blue-400 mx-auto animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold text-slate-700 dark:text-slate-200 mb-4">Breathe In...</h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg">Let go of the list. You are safe.</p>
          <div className="mt-12 w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
             <div className="h-full bg-blue-400 w-full animate-[shrink_4s_linear]" style={{animationName: 'shrinkWidth', width: '100%'}}></div>
          </div>
          <style>{`
            @keyframes shrinkWidth {
              from { width: 0%; }
              to { width: 100%; }
            }
          `}</style>
        </div>
      )}

      {step === 'action' && (
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border-2 border-blue-100 dark:border-blue-900">
          <h2 className="text-xl font-semibold text-slate-400 uppercase tracking-widest mb-6">Next Tiny Step</h2>
          
          {loading ? (
             <div className="animate-pulse h-8 bg-slate-100 dark:bg-slate-800 rounded w-3/4 mx-auto"></div>
          ) : (
            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-8 leading-tight">
              "{suggestion}"
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button 
              onClick={onCompleteTinyStep}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Check /> I did it
            </button>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm py-2"
            >
              Exit Emergency Mode
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
