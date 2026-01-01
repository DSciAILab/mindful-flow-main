
import React, { useState } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { WheelScore, LifeArea } from '../types';
import { Edit2, Check, SlidersHorizontal } from 'lucide-react';

interface WheelOfLifeProps {
  scores: WheelScore[];
  onUpdate?: (area: LifeArea, score: number) => void;
}

export const WheelOfLife: React.FC<WheelOfLifeProps> = ({ scores, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center">
      
      <div className="w-full flex justify-between items-center mb-2">
         <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Wheel of Life</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Quarterly Balance Check</p>
         </div>
         {onUpdate && (
            <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${isEditing ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
                {isEditing ? <Check size={18} /> : <Edit2 size={18} />}
                {isEditing ? 'Done' : 'Adjust'}
            </button>
         )}
      </div>
      
      <div className="w-full h-[300px] md:h-[400px] transition-all duration-300">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={scores}>
            <PolarGrid stroke="#94a3b8" strokeOpacity={0.3} />
            <PolarAngleAxis dataKey="area" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
            <Radar
              name="Satisfaction"
              dataKey="score"
              stroke="#6366f1"
              strokeWidth={3}
              fill="#818cf8"
              fillOpacity={0.4}
              isAnimationActive={!isEditing} // Disable animation when dragging sliders for snappiness
            />
            {!isEditing && <Tooltip 
              contentStyle={{ 
                borderRadius: '8px', 
                border: 'none', 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                backgroundColor: '#1e293b',
                color: '#f1f5f9'
              }}
              itemStyle={{ color: '#cbd5e1' }}
            />}
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 w-full">
        {isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-bottom-2 fade-in">
                {scores.map(s => (
                    <div key={s.area} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{s.area}</span>
                            <span className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">{s.score}/10</span>
                        </div>
                        <input 
                            type="range" 
                            min="1" 
                            max="10" 
                            step="1"
                            value={s.score}
                            onChange={(e) => onUpdate && onUpdate(s.area, Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>
                ))}
            </div>
        ) : (
            <>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Lowest Areas (Candidates for Goals)</h3>
                <div className="grid grid-cols-2 gap-3">
                {scores.filter(s => s.score < 5).map(s => (
                    <div key={s.area} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm border border-red-100 dark:border-red-900/30">
                    <span>{s.area}</span>
                    <span className="font-bold">{s.score}/10</span>
                    </div>
                ))}
                {scores.filter(s => s.score < 5).length === 0 && (
                    <div className="col-span-2 text-center p-3 text-sm text-slate-400 italic">
                        All areas are balanced above 5. Great job!
                    </div>
                )}
                </div>
            </>
        )}
      </div>
    </div>
  );
};
