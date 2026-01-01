-- Create scheduled_blocks table
CREATE TABLE public.scheduled_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED)
ALTER TABLE public.scheduled_blocks ENABLE ROW LEVEL SECURITY;

-- Policies for user-specific data access
CREATE POLICY "Users can only see their own scheduled blocks" ON public.scheduled_blocks 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own scheduled blocks" ON public.scheduled_blocks 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own scheduled blocks" ON public.scheduled_blocks 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own scheduled blocks" ON public.scheduled_blocks 
FOR DELETE TO authenticated USING (auth.uid() = user_id);