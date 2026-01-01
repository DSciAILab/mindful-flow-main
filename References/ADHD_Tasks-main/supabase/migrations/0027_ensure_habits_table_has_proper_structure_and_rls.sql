-- Check if habits table exists, if not create it
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  project TEXT,
  hashtags TEXT[],
  type TEXT NOT NULL CHECK (type IN ('boolean', 'quantifiable')),
  goal_value NUMERIC,
  goal_unit TEXT,
  increment_value NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS if not already enabled
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "habits_select_policy" ON public.habits;
DROP POLICY IF EXISTS "habits_insert_policy" ON public.habits;
DROP POLICY IF EXISTS "habits_update_policy" ON public.habits;
DROP POLICY IF EXISTS "habits_delete_policy" ON public.habits;

-- Create policies
CREATE POLICY "habits_select_policy" ON public.habits 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "habits_insert_policy" ON public.habits 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "habits_update_policy" ON public.habits 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "habits_delete_policy" ON public.habits 
FOR DELETE TO authenticated USING (auth.uid() = user_id);