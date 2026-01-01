-- Passo 1: Torna a coluna 'event_id' opcional para permitir a criação de novas tarefas neste projeto.
ALTER TABLE public.tasks ALTER COLUMN event_id DROP NOT NULL;

-- Passo 2: Desativa temporariamente a Segurança de Nível de Linha (RLS) para acessar e atualizar tarefas antigas e não atribuídas.
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;

-- Passo 3: Atribui o ID do seu usuário atual a todas as tarefas que estão atualmente "órfãs" (user_id é NULO).
-- Isso fará com que todas as suas tarefas antigas fiquem visíveis para você novamente.
UPDATE public.tasks
SET user_id = auth.uid()
WHERE user_id IS NULL;

-- Passo 4: Reativa a Segurança de Nível de Linha para garantir que seus dados permaneçam seguros.
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;