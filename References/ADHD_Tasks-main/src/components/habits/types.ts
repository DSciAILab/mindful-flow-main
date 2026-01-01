// Definindo uma interface mais robusta para o hábito, separada de ParsedTask
export interface Habit {
  id: string;
  title: string;
  project_id: string | null; // NEW: Referência ao ID do projeto
  project: string | null; // NEW: Mantém o nome do projeto para exibição
  hashtags: string[];
  type: 'boolean' | 'quantifiable';
  goal_value?: number | null;
  goal_unit?: string | null;
  increment_value?: number | null;
  created_at?: string;
}

export interface NewHabit {
  title: string;
  project_id: string | null; // NEW: Referência ao ID do projeto
  hashtags: string[];
  type: 'boolean' | 'quantifiable';
  goal_value?: number | null;
  goal_unit?: string | null;
  increment_value?: number | null;
}