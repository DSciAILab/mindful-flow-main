-- Renomeia todas as tabelas do projeto para usar o prefixo pr1_
ALTER TABLE IF EXISTS public.mood_logs RENAME TO pr1_mood_logs;
ALTER TABLE IF EXISTS public.app_config RENAME TO pr1_app_config;
ALTER TABLE IF EXISTS public.fights RENAME TO pr1_fights;
ALTER TABLE IF EXISTS public.notes RENAME TO pr1_notes;
ALTER TABLE IF EXISTS public.sub_events RENAME TO pr1_sub_events;
ALTER TABLE IF EXISTS public.projects RENAME TO pr1_projects;
ALTER TABLE IF EXISTS public.weekly_reviews RENAME TO pr1_weekly_reviews;
ALTER TABLE IF EXISTS public.apps RENAME TO pr1_apps;
ALTER TABLE IF EXISTS public.scheduled_blocks RENAME TO pr1_scheduled_blocks;
ALTER TABLE IF EXISTS public.boolean_habit_checks RENAME TO pr1_boolean_habit_checks;
ALTER TABLE IF EXISTS public.actions RENAME TO pr1_actions;
ALTER TABLE IF EXISTS public.quotes RENAME TO pr1_quotes;
ALTER TABLE IF EXISTS public.break_logs RENAME TO pr1_break_logs;
ALTER TABLE IF EXISTS public.quantifiable_habit_entries RENAME TO pr1_quantifiable_habit_entries;
ALTER TABLE IF EXISTS public.profiles RENAME TO pr1_profiles;
ALTER TABLE IF EXISTS public.announcements RENAME TO pr1_announcements;
ALTER TABLE IF EXISTS public.task_dependencies RENAME TO pr1_task_dependencies;
ALTER TABLE IF EXISTS public.tasks RENAME TO pr1_tasks;
ALTER TABLE IF EXISTS public.time_logs RENAME TO pr1_time_logs;
ALTER TABLE IF EXISTS public.divisions RENAME TO pr1_divisions;
ALTER TABLE IF EXISTS public.recurring_tasks RENAME TO pr1_recurring_tasks;
ALTER TABLE IF EXISTS public.check_in_log RENAME TO pr1_check_in_log;
ALTER TABLE IF EXISTS public.habits RENAME TO pr1_habits;
ALTER TABLE IF EXISTS public.personnel RENAME TO pr1_personnel;
ALTER TABLE IF EXISTS public.task_templates RENAME TO pr1_task_templates;
ALTER TABLE IF EXISTS public.events RENAME TO pr1_events;
ALTER TABLE IF EXISTS public.event_personnel_link RENAME TO pr1_event_personnel_link;
ALTER TABLE IF EXISTS public.task_personnel_link RENAME TO pr1_task_personnel_link;
ALTER TABLE IF EXISTS public.task_interruptions RENAME TO pr1_task_interruptions;
ALTER TABLE IF EXISTS public.raw_event_logs RENAME TO pr1_raw_event_logs;
ALTER TABLE IF EXISTS public.event_logs RENAME TO pr1_event_logs;
ALTER TABLE IF EXISTS public.clubs RENAME TO pr1_clubs;
ALTER TABLE IF EXISTS public.athletes RENAME TO pr1_athletes;

-- Renomeia sequências associadas
ALTER SEQUENCE IF EXISTS public.boolean_habit_checks_id_seq RENAME TO pr1_boolean_habit_checks_id_seq;
ALTER SEQUENCE IF EXISTS public.quantifiable_habit_entries_id_seq RENAME TO pr1_quantifiable_habit_entries_id_seq;