-- =====================================================
-- MINDFUL FLOW - Habit Tracker Enhancements
-- Date: 2026-01-09
-- Purpose: Add streaks persistence, icons, specific days
-- =====================================================

-- 1. Add new columns to mf_habits table
ALTER TABLE public.mf_habits 
ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'check';

ALTER TABLE public.mf_habits 
ADD COLUMN IF NOT EXISTS specific_days INTEGER[];

ALTER TABLE public.mf_habits 
ADD COLUMN IF NOT EXISTS reminder_time TIME;

ALTER TABLE public.mf_habits 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Create habit streaks table for persistent streak tracking
CREATE TABLE IF NOT EXISTS public.mf_habit_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES public.mf_habits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completed_at DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(habit_id)
);

-- 3. Enable RLS on habit_streaks
ALTER TABLE public.mf_habit_streaks ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for habit_streaks
CREATE POLICY "Users can view own habit streaks" 
ON public.mf_habit_streaks FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own habit streaks" 
ON public.mf_habit_streaks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habit streaks" 
ON public.mf_habit_streaks FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit streaks" 
ON public.mf_habit_streaks FOR DELETE 
USING (auth.uid() = user_id);

-- 5. Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_mf_habit_streaks_habit 
ON public.mf_habit_streaks(habit_id);

CREATE INDEX IF NOT EXISTS idx_mf_habit_streaks_user 
ON public.mf_habit_streaks(user_id);

-- 6. Add notes column to habit_logs if not exists
ALTER TABLE public.mf_habit_logs 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 7. Function to update streak on habit completion
CREATE OR REPLACE FUNCTION public.mf_update_habit_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  streak_record RECORD;
  new_current_streak INTEGER;
  new_longest_streak INTEGER;
BEGIN
  -- Get or create streak record
  SELECT * INTO streak_record 
  FROM public.mf_habit_streaks 
  WHERE habit_id = NEW.habit_id;
  
  IF NOT FOUND THEN
    -- Create new streak record
    INSERT INTO public.mf_habit_streaks (habit_id, user_id, current_streak, longest_streak, last_completed_at)
    VALUES (NEW.habit_id, NEW.user_id, 1, 1, NEW.log_date);
    RETURN NEW;
  END IF;
  
  -- Calculate new streak
  IF streak_record.last_completed_at = NEW.log_date - INTERVAL '1 day' THEN
    -- Consecutive day
    new_current_streak := streak_record.current_streak + 1;
  ELSIF streak_record.last_completed_at = NEW.log_date THEN
    -- Same day, no change
    RETURN NEW;
  ELSE
    -- Streak broken, start fresh
    new_current_streak := 1;
  END IF;
  
  -- Update longest streak if needed
  new_longest_streak := GREATEST(streak_record.longest_streak, new_current_streak);
  
  -- Update streak record
  UPDATE public.mf_habit_streaks
  SET current_streak = new_current_streak,
      longest_streak = new_longest_streak,
      last_completed_at = NEW.log_date,
      updated_at = NOW()
  WHERE habit_id = NEW.habit_id;
  
  RETURN NEW;
END;
$$;

-- 8. Create trigger for automatic streak updates
DROP TRIGGER IF EXISTS trigger_mf_update_habit_streak ON public.mf_habit_logs;
CREATE TRIGGER trigger_mf_update_habit_streak
AFTER INSERT ON public.mf_habit_logs
FOR EACH ROW
EXECUTE FUNCTION public.mf_update_habit_streak();

-- 9. Add updated_at trigger for mf_habit_streaks
CREATE OR REPLACE FUNCTION public.mf_update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_mf_habit_streaks_updated_at ON public.mf_habit_streaks;
CREATE TRIGGER trigger_mf_habit_streaks_updated_at
BEFORE UPDATE ON public.mf_habit_streaks
FOR EACH ROW
EXECUTE FUNCTION public.mf_update_updated_at();
