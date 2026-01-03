-- Create calendar events table
CREATE TABLE IF NOT EXISTS public.mf_calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    type TEXT CHECK (type IN ('focus', 'meeting', 'break', 'personal', 'routine')),
    related_task_id UUID REFERENCES public.mf_tasks(id) ON DELETE SET NULL,
    related_project_id UUID REFERENCES public.mf_projects(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mf_calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own events"
    ON public.mf_calendar_events
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own events"
    ON public.mf_calendar_events
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
    ON public.mf_calendar_events
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
    ON public.mf_calendar_events
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_calendar_events_user_time ON public.mf_calendar_events(user_id, start_time);
CREATE INDEX idx_calendar_events_task ON public.mf_calendar_events(related_task_id);
