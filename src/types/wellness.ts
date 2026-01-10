// Wellness Reminders Types

export type ReminderType = 'water' | 'stretch' | 'eyes' | 'posture' | 'breathe' | 'walk';

export interface WellnessConfig {
  id: string;
  userId: string;
  waterEnabled: boolean;
  waterIntervalMinutes: number;
  stretchEnabled: boolean;
  stretchIntervalMinutes: number;
  eyesEnabled: boolean;
  eyesIntervalMinutes: number;
  postureEnabled: boolean;
  postureIntervalMinutes: number;
  quietHoursStart: string; // HH:MM format
  quietHoursEnd: string;   // HH:MM format
  showDuringFocus: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WellnessReminder {
  type: ReminderType;
  title: string;
  message: string;
  icon: string;
  color: string;
  duration?: number; // Suggested duration in seconds (for stretching, etc.)
}

export interface WellnessLog {
  id: string;
  userId: string;
  reminderType: ReminderType;
  action: 'completed' | 'snoozed' | 'dismissed';
  loggedAt: Date;
}

// Predefined reminder messages with friendly, ADHD-supportive language
export const REMINDER_MESSAGES: Record<ReminderType, WellnessReminder> = {
  water: {
    type: 'water',
    title: 'Hidratação',
    message: 'Hora de beber água! Seu corpo agradece 💧',
    icon: 'Droplets',
    color: '#3B82F6',
  },
  stretch: {
    type: 'stretch',
    title: 'Alongamento',
    message: 'Que tal uma paradinha para alongar? 🧘',
    icon: 'Stretch',
    color: '#10B981',
    duration: 120,
  },
  eyes: {
    type: 'eyes',
    title: 'Descanso Visual',
    message: 'Regra 20-20-20: Olhe para longe por 20 segundos 👀',
    icon: 'Eye',
    color: '#8B5CF6',
    duration: 20,
  },
  posture: {
    type: 'posture',
    title: 'Postura',
    message: 'Como está sua postura? Ombros para trás! 🪑',
    icon: 'PersonStanding',
    color: '#F59E0B',
  },
  breathe: {
    type: 'breathe',
    title: 'Respiração',
    message: 'Respire fundo 3 vezes. Inspire... expire... 🌬️',
    icon: 'Wind',
    color: '#06B6D4',
    duration: 30,
  },
  walk: {
    type: 'walk',
    title: 'Movimento',
    message: 'Levante e dê uma voltinha! Seu corpo precisa se mover 🚶',
    icon: 'Footprints',
    color: '#EC4899',
  },
};

// Default configuration for new users
export const DEFAULT_WELLNESS_CONFIG: Omit<WellnessConfig, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  waterEnabled: true,
  waterIntervalMinutes: 60,
  stretchEnabled: true,
  stretchIntervalMinutes: 90,
  eyesEnabled: true,
  eyesIntervalMinutes: 30,
  postureEnabled: true,
  postureIntervalMinutes: 45,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  showDuringFocus: false,
};

// Stretch exercises for the guided stretch flow
export interface StretchExercise {
  id: string;
  name: string;
  description: string;
  durationSeconds: number;
  icon: string;
}

export const STRETCH_EXERCISES: StretchExercise[] = [
  {
    id: 'neck',
    name: 'Pescoço',
    description: 'Incline a cabeça suavemente para cada lado, mantendo por alguns segundos.',
    durationSeconds: 30,
    icon: '🧘',
  },
  {
    id: 'shoulders',
    name: 'Ombros',
    description: 'Role os ombros para frente e para trás em movimentos circulares.',
    durationSeconds: 30,
    icon: '💪',
  },
  {
    id: 'wrists',
    name: 'Pulsos',
    description: 'Gire os pulsos e estique os dedos. Massageie as mãos.',
    durationSeconds: 30,
    icon: '🤲',
  },
  {
    id: 'back',
    name: 'Costas',
    description: 'Levante os braços acima da cabeça e alongue-se para cima.',
    durationSeconds: 30,
    icon: '🙆',
  },
  {
    id: 'legs',
    name: 'Pernas',
    description: 'Levante-se e faça alguns agachamentos leves ou caminhe no lugar.',
    durationSeconds: 30,
    icon: '🦵',
  },
];
