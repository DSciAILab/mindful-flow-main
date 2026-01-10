// src/types/dailyMission.ts
// Types for the Daily Mission module

import type { Task, Habit } from './index';

export interface DailyMissionConfig {
  id: string;
  userId: string;
  maxTasks: number;
  showOnStartup: boolean;
  includeHabits: boolean;
  morningCheckinEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MorningCheckin {
  id: string;
  userId: string;
  checkinDate: Date;
  energyLevel: 1 | 2 | 3 | 4 | 5;
  moodLevel: 1 | 2 | 3 | 4 | 5;
  sleepQuality: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  createdAt: Date;
}

export interface DailyMission {
  tasks: Task[];
  habits: Habit[];
  checkin?: MorningCheckin;
  suggestedFocusTime: number; // minutes suggested based on energy
  motivationalMessage: string;
}

// Energy level type for easier handling
export type EnergyLevel = 1 | 2 | 3 | 4 | 5;

// Motivational messages grouped by energy level
export const motivationalMessages = {
  lowEnergy: [
    "Tudo bem ir devagar hoje. Pequenos passos contam!",
    "Seja gentil consigo. Faça o que conseguir.",
    "Um dia de cada vez. Você está fazendo o seu melhor.",
    "Lembre-se: descansar também é produtividade.",
  ],
  mediumEnergy: [
    "Bom dia! Vamos com calma e consistência.",
    "Foque em uma coisa de cada vez. Você consegue!",
    "Respire fundo e comece. O difícil é só começar.",
    "Mantenha o ritmo. Você está indo muito bem!",
  ],
  highEnergy: [
    "Energia alta! Aproveite para as tarefas importantes.",
    "Você está pronto para conquistar o dia!",
    "Canaliza essa energia nas tarefas que mais importam.",
    "Ótima disposição! Hora de fazer acontecer.",
  ],
  streakMessages: [
    "Você está há {days} dias completando suas missões! 🔥",
    "Consistência é o segredo. Continue assim! 🌟",
    "{days} dias de foco! Incrível! 🎯",
  ],
};

// Helper to get random message from array
export function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

// Get motivational message based on energy level
export function getMotivationalByEnergy(energyLevel: EnergyLevel): string {
  if (energyLevel <= 2) {
    return getRandomMessage(motivationalMessages.lowEnergy);
  } else if (energyLevel <= 3) {
    return getRandomMessage(motivationalMessages.mediumEnergy);
  } else {
    return getRandomMessage(motivationalMessages.highEnergy);
  }
}

// Get suggested focus time based on energy level (in minutes)
export function getSuggestedFocusTime(energyLevel: EnergyLevel): number {
  const focusTimes: Record<EnergyLevel, number> = {
    1: 15,
    2: 20,
    3: 25,
    4: 35,
    5: 45,
  };
  return focusTimes[energyLevel];
}
