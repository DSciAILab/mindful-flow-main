-- Create the task_interruptions table
CREATE TABLE public.task_interruptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  interrupted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_seconds INTEGER NOT NULL -- Tempo decorrido desde o último start até a interrupção
);

-- Enable Row Level Security (REQUIRED)
ALTER TABLE public.task_interruptions ENABLE ROW LEVEL SECURITY;

-- Create policies to ensure users can only manage their own interruptions
CREATE POLICY "Users can view their own task interruptions" ON public.task_interruptions
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task interruptions" ON public.task_interruptions
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task interruptions" ON public.task_interruptions
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task interruptions" ON public.task_interruptions
FOR DELETE TO authenticated USING (auth.uid() = user_id);