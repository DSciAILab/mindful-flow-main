import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useTasks } from './useTasks';
import { useHabits } from './useHabits';

// Types for AI Context
interface AIInsight {
  id: string;
  source: 'chatbot' | 'wheel_of_life' | 'habits' | 'tasks';
  content: string;
  type: 'observation' | 'suggestion' | 'pattern' | 'reflection';
  createdAt: string;
  relatedArea?: string;
}

interface WheelOfLifeScore {
  id: string;
  name: string;
  score: number;
  color: string;
  lastUpdated?: string;
}

interface AIPatterns {
  peakEnergyTime?: string;
  lowEnergyTime?: string;
  commonBlockers?: string[];
  successPatterns?: string[];
  focusPreferences?: Record<string, any>;
}

interface AISharedContext {
  insights: AIInsight[];
  patterns: AIPatterns;
  lastUpdated?: string;
}

interface AIContextData {
  // From tasks
  pendingTasks: { title: string; priority: string; status: string; dueDate?: string }[];
  urgentTasksTitles: string[];
  tasksStats: {
    total: number;
    pending: number;
    completed: number;
    urgent: number;
  };
  // From wheel of life
  wheelOfLifeScores: WheelOfLifeScore[];
  lowestAreas: { name: string; score: number }[];
  highestAreas: { name: string; score: number }[];
  // From habits
  habitsStats: {
    total: number;
    completedToday: number;
  };
  // AI generated insights
  recentInsights: AIInsight[];
  patterns: AIPatterns;
}

