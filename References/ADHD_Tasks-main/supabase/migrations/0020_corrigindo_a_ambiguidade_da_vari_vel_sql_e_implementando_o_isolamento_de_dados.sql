DO $$
DECLARE
  focus_pro_app_id UUID;
  tbl_name TEXT; -- Renamed variable to avoid ambiguity
  policy_name TEXT;
BEGIN
  -- Passo 1: Criar a tabela 'apps' e registrar o 'FocusPro'
  CREATE TABLE IF NOT EXISTS public.apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Habilitar RLS na tabela de apps
  ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;

  -- Políticas para a tabela 'apps': todos os usuários autenticados podem ler.
  DROP POLICY IF EXISTS "Allow authenticated read access" ON public.apps;
  CREATE POLICY "Allow authenticated read access" ON public.apps
    FOR SELECT TO authenticated USING (true);

  -- Inserir 'FocusPro' se não existir e obter seu ID
  INSERT INTO public.apps (name)
  VALUES ('FocusPro')
  ON CONFLICT (name) DO NOTHING;

  SELECT id INTO focus_pro_app_id FROM public.apps WHERE name = 'FocusPro';

  -- Passo 2 e 3: Iterar sobre todas as tabelas de dados para adicionar app_id e RLS
  FOREACH tbl_name IN ARRAY ARRAY[
    'tasks', 'notes', 'habits', 'boolean_habit_checks', 'quantifiable_habit_entries',
    'quotes', 'weekly_reviews', 'mood_logs', 'time_logs', 'task_interruptions',
    'scheduled_blocks', 'recurring_tasks', 'app_config', 'fights', 'sub_events',
    'actions', 'announcements', 'task_dependencies', 'divisions', 'check_in_log',
    'personnel', 'task_templates', 'events', 'event_personnel_link', 'task_personnel_link',
    'raw_event_logs', 'clubs', 'event_logs', 'athletes'
  ]
  LOOP
    -- Adicionar a coluna app_id se não existir
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS app_id UUID REFERENCES public.apps(id)', tbl_name);

    -- Atualizar todos os registros existentes para o app_id do FocusPro
    EXECUTE format('UPDATE public.%I SET app_id = %L WHERE app_id IS NULL', tbl_name, focus_pro_app_id);

    -- Tornar a coluna não nula agora que todos os registros estão preenchidos
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN app_id SET NOT NULL', tbl_name);
    
    -- Habilitar RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl_name);

    -- Remover políticas antigas para evitar conflitos.
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage their own quotes" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage their own sub_events" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage their own habits" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage their own habit checks" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage their own habit entries" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage their own notes" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage their own task interruptions" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage their own time logs" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage their own weekly reviews" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage their own mood logs" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage their own recurring tasks" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage their own scheduled blocks" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage their own events" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage their own tasks" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage their own settings" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage their own raw logs" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage their own task templates" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage their own actions" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can view their own fights" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can insert their own fights" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can update their own fights" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can delete their own fights" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Public can read personnel" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can insert their own personnel" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can update their own personnel" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can delete their own personnel" ON public.%I', tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS "Users can view their own personnel or unowned ones" ON public.%I', tbl_name);
    
    -- Criar a nova política de isolamento unificada
    policy_name := 'Isolar dados por app e usuário';
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, tbl_name);

    -- Lógica para tabelas com user_id
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl_name AND column_name = 'user_id'
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL USING (auth.uid() = user_id AND app_id = %L) WITH CHECK (auth.uid() = user_id AND app_id = %L)',
        policy_name, tbl_name, focus_pro_app_id, focus_pro_app_id
      );
    ELSE
      -- Lógica para tabelas sem user_id (isolamento apenas por app)
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL USING (app_id = %L) WITH CHECK (app_id = %L)',
        policy_name, tbl_name, focus_pro_app_id, focus_pro_app_id
      );
    END IF;

  END LOOP;
END;
$$;