ALTER TABLE public.profiles
ADD COLUMN pomodoro_duration integer DEFAULT 25,
ADD COLUMN short_break_duration integer DEFAULT 5,
ADD COLUMN long_break_duration integer DEFAULT 15;