-- Forcefully assign all existing tasks to the current logged-in user.
-- This is a corrective measure to fix any ownership issues from the data migration.
UPDATE public.tasks
SET user_id = auth.uid()
WHERE user_id IS NULL OR user_id != auth.uid();

-- Update the status of all non-completed tasks to 'todo'.
-- This ensures that any tasks with old or incorrect statuses will now appear in the inbox.
UPDATE public.tasks
SET status = 'todo'
WHERE user_id = auth.uid() AND status NOT IN ('todo', 'completed', 'done_today');