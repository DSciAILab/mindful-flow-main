-- Enum para os tipos de recorrência
CREATE TYPE recurrence_type AS ENUM ('daily', 'weekly', 'monthly');

-- Tabela para armazenar as regras de tarefas recorrentes
CREATE TABLE public.recurring_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  project TEXT,
  hashtags TEXT[],
  priority TEXT,
  description TEXT,
  recurrence_type recurrence_type NOT NULL,
  -- Para 'weekly': 'monday', 'tuesday', etc. Para 'monthly': dia do mês '1'-'31'
  recurrence_value TEXT,
  last_created_at DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.recurring_tasks ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para que os usuários só possam gerenciar suas próprias regras
CREATE POLICY "Users can manage their own recurring tasks" ON public.recurring_tasks
  FOR ALL TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);