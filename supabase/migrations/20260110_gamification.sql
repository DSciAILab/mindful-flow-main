-- =====================================================
-- Module 6: Gamification Expandida
-- Tabelas: achievements, user_achievements, levels
-- =====================================================

-- Tabela de conquistas disponíveis
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50) NOT NULL,
  color VARCHAR(20) NOT NULL,
  category VARCHAR(30) NOT NULL, -- tasks, focus, habits, streaks, special
  requirement_type VARCHAR(30) NOT NULL, -- count, streak, total, special
  requirement_value INTEGER NOT NULL,
  points_reward INTEGER DEFAULT 0,
  is_secret BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de conquistas do usuário
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Tabela de níveis
CREATE TABLE IF NOT EXISTS levels (
  level INTEGER PRIMARY KEY,
  title VARCHAR(50) NOT NULL,
  min_points INTEGER NOT NULL,
  icon VARCHAR(50) NOT NULL,
  color VARCHAR(20) NOT NULL
);

-- =====================================================
-- Popular níveis
-- =====================================================
INSERT INTO levels (level, title, min_points, icon, color) VALUES
(1, 'Iniciante', 0, 'Sprout', '#A3E635'),
(2, 'Aprendiz', 100, 'Leaf', '#22C55E'),
(3, 'Praticante', 300, 'TreeDeciduous', '#16A34A'),
(4, 'Dedicado', 600, 'Trees', '#15803D'),
(5, 'Consistente', 1000, 'Mountain', '#3B82F6'),
(6, 'Focado', 1500, 'Flame', '#F59E0B'),
(7, 'Mestre do Foco', 2500, 'Zap', '#EAB308'),
(8, 'Guerreiro TDAH', 4000, 'Sword', '#A855F7'),
(9, 'Lenda', 6000, 'Crown', '#EC4899'),
(10, 'Iluminado', 10000, 'Sun', '#FFD700')
ON CONFLICT (level) DO NOTHING;

-- =====================================================
-- Popular conquistas
-- =====================================================
INSERT INTO achievements (code, title, description, icon, color, category, requirement_type, requirement_value, points_reward, is_secret) VALUES
-- Conquistas de tarefas
('first_task', 'Primeiro Passo', 'Complete sua primeira tarefa', 'Footprints', '#10B981', 'tasks', 'count', 1, 10, false),
('tasks_10', 'Produtivo', 'Complete 10 tarefas', 'CheckCircle', '#3B82F6', 'tasks', 'count', 10, 25, false),
('tasks_50', 'Máquina de Fazer', 'Complete 50 tarefas', 'Rocket', '#8B5CF6', 'tasks', 'count', 50, 50, false),
('tasks_100', 'Centenário', 'Complete 100 tarefas', 'Trophy', '#F59E0B', 'tasks', 'count', 100, 100, false),

-- Conquistas de foco
('focus_1h', 'Uma Hora de Foco', 'Acumule 1 hora de tempo focado', 'Timer', '#06B6D4', 'focus', 'total', 60, 20, false),
('focus_10h', 'Foco Sustentado', 'Acumule 10 horas de tempo focado', 'Target', '#6366F1', 'focus', 'total', 600, 75, false),

-- Conquistas de streaks
('streak_3', 'Consistência Inicial', 'Mantenha um streak de 3 dias', 'Flame', '#EF4444', 'streaks', 'streak', 3, 30, false),
('streak_7', 'Semana Perfeita', 'Mantenha um streak de 7 dias', 'Calendar', '#F97316', 'streaks', 'streak', 7, 50, false),
('streak_30', 'Mês de Ouro', 'Mantenha um streak de 30 dias', 'Star', '#FFD700', 'streaks', 'streak', 30, 200, false),

-- Conquistas de hábitos
('habit_master', 'Mestre dos Hábitos', 'Complete todos os hábitos por 7 dias seguidos', 'Award', '#A855F7', 'habits', 'streak', 7, 100, false),

-- Conquistas especiais
('early_bird', 'Madrugador', 'Complete uma tarefa antes das 8h', 'Sunrise', '#FBBF24', 'special', 'special', 1, 15, false),
('night_owl', 'Coruja Noturna', 'Complete uma tarefa após as 22h', 'Moon', '#6366F1', 'special', 'special', 1, 15, false),
('panic_survivor', 'Sobrevivente', 'Use o Modo Pânico e volte ao foco', 'Heart', '#EC4899', 'special', 'special', 1, 25, true)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Política para usuários visualizarem suas próprias conquistas
CREATE POLICY "Users can view own achievements" 
  ON user_achievements 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para usuários inserirem suas próprias conquistas
CREATE POLICY "Users can insert own achievements" 
  ON user_achievements 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para usuários deletarem suas próprias conquistas
CREATE POLICY "Users can delete own achievements" 
  ON user_achievements 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Política para todos visualizarem achievements (são públicos)
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view achievements" 
  ON achievements 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Política para todos visualizarem levels (são públicos)
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view levels" 
  ON levels 
  FOR SELECT 
  TO authenticated
  USING (true);

-- =====================================================
-- Indexes para performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_code ON achievements(code);
