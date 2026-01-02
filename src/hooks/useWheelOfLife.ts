import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface LifeAreaScore {
  id: string;
  name: string;
  score: number;
  color: string;
}

export function useWheelOfLife() {
  const [areas, setAreas] = useState<LifeAreaScore[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadScores();
  }, [user]);

  const loadScores = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('mf_profiles')
        .select('wheel_of_life_scores')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading wheel of life scores:', error);
      } else if (data?.wheel_of_life_scores) {
        setAreas(data.wheel_of_life_scores);
      }
    } catch (error) {
      console.error('Error loading wheel of life scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveScores = async (newAreas: LifeAreaScore[]) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('mf_profiles')
        .update({ wheel_of_life_scores: newAreas })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving wheel of life scores:', error);
        return false;
      }

      setAreas(newAreas);
      return true;
    } catch (error) {
      console.error('Error saving wheel of life scores:', error);
      return false;
    }
  };

  return {
    areas,
    loading,
    saveScores,
    reload: loadScores,
  };
}