export function useAIContext() {
  const [sharedContext, setSharedContext] = useState<AISharedContext>({
    insights: [],
    patterns: {},
  });
  const [wheelOfLifeScores, setWheelOfLifeScores] = useState<WheelOfLifeScore[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const { tasks } = useTasks();
  const { habits } = useHabits();

  // Load shared context from database
  const loadContext = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('mf_profiles')
        .select('ai_shared_context, wheel_of_life_scores')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        if (data.ai_shared_context) {
          setSharedContext(data.ai_shared_context as AISharedContext);
        }
        if (data.wheel_of_life_scores) {
          setWheelOfLifeScores(data.wheel_of_life_scores as WheelOfLifeScore[]);
        }
      }
    } catch (err) {
      console.error('Error loading AI context:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  // Add a new insight to the shared context
  const addInsight = useCallback(async (insight: Omit<AIInsight, 'id' | 'createdAt'>) => {
    if (!user) return;

    const newInsight: AIInsight = {
      ...insight,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updatedContext: AISharedContext = {
      ...sharedContext,
      insights: [newInsight, ...sharedContext.insights].slice(0, 20), // Keep last 20 insights
      lastUpdated: new Date().toISOString(),
    };

    try {
      await supabase
        .from('mf_profiles')
        .update({ ai_shared_context: updatedContext })
        .eq('id', user.id);

      setSharedContext(updatedContext);
    } catch (err) {
      console.error('Error saving insight:', err);
    }
  }, [user, sharedContext]);

  // Update patterns
  const updatePatterns = useCallback(async (patterns: Partial<AIPatterns>) => {
    if (!user) return;

    const updatedContext: AISharedContext = {
      ...sharedContext,
      patterns: { ...sharedContext.patterns, ...patterns },
      lastUpdated: new Date().toISOString(),
    };

    try {
      await supabase
        .from('mf_profiles')
        .update({ ai_shared_context: updatedContext })
        .eq('id', user.id);

      setSharedContext(updatedContext);
    } catch (err) {
      console.error('Error updating patterns:', err);
    }
  }, [user, sharedContext]);

  // Get unified context for AI prompts
  const getContextForAI = useCallback((): AIContextData => {
    // Process tasks
    const pendingTasks = tasks.filter(t => t.status !== 'done');
    const completedTasks = tasks.filter(t => t.status === 'done');
    const urgentTasks = pendingTasks.filter(t => t.priority === 'urgent' || t.priority === 'high');

    const tasksForAI = pendingTasks.slice(0, 10).map(t => ({
      title: t.title,
      priority: t.priority,
      status: t.status,
      dueDate: t.dueDate ? t.dueDate.toLocaleDateString('pt-BR') : undefined,
    }));

    // Process wheel of life scores
    const sortedScores = [...wheelOfLifeScores].sort((a, b) => a.score - b.score);
    const lowestAreas = sortedScores.slice(0, 3).map(a => ({ name: a.name, score: a.score }));
    const highestAreas = sortedScores.slice(-3).reverse().map(a => ({ name: a.name, score: a.score }));

    // Process habits - count how many habits are completed today
    const today = new Date().toISOString().split('T')[0];
    const completedToday = habits.filter(h => h.completedDays[today]).length;

    return {
      pendingTasks: tasksForAI,
      urgentTasksTitles: urgentTasks.slice(0, 5).map(t => t.title),
      tasksStats: {
        total: tasks.length,
        pending: pendingTasks.length,
        completed: completedTasks.length,
        urgent: urgentTasks.length,
      },
      wheelOfLifeScores,
      lowestAreas,
      highestAreas,
      habitsStats: {
        total: habits.length,
        completedToday,
      },
      recentInsights: sharedContext.insights.slice(0, 5),
      patterns: sharedContext.patterns,
    };
  }, [tasks, wheelOfLifeScores, habits, sharedContext]);

  // Build context string for system prompts
  const buildContextString = useCallback((): string => {
    const ctx = getContextForAI();
    
    let contextStr = `\n\n=== CONTEXTO COMPLETO DO USUÁRIO ===\n`;
    
    // Tasks section
    contextStr += `\n📋 TAREFAS:\n`;
    contextStr += `- Total: ${ctx.tasksStats.total} | Pendentes: ${ctx.tasksStats.pending} | Urgentes: ${ctx.tasksStats.urgent}\n`;
    
    if (ctx.pendingTasks.length > 0) {
      contextStr += `\nTarefas pendentes:\n`;
      ctx.pendingTasks.forEach((t, i) => {
        contextStr += `${i + 1}. "${t.title}" (${t.priority})${t.dueDate ? ` - vence ${t.dueDate}` : ''}\n`;
      });
    }

    // Wheel of Life section
    if (ctx.wheelOfLifeScores.length > 0) {
      contextStr += `\n🎯 RODA DA VIDA:\n`;
      ctx.wheelOfLifeScores.forEach(area => {
        contextStr += `- ${area.name}: ${area.score}/10\n`;
      });
      
      if (ctx.lowestAreas.length > 0) {
        contextStr += `\nÁreas que precisam atenção: ${ctx.lowestAreas.map(a => `${a.name} (${a.score})`).join(', ')}\n`;
      }
    }

    // Habits section
    if (ctx.habitsStats.total > 0) {
      contextStr += `\n✅ HÁBITOS:\n`;
      contextStr += `- Total: ${ctx.habitsStats.total} | Concluídos hoje: ${ctx.habitsStats.completedToday}\n`;
    }

    // Recent insights
    if (ctx.recentInsights.length > 0) {
      contextStr += `\n💡 INSIGHTS RECENTES:\n`;
      ctx.recentInsights.forEach(insight => {
        contextStr += `- [${insight.source}] ${insight.content.slice(0, 100)}${insight.content.length > 100 ? '...' : ''}\n`;
      });
    }

    // Patterns
    if (ctx.patterns.peakEnergyTime || ctx.patterns.commonBlockers?.length) {
      contextStr += `\n🔄 PADRÕES IDENTIFICADOS:\n`;
      if (ctx.patterns.peakEnergyTime) {
        contextStr += `- Pico de energia: ${ctx.patterns.peakEnergyTime}\n`;
      }
      if (ctx.patterns.lowEnergyTime) {
        contextStr += `- Baixa energia: ${ctx.patterns.lowEnergyTime}\n`;
      }
      if (ctx.patterns.commonBlockers?.length) {
        contextStr += `- Bloqueios comuns: ${ctx.patterns.commonBlockers.join(', ')}\n`;
      }
    }

    contextStr += `\n=== FIM DO CONTEXTO ===\n`;
    
    return contextStr;
  }, [getContextForAI]);

  return {
    loading,
    sharedContext,
    wheelOfLifeScores,
    getContextForAI,
    buildContextString,
    addInsight,
    updatePatterns,
    reload: loadContext,
  };
}
