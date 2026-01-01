-- Renomeia a tabela 'daily_habit_checks' para 'boolean_habit_checks' para maior clareza
ALTER TABLE public.daily_habit_checks RENAME TO boolean_habit_checks;

-- Adiciona as novas colunas à tabela 'habits' para suportar hábitos quantificáveis
ALTER TABLE public.habits
ADD COLUMN type TEXT NOT NULL DEFAULT 'boolean',
ADD COLUMN goal_value NUMERIC,
ADD COLUMN goal_unit TEXT,
ADD COLUMN increment_value NUMERIC;

-- Cria a nova tabela 'quantifiable_habit_entries' para registrar os valores dos hábitos quantificáveis
CREATE TABLE public.quantifiable_habit_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    value NUMERIC NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilita a Segurança a Nível de Linha (RLS) na nova tabela
ALTER TABLE public.quantifiable_habit_entries ENABLE ROW LEVEL SECURITY;

-- Cria políticas de RLS para garantir que os usuários só possam acessar e gerenciar suas próprias entradas
CREATE POLICY "Users can manage their own quantifiable habit entries"
ON public.quantifiable_habit_entries
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);