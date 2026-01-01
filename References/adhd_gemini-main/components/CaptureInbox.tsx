
import React, { useState } from 'react';
import { InboxItem, InboxClassification, LifeArea, Project, Energy } from '../types';
import { analyzeInboxItem } from '../services/geminiService';
import { Sparkles, Trash2, ArrowRight, CheckCircle2, Loader2, StickyNote, Box, Zap } from 'lucide-react';

interface CaptureInboxProps {
  items: InboxItem[];
  projects: Project[];
  onAdd: (text: string) => void;
  onRemove: (id: string) => void;
  onConvertToTask: (title: string, area: LifeArea, energy: Energy) => void;
}

export const CaptureInbox: React.FC<CaptureInboxProps> = ({ items, projects, onAdd, onRemove, onConvertToTask }) => {
  const [inputText, setInputText] = useState('');
  
  // Local state for processing items
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{ [id: string]: InboxClassification }>({});

  const handleCapture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onAdd(inputText);
    setInputText('');
  };

  const handleAnalyze = async (item: InboxItem) => {
    setProcessingId(item.id);
    try {
      const result = await analyzeInboxItem(item.content, projects);
      setAnalysisResult(prev => ({ ...prev, [item.id]: result }));
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConvert = (item: InboxItem, result: InboxClassification) => {
    if (result.type === 'Task' || result.type === 'Habit' || result.type === 'Project') {
        onConvertToTask(result.refinedTitle, result.suggestedArea, result.suggestedEnergyLevel);
        onRemove(item.id);
    } else {
        // Notes just stay or get archived (deleted for now)
        onRemove(item.id);
    }
  };

  const energyColors: Record<Energy, string> = {
    [Energy.Low]: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    [Energy.Medium]: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    [Energy.High]: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Box className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
          Capture Inbox
        </h1>
        <p className="text-slate-500 dark:text-slate-400">Dump your thoughts. Sorting comes later.</p>
      </div>

      {/* Capture Input */}
      <form onSubmit={handleCapture} className="relative">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="What's on your mind? (e.g. 'Need to call dentist', 'Idea for new blog post')"
          className="w-full p-6 pr-24 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900/50 bg-white dark:bg-slate-900 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-0 shadow-sm resize-none text-lg text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-all h-32"
          onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCapture(e);
              }
          }}
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="absolute bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2"
        >
          Capture <ArrowRight size={16} />
        </button>
      </form>

      {/* Inbox List */}
      <div className="space-y-4">
        {items.length === 0 && (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <p>Inbox zero! Your mind is clear.</p>
          </div>
        )}

        {items.map((item) => {
          const result = analysisResult[item.id];
          const isProcessing = processingId === item.id;

          return (
            <div key={item.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
              {!result ? (
                // Unprocessed View
                <div className="flex justify-between items-start gap-4">
                  <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed">{item.content}</p>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleAnalyze(item)}
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 font-medium text-sm transition-colors"
                    >
                      {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      {isProcessing ? 'Sorting...' : 'Sort'}
                    </button>
                    <button
                      onClick={() => onRemove(item.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                // Processed View
                <div className="animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide 
                      ${result.type === 'Task' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 
                        result.type === 'Project' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 
                        result.type === 'Habit' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'}`
                    }>
                      {result.type}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">
                      {result.suggestedArea}
                    </span>
                    <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded font-medium ${energyColors[result.suggestedEnergyLevel]}`}>
                      <Zap size={10} fill="currentColor" /> {result.suggestedEnergyLevel} Energy
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{result.refinedTitle}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 italic">"{result.reasoning}"</p>

                  <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleConvert(item, result)}
                      className="flex-1 bg-slate-900 dark:bg-slate-700 text-white py-2 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={18} />
                      {result.type === 'Note' ? 'Save to Journal' : `Create ${result.type}`}
                    </button>
                    <button
                      onClick={() => setAnalysisResult(prev => {
                          const next = { ...prev };
                          delete next[item.id];
                          return next;
                      })}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
