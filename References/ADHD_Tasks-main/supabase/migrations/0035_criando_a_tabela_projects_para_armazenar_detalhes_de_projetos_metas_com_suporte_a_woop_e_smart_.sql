-- Cria a tabela 'projects'
CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  app_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  -- Campos para WOOP
  woop_wish TEXT,
  woop_outcome TEXT,
  woop_obstacle TEXT,
  woop_plan TEXT,
  -- Campos para SMART (alguns já podem ser inferidos ou não são diretamente armazenados aqui)
  smart_specific TEXT,
  smart_measurable TEXT,
  smart_achievable TEXT,
  smart_relevant TEXT,
  smart_time_bound DATE, -- Prazo final para a meta
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilita RLS (Row Level Security) na tabela 'projects'
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para a tabela 'projects'
CREATE POLICY "Users can view their own projects" ON public.projects
FOR SELECT TO authenticated USING (auth.uid() = user_id AND app_id = '3051c619-0e6d-4dcb-8874-8a4ef30bbbf6');

CREATE POLICY "Users can create their own projects" ON public.projects
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND app_id = '3051c619-0e6d-4dcb-8874-8a4ef30bbbf6');

CREATE POLICY "Users can update their own projects" ON public.projects
FOR UPDATE TO authenticated USING (auth.uid() = user_id AND app_id = '3051c619-0e6d-4dcb-8874-8a4ef30bbbf6');

CREATE POLICY "Users can delete their own projects" ON public.projects
FOR DELETE TO authenticated USING (auth.uid() = user_id AND app_id = '3051c619-0e6d-4dcb-8874-8a4ef30bbbf6');

-- Adiciona um trigger para atualizar a coluna 'updated_at' automaticamente
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();