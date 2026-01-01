-- Atualiza o status das tarefas do usuário de 'Not Requested' para 'todo'.
-- Isso deve fazer com que as tarefas antigas apareçam na sua Caixa de Entrada.
UPDATE public.tasks
SET status = 'todo'
WHERE user_id = auth.uid() AND status = 'Not Requested';