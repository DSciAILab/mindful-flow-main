import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserProfile {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  theme: string;
  timerFocusDuration: number;
  timerBreakDuration: number;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('mf_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          // Profile might not exist yet if just signed up
          if (error.code === 'PGRST116') {
            setProfile(null);
          } else {
            console.error('Error fetching profile:', error);
          }
        } else if (data) {
          setProfile({
            id: data.id,
            displayName: data.display_name,
            avatarUrl: data.avatar_url,
            theme: data.theme || 'system',
            timerFocusDuration: data.timer_focus_duration || 25,
            timerBreakDuration: data.timer_break_duration || 5,
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Get first name or display name for greeting
  const getGreetingName = (): string | null => {
    if (!profile?.displayName) return null;
    // Get first word of display name
    return profile.displayName.split(' ')[0];
  };

  return {
    profile,
    loading,
    displayName: profile?.displayName || null,
    greetingName: getGreetingName(),
  };
};
