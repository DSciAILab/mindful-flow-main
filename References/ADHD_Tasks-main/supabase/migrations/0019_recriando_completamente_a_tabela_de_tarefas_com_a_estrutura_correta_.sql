-- Removendo a tabela 'tasks' antiga e incorreta para começar do zero.
-- Esta ação é necessária para corrigir o problema fundamental e irá apagar os dados de tarefas existentes.
DROP TABLE IF EXISTS public.tasks CASCADE;

-- Recriando a tabela 'tasks' com a estrutura correta para o aplicativo de produtividade.
CREATE TABLE public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  project TEXT,
  hashtags TEXT[],
  priority TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  due_date DATE,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aplicando o gatilho 'updated_at' que já existe para a nova tabela.
CREATE TRIGGER handle_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitando a Segurança a Nível de Linha (RLS) para proteger os dados.
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Criando políticas de segurança para garantir que os usuários só possam gerenciar suas próprias tarefas.
CREATE POLICY "Users can manage their own tasks"
  ON public.tasks FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);