-- Create break_logs table
CREATE TABLE public.break_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  duration_seconds INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  app_id UUID NOT NULL REFERENCES public.apps(id) DEFAULT '3051c619-0e6d-4dcb-8874-8a4ef30bbbf6'
);

-- Enable RLS (REQUIRED for security)
ALTER TABLE public.break_logs ENABLE ROW LEVEL SECURITY;

-- Create secure policies for each operation
CREATE POLICY "break_logs_select_policy" ON public.break_logs 
FOR SELECT TO authenticated USING (auth.uid() = user_id AND app_id = '3051c619-0e6d-4dcb-8874-8a4ef30bbbf6');

CREATE POLICY "break_logs_insert_policy" ON public.break_logs 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND app_id = '3051c619-0e6d-4dcb-8874-8a4ef30bbbf6');

CREATE POLICY "break_logs_update_policy" ON public.break_logs 
FOR UPDATE TO authenticated USING (auth.uid() = user_id AND app_id = '3051c619-0e6d-4dcb-8874-8a4ef30bbbf6');

CREATE POLICY "break_logs_delete_policy" ON public.break_logs 
FOR DELETE TO authenticated USING (auth.uid() = user_id AND app_id = '3051c619-0e6d-4dcb-8874-8a4ef30bbbf6');