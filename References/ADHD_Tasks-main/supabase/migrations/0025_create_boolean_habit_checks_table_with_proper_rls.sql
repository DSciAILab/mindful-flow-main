-- Drop existing table if it exists
DROP TABLE IF EXISTS public.boolean_habit_checks CASCADE;

-- Create the table
CREATE TABLE public.boolean_habit_checks (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  check_date DATE NOT NULL,
  is_checked BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, habit_id, check_date)
);

-- Enable RLS
ALTER TABLE public.boolean_habit_checks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "boolean_habit_checks_select_policy" ON public.boolean_habit_checks 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "boolean_habit_checks_insert_policy" ON public.boolean_habit_checks 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "boolean_habit_checks_update_policy" ON public.boolean_habit_checks 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "boolean_habit_checks_delete_policy" ON public.boolean_habit_checks 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_boolean_habit_checks_user_habit_date ON public.boolean_habit_checks(user_id, habit_id, check_date);