-- Habilita a extensão pg_cron, se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agenda a função para rodar todo dia às 5:00 AM UTC.
-- Se o trabalho já existir, ele será atualizado, evitando duplicatas.
SELECT cron.schedule('daily-recurring-tasks-job', '0 5 * * *', 'SELECT public.create_recurring_tasks()');