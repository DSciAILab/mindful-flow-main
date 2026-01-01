-- =====================================================
-- MINDFUL FLOW - Complete Database Schema
-- Prefix: mf_ (Mindful Flow)
-- =====================================================

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================
CREATE TABLE public.mf_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  theme TEXT DEFAULT 'system',
  timer_focus_duration INTEGER DEFAULT 25,
  timer_break_duration INTEGER DEFAULT 5,
  llm_provider TEXT DEFAULT 'lovable',
  llm_api_key TEXT,
  llm_model TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mf_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.mf_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.mf_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.mf_profiles FOR INSERT WITH CHECK (auth.uid() = id);

COMMENT ON COLUMN public.mf_profiles.llm_provider IS 'LLM provider: lovable, openrouter, openai, anthropic, google';
COMMENT ON COLUMN public.mf_profiles.llm_api_key IS 'Encrypted API key for external LLM provider';
COMMENT ON COLUMN public.mf_profiles.llm_model IS 'Selected model for the LLM provider';

-- =====================================================
-- 2. PROJECTS TABLE
-- =====================================================
CREATE TABLE public.mf_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mf_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON public.mf_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own projects" ON public.mf_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.mf_projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.mf_projects FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 3. TASKS TABLE
-- =====================================================
CREATE TABLE public.mf_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'next' CHECK (status IN ('inbox', 'next', 'scheduled', 'someday', 'done')),
  due_date TIMESTAMP WITH TIME ZONE,
  tags TEXT[] DEFAULT '{}',
  points INTEGER DEFAULT 10,
  time_spent_minutes INTEGER DEFAULT 0,
  estimated_minutes INTEGER,
  parent_task_id UUID REFERENCES public.mf_tasks(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.mf_projects(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.mf_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks" ON public.mf_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tasks" ON public.mf_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.mf_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.mf_tasks FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 4. FOCUS SESSIONS TABLE
-- =====================================================
CREATE TABLE public.mf_focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.mf_tasks(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('focus', 'break')),
  duration_minutes INTEGER NOT NULL,
  break_time_minutes INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.mf_focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON public.mf_focus_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own sessions" ON public.mf_focus_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.mf_focus_sessions FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 5. WHEEL OF LIFE ENTRIES TABLE
-- =====================================================
CREATE TABLE public.mf_wheel_of_life_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
  previous_score INTEGER,
  reason TEXT NOT NULL,
  ai_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mf_wheel_of_life_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entries" ON public.mf_wheel_of_life_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own entries" ON public.mf_wheel_of_life_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 6. THOUGHT RECORDS TABLE (RPD)
-- =====================================================
CREATE TABLE public.mf_thought_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  situation TEXT NOT NULL,
  automatic_thought TEXT NOT NULL,
  emotion TEXT NOT NULL,
  emotion_intensity INTEGER NOT NULL CHECK (emotion_intensity >= 1 AND emotion_intensity <= 10),
  evidence_for TEXT NOT NULL,
  evidence_against TEXT NOT NULL,
  balanced_thought TEXT NOT NULL,
  new_emotion_intensity INTEGER NOT NULL CHECK (new_emotion_intensity >= 1 AND new_emotion_intensity <= 10),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mf_thought_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own records" ON public.mf_thought_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own records" ON public.mf_thought_records FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 7. DAILY REFLECTIONS TABLE
-- =====================================================
CREATE TABLE public.mf_daily_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
  gratitude TEXT NOT NULL,
  reflection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, reflection_date)
);

