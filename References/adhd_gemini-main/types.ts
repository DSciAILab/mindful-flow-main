
export enum LifeArea {
  Health = 'Health',
  Career = 'Career',
  Finance = 'Finance',
  Relationships = 'Relationships',
  Growth = 'Growth',
  Leisure = 'Leisure',
  Environment = 'Environment',
  Spirituality = 'Spirituality',
}

export interface WheelScore {
  area: LifeArea;
  score: number; // 1-10
}

export interface LifeGoal {
  id: string;
  title: string;
  area: LifeArea;
  horizon: '1y' | '3y' | '5y' | '10y';
  progress: number; // 0-100
}

export interface Project {
  id: string;
  title: string;
  goalId: string;
  area: LifeArea;
  deadline: string;
  progress: number;
}

export interface Habit {
  id: string;
  title: string;
  frequency: string;
  area: LifeArea;
  streak: number;
}

export enum Energy {
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
}

export interface Task {
  id: string;
  title: string;
  projectId?: string;
  habitId?: string;
  isCompleted: boolean;
  isPriority: boolean; // Part of "Top 3"
  dueDate: string;
  area: LifeArea;
  energyLevel: Energy; // New field
}

export interface TimerConfig {
  id: string;
  title: string;
  type: 'interval' | 'countdown';
  focusDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  sessionsPerCycle: number;
  autoStartNextSession: boolean;
  autoStartNextCycle: boolean;
  colorTheme: 'red' | 'green' | 'purple' | 'blue';
}

export enum Mood {
  Great = 'Great',
  Good = 'Good',
  Okay = 'Okay',
  Low = 'Low',
  Awful = 'Awful',
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood: Mood;
  energy: Energy;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface InboxItem {
  id: string;
  content: string;
  createdAt: number;
  isProcessed: boolean;
}

export interface InboxClassification {
  type: 'Task' | 'Project' | 'Habit' | 'Note';
  refinedTitle: string;
  suggestedArea: LifeArea;
  suggestedEnergyLevel: Energy;
  reasoning: string;
}

export interface UserStats {
  totalFocusMinutes: number;
  sessionsCompleted: number;
}
