-- =====================================================
-- MINDFUL FLOW - Habit Soft Delete Migration
-- Date: 2026-01-01
-- Purpose: Preserve habit logs when habits are deleted
-- =====================================================

-- 1. Add deleted_at column to mf_habits for soft delete
ALTER TABLE public.mf_habits 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

COMMENT ON COLUMN public.mf_habits.deleted_at IS 'Soft delete timestamp - habit is hidden but logs are preserved';

-- 2. Create index for filtering active habits
CREATE INDEX IF NOT EXISTS idx_mf_habits_active ON public.mf_habits(user_id) WHERE deleted_at IS NULL;

-- 3. Modify mf_habit_logs to allow orphan logs (for historical data)
-- First, drop the existing foreign key constraint
ALTER TABLE public.mf_habit_logs 
DROP CONSTRAINT IF EXISTS mf_habit_logs_habit_id_fkey;

-- Re-add without CASCADE - set to SET NULL instead
ALTER TABLE public.mf_habit_logs 
ADD CONSTRAINT mf_habit_logs_habit_id_fkey 
FOREIGN KEY (habit_id) 
REFERENCES public.mf_habits(id) 
ON DELETE SET NULL;

-- Allow habit_id to be nullable for orphan logs
ALTER TABLE public.mf_habit_logs 
ALTER COLUMN habit_id DROP NOT NULL;

-- 4. Add habit_title to logs for historical reference (when habit is deleted)
ALTER TABLE public.mf_habit_logs 
ADD COLUMN IF NOT EXISTS habit_title TEXT;

COMMENT ON COLUMN public.mf_habit_logs.habit_title IS 'Cached habit title for historical reference after soft delete';

-- 5. Function to soft delete habit and cache titles in logs
CREATE OR REPLACE FUNCTION public.mf_soft_delete_habit(habit_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  habit_title_cache TEXT;
BEGIN
  -- Get the habit title
  SELECT title INTO habit_title_cache 
  FROM public.mf_habits 
  WHERE id = habit_uuid AND auth.uid() = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Habit not found or access denied';
  END IF;
  
  -- Cache the title in all logs for this habit
  UPDATE public.mf_habit_logs 
  SET habit_title = habit_title_cache 
  WHERE habit_id = habit_uuid;
  
  -- Soft delete the habit
  UPDATE public.mf_habits 
  SET deleted_at = now() 
  WHERE id = habit_uuid AND auth.uid() = user_id;
END;
$$;
