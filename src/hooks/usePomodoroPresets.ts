import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PomodoroPreset {
  id: string;
  name: string;
  focusMinutes: number;
  breakMinutes: number;
  isDefault: boolean;
  createdAt: Date;
}

const DEFAULT_PRESETS: Omit<PomodoroPreset, 'id' | 'createdAt'>[] = [
  { name: 'Clássico', focusMinutes: 25, breakMinutes: 5, isDefault: true },
  { name: 'Profundo', focusMinutes: 50, breakMinutes: 10, isDefault: false },
  { name: 'Sprint', focusMinutes: 15, breakMinutes: 3, isDefault: false },
];

export function usePomodoroPresets() {
  const [presets, setPresets] = useState<PomodoroPreset[]>([]);
  const [currentPreset, setCurrentPreset] = useState<PomodoroPreset | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPresets = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Use default presets for non-authenticated users
        const defaultPresets = DEFAULT_PRESETS.map((p, i) => ({
          ...p,
          id: `default-${i}`,
          createdAt: new Date(),
        }));
        setPresets(defaultPresets);
        setCurrentPreset(defaultPresets.find(p => p.isDefault) || defaultPresets[0]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('mf_pomodoro_presets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const mappedPresets: PomodoroPreset[] = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          focusMinutes: p.focus_minutes,
          breakMinutes: p.break_minutes,
          isDefault: p.is_default,
          createdAt: new Date(p.created_at),
        }));
        setPresets(mappedPresets);
        setCurrentPreset(mappedPresets.find(p => p.isDefault) || mappedPresets[0]);
      } else {
        // Seed default presets for new user
        await seedDefaultPresets(user.id);
      }
    } catch (error) {
      console.error('Error loading presets:', error);
      // Fallback to default presets
      const defaultPresets = DEFAULT_PRESETS.map((p, i) => ({
        ...p,
        id: `default-${i}`,
        createdAt: new Date(),
      }));
      setPresets(defaultPresets);
      setCurrentPreset(defaultPresets.find(p => p.isDefault) || defaultPresets[0]);
    } finally {
      setLoading(false);
    }
  }, []);

  const seedDefaultPresets = async (userId: string) => {
    try {
      const presetsToInsert = DEFAULT_PRESETS.map(p => ({
        user_id: userId,
        name: p.name,
        focus_minutes: p.focusMinutes,
        break_minutes: p.breakMinutes,
        is_default: p.isDefault,
      }));

      const { data, error } = await supabase
        .from('mf_pomodoro_presets')
        .insert(presetsToInsert)
        .select();

      if (error) throw error;

      if (data) {
        const mappedPresets: PomodoroPreset[] = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          focusMinutes: p.focus_minutes,
          breakMinutes: p.break_minutes,
          isDefault: p.is_default,
          createdAt: new Date(p.created_at),
        }));
        setPresets(mappedPresets);
        setCurrentPreset(mappedPresets.find(p => p.isDefault) || mappedPresets[0]);
      }
    } catch (error) {
      console.error('Error seeding default presets:', error);
    }
  };

  const addPreset = async (name: string, focusMinutes: number, breakMinutes: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('mf_pomodoro_presets')
        .insert({
          user_id: user.id,
          name,
          focus_minutes: focusMinutes,
          break_minutes: breakMinutes,
          is_default: false,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newPreset: PomodoroPreset = {
          id: data.id,
          name: data.name,
          focusMinutes: data.focus_minutes,
          breakMinutes: data.break_minutes,
          isDefault: data.is_default,
          createdAt: new Date(data.created_at),
        };
        setPresets(prev => [...prev, newPreset]);
        return newPreset;
      }
      return null;
    } catch (error) {
      console.error('Error adding preset:', error);
      return null;
    }
  };

  const updatePreset = async (presetId: string, updates: Partial<Pick<PomodoroPreset, 'name' | 'focusMinutes' | 'breakMinutes'>>) => {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.focusMinutes !== undefined) updateData.focus_minutes = updates.focusMinutes;
      if (updates.breakMinutes !== undefined) updateData.break_minutes = updates.breakMinutes;

      const { error } = await supabase
        .from('mf_pomodoro_presets')
        .update(updateData)
        .eq('id', presetId);

      if (error) throw error;

      setPresets(prev => prev.map(p => 
        p.id === presetId ? { ...p, ...updates } : p
      ));
      return true;
    } catch (error) {
      console.error('Error updating preset:', error);
      return false;
    }
  };

  const deletePreset = async (presetId: string) => {
    try {
      const { error } = await supabase
        .from('mf_pomodoro_presets')
        .delete()
        .eq('id', presetId);

      if (error) throw error;

      setPresets(prev => prev.filter(p => p.id !== presetId));
      if (currentPreset?.id === presetId) {
        setCurrentPreset(presets.find(p => p.id !== presetId) || null);
      }
      return true;
    } catch (error) {
      console.error('Error deleting preset:', error);
      return false;
    }
  };

  const setDefaultPreset = async (presetId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // First, unset all defaults
      await supabase
        .from('mf_pomodoro_presets')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Then set the new default
      const { error } = await supabase
        .from('mf_pomodoro_presets')
        .update({ is_default: true })
        .eq('id', presetId);

      if (error) throw error;

      setPresets(prev => prev.map(p => ({
        ...p,
        isDefault: p.id === presetId,
      })));
      return true;
    } catch (error) {
      console.error('Error setting default preset:', error);
      return false;
    }
  };

  const selectPreset = (preset: PomodoroPreset) => {
    setCurrentPreset(preset);
  };

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  return {
    presets,
    currentPreset,
    loading,
    addPreset,
    updatePreset,
    deletePreset,
    setDefaultPreset,
    selectPreset,
    reload: loadPresets,
  };
}
