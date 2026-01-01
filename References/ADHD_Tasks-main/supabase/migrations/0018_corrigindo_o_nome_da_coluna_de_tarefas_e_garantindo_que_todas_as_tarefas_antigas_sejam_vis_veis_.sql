-- Renomeia a coluna 'name' para 'title' para corresponder ao que o código da aplicação espera.
-- Este é o conserto principal para o problema de tarefas invisíveis.
ALTER TABLE public.tasks RENAME COLUMN name TO title;

-- Como medida final de segurança, atribui todas as tarefas não concluídas ao usuário atual
-- e define seu status como 'todo' para garantir que apareçam na caixa de entrada.
UPDATE public.tasks
SET 
  user_id = auth.uid(),
  status = 'todo'
WHERE 
  status != 'completed';