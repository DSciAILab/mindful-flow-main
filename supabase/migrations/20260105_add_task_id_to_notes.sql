-- Add task_id to mf_notes for linking notes to tasks
ALTER TABLE public.mf_notes 
ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES public.mf_tasks(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_mf_notes_task_id ON public.mf_notes(task_id);

-- Add comment
COMMENT ON COLUMN public.mf_notes.task_id IS 'Optional reference to a task this note is associated with';
