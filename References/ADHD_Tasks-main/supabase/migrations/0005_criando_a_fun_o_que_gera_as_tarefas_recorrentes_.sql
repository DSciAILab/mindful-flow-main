CREATE OR REPLACE FUNCTION public.create_recurring_tasks()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  rule RECORD;
BEGIN
  FOR rule IN
    SELECT * FROM public.recurring_tasks
    WHERE
      -- Garante que não foi criada hoje
      (last_created_at IS NULL OR last_created_at < CURRENT_DATE)
      AND
      (
        -- Regras diárias
        recurrence_type = 'daily'
        OR
        -- Regras semanais (compara o dia da semana)
        (recurrence_type = 'weekly' AND lower(to_char(CURRENT_DATE, 'FMDay')) = lower(recurrence_value))
        OR
        -- Regras mensais (compara o dia do mês)
        (recurrence_type = 'monthly' AND EXTRACT(DAY FROM CURRENT_DATE)::text = recurrence_value)
      )
  LOOP
    -- Insere a nova tarefa na tabela de tarefas
    INSERT INTO public.tasks (user_id, title, project, hashtags, priority, description, status)
    VALUES (rule.user_id, rule.title, rule.project, rule.hashtags, rule.priority, rule.description, 'todo');

    -- Atualiza a data da última criação na regra
    UPDATE public.recurring_tasks
    SET last_created_at = CURRENT_DATE
    WHERE id = rule.id;
  END LOOP;
END;
$$;