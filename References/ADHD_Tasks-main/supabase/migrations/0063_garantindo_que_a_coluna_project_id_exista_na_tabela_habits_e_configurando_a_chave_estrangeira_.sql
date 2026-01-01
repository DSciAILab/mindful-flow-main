DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'habits' AND column_name = 'project_id' AND table_schema = 'public') THEN
        ALTER TABLE public.habits ADD COLUMN project_id UUID;
        ALTER TABLE public.habits ADD CONSTRAINT fk_project_habits
        FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;
    END IF;
END
$$;