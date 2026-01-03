-- =====================================================
-- Add Timer Sound Settings to Profiles
-- =====================================================

-- Add column for storing timer sound preferences
ALTER TABLE public.mf_profiles 
ADD COLUMN IF NOT EXISTS timer_sound_settings JSONB DEFAULT '{"focusEndSound": "chime", "breakEndSound": "ding", "volume": 0.7, "enabled": true}';

-- Add comment
COMMENT ON COLUMN public.mf_profiles.timer_sound_settings IS 'Timer sound preferences: focusEndSound, breakEndSound, volume, enabled';
