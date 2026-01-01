-- Drop existing table if it exists
DROP TABLE IF EXISTS public.quantifiable_habit_entries CASCADE;

-- Create the table
CREATE TABLE public.quantifiable_habit_entries (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  value NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.quantifiable_habit_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "quantifiable_habit_entries_select_policy" ON public.quantifiable_habit_entries 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "quantifiable_habit_entries_insert_policy" ON public.quantifiable_habit_entries 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quantifiable_habit_entries_update_policy" ON public.quantifiable_habit_entries 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "quantifiable_habit_entries_delete_policy" ON public.quantifiable_habit_entries 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_quantifiable_habit_entries_user_habit_date ON public.quantifiable_habit_entries(user_id, habit_id, entry_date);