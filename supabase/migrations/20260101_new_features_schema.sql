-- =====================================================
-- MINDFUL FLOW - New Features Schema Updates
-- Date: 2026-01-01
-- Features: Quotes, Categories, Presets, Activity Log
-- =====================================================

-- =====================================================
-- 1. ADD CATEGORY FIELD TO TASKS
-- =====================================================
ALTER TABLE public.mf_tasks 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT NULL 
CHECK (category IS NULL OR category IN ('red', 'yellow', 'purple', 'green'));

COMMENT ON COLUMN public.mf_tasks.category IS 'ADHD visual category: red=urgent/human, yellow=chores, purple=feel-good, green=nice-to-have';

-- =====================================================
-- 2. ADD ACTIVITY LOG TO TASKS
-- =====================================================
ALTER TABLE public.mf_tasks 
ADD COLUMN IF NOT EXISTS activity_log JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.mf_tasks.activity_log IS 'Array of activity entries: [{timestamp, action, details}]';

-- =====================================================
-- 3. QUOTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.mf_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  author TEXT DEFAULT 'Desconhecido',
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mf_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quotes" ON public.mf_quotes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own quotes" ON public.mf_quotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quotes" ON public.mf_quotes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own quotes" ON public.mf_quotes FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mf_quotes_user_id ON public.mf_quotes(user_id);

-- =====================================================
-- 4. POMODORO PRESETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.mf_pomodoro_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  focus_minutes INTEGER NOT NULL DEFAULT 25,
  break_minutes INTEGER NOT NULL DEFAULT 5,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mf_pomodoro_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own presets" ON public.mf_pomodoro_presets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own presets" ON public.mf_pomodoro_presets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own presets" ON public.mf_pomodoro_presets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own presets" ON public.mf_pomodoro_presets FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mf_pomodoro_presets_user_id ON public.mf_pomodoro_presets(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_mf_pomodoro_presets_updated_at
  BEFORE UPDATE ON public.mf_pomodoro_presets
  FOR EACH ROW EXECUTE FUNCTION public.mf_update_updated_at_column();

-- =====================================================
-- 5. ADD QUOTE SETTINGS TO PROFILES
-- =====================================================
ALTER TABLE public.mf_profiles 
ADD COLUMN IF NOT EXISTS quotes_enabled BOOLEAN DEFAULT true;

ALTER TABLE public.mf_profiles 
ADD COLUMN IF NOT EXISTS quotes_interval_seconds INTEGER DEFAULT 30;

-- =====================================================
-- 6. INSERT DEFAULT QUOTES FOR NEW USERS (Optional seed)
-- =====================================================
-- These will be inserted per-user when they first access quotes

-- =====================================================
-- 7. AI COACH SETTINGS IN PROFILES
-- =====================================================
ALTER TABLE public.mf_profiles 
ADD COLUMN IF NOT EXISTS ai_coach_enabled BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.mf_profiles.ai_coach_enabled IS 'Enable/disable floating AI coach';
