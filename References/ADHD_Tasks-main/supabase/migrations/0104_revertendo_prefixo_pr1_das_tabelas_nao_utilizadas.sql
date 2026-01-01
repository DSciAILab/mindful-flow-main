-- Reverte as tabelas utilizadas no projeto que foram renomeadas para o prefixo pr1_
ALTER TABLE IF EXISTS public.pr1_tasks RENAME TO tasks;
ALTER TABLE IF EXISTS public.pr1_notes RENAME TO notes;
ALTER TABLE IF EXISTS public.pr1_habits RENAME TO habits;
ALTER TABLE IF EXISTS public.pr1_boolean_habit_checks RENAME TO boolean_habit_checks;
ALTER TABLE IF EXISTS public.pr1_quantifiable_habit_entries RENAME TO quantifiable_habit_entries;
ALTER TABLE IF EXISTS public.pr1_weekly_reviews RENAME TO weekly_reviews;
ALTER TABLE IF EXISTS public.pr1_mood_logs RENAME TO mood_logs;
ALTER TABLE IF EXISTS public.pr1_projects RENAME TO projects;
ALTER TABLE IF EXISTS public.pr1_scheduled_blocks RENAME TO scheduled_blocks;
ALTER TABLE IF EXISTS public.pr1_recurring_tasks RENAME TO recurring_tasks;
ALTER TABLE IF EXISTS public.pr1_profiles RENAME TO profiles;
ALTER TABLE IF EXISTS public.pr1_quotes RENAME TO quotes;
ALTER TABLE IF EXISTS public.pr1_time_logs RENAME TO time_logs;
ALTER TABLE IF EXISTS public.pr1_task_interruptions RENAME TO task_interruptions;
ALTER TABLE IF EXISTS public.pr1_break_logs RENAME TO break_logs;

-- Reverte as sequências associadas
ALTER SEQUENCE IF EXISTS public.pr1_boolean_habit_checks_id_seq RENAME TO boolean_habit_checks_id_seq;
ALTER SEQUENCE IF EXISTS public.pr1_quantifiable_habit_entries_id_seq RENAME TO quantifiable_habit_entries_id_seq;