ALTER TABLE public.mf_daily_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reflections" ON public.mf_daily_reflections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own reflections" ON public.mf_daily_reflections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reflections" ON public.mf_daily_reflections FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 8. TASK ATTACHMENTS TABLE
-- =====================================================
CREATE TABLE public.mf_task_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.mf_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mf_task_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attachments" ON public.mf_task_attachments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own attachments" ON public.mf_task_attachments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own attachments" ON public.mf_task_attachments FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 9. JOURNAL ENTRIES TABLE
-- =====================================================
CREATE TABLE public.mf_journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  mood INTEGER CHECK (mood >= 1 AND mood <= 5),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.mf_journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own journal entries" ON public.mf_journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own journal entries" ON public.mf_journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own journal entries" ON public.mf_journal_entries FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own journal entries" ON public.mf_journal_entries FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 10. HABITS TABLE
-- =====================================================
CREATE TABLE public.mf_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL DEFAULT 'daily',
  days_of_week INTEGER[] DEFAULT '{0,1,2,3,4,5,6}',
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mf_habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own habits" ON public.mf_habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own habits" ON public.mf_habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habits" ON public.mf_habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habits" ON public.mf_habits FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 11. HABIT LOGS TABLE
-- =====================================================
CREATE TABLE public.mf_habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.mf_habits(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(habit_id, log_date)
);

ALTER TABLE public.mf_habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own habit logs" ON public.mf_habit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own habit logs" ON public.mf_habit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own habit logs" ON public.mf_habit_logs FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- STORAGE BUCKET
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('mf-task-attachments', 'mf-task-attachments', true, 10485760);

-- Storage policies for mf-task-attachments bucket
CREATE POLICY "Users can upload own files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'mf-task-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own files" ON storage.objects
FOR SELECT USING (bucket_id = 'mf-task-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE USING (bucket_id = 'mf-task-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public can view mf task attachments" ON storage.objects
FOR SELECT USING (bucket_id = 'mf-task-attachments');

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.mf_handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.mf_profiles (id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name');
  RETURN new;
END;
$$;

-- Trigger for auto-creating profile on signup
CREATE TRIGGER mf_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.mf_handle_new_user();

-- Function to auto-update updated_at column
CREATE OR REPLACE FUNCTION public.mf_update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Updated_at triggers
CREATE TRIGGER update_mf_profiles_updated_at
  BEFORE UPDATE ON public.mf_profiles
  FOR EACH ROW EXECUTE FUNCTION public.mf_update_updated_at_column();

CREATE TRIGGER update_mf_projects_updated_at
  BEFORE UPDATE ON public.mf_projects
  FOR EACH ROW EXECUTE FUNCTION public.mf_update_updated_at_column();

CREATE TRIGGER update_mf_habits_updated_at
  BEFORE UPDATE ON public.mf_habits
  FOR EACH ROW EXECUTE FUNCTION public.mf_update_updated_at_column();

CREATE TRIGGER update_mf_journal_entries_updated_at
  BEFORE UPDATE ON public.mf_journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.mf_update_updated_at_column();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_mf_tasks_user_id ON public.mf_tasks(user_id);
CREATE INDEX idx_mf_tasks_status ON public.mf_tasks(status);
CREATE INDEX idx_mf_tasks_project_id ON public.mf_tasks(project_id);
CREATE INDEX idx_mf_focus_sessions_user_id ON public.mf_focus_sessions(user_id);
CREATE INDEX idx_mf_wheel_of_life_user_id ON public.mf_wheel_of_life_entries(user_id);
CREATE INDEX idx_mf_thought_records_user_id ON public.mf_thought_records(user_id);
CREATE INDEX idx_mf_daily_reflections_user_id ON public.mf_daily_reflections(user_id);
CREATE INDEX idx_mf_journal_entries_user_id ON public.mf_journal_entries(user_id);
CREATE INDEX idx_mf_journal_entries_created_at ON public.mf_journal_entries(created_at DESC);
CREATE INDEX idx_mf_habits_user_id ON public.mf_habits(user_id);
CREATE INDEX idx_mf_habit_logs_user_id ON public.mf_habit_logs(user_id);
CREATE INDEX idx_mf_habit_logs_habit_id ON public.mf_habit_logs(habit_id);
CREATE INDEX idx_mf_projects_user_id ON public.mf_projects(user_id);
