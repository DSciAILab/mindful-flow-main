export type Priority = "urgent" | "high" | "medium" | "low";

export type TaskStatus =
  | "inbox"
  | "next"
  | "in-progress"
  | "scheduled"
  | "someday"
  | "done";

// Task Category removed
// export type TaskCategory = "red" | "yellow" | "purple" | "green";

export interface ActivityLogEntry {
  timestamp: string;
  action: string;
  details?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  // category?: TaskCategory;
  dueDate?: Date;
  projectId?: string;
  areaId?: string;
  tags: string[];
  points: number;
  createdAt: Date;
  completedAt?: Date;
  // Time tracking
  timeSpentMinutes: number;
  estimatedMinutes?: number;
  // Activity log
  activityLog?: ActivityLogEntry[];
  // Big 3 - As 3 tarefas mais importantes do dia
  isBig3?: boolean;
  big3Date?: Date;
  // Custom sort order from comparison prioritization
  sortOrder?: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  areaId?: string;
  goalId?: string;
  color: string;
  progress: number;
  tasks: string[];
  createdAt: Date;
}

export interface Area {
  id: string;
  name: string;
  icon: string;
  color: string;
  projects: string[];
}

export interface CaptureItem {
  id: string;
  type: "text" | "audio" | "photo" | "video" | "canvas";
  content: string;
  processedText?: string;
  audioUrl?: string; // URL for audio recording
  createdAt: Date;
  processed: boolean;
}

export interface DailyReflection {
  id: string;
  date: Date;
  mood: 1 | 2 | 3 | 4 | 5;
  gratitude: string[];
  wins: string[];
  challenges: string[];
  tomorrowFocus: string[];
}

export interface TimerSession {
  id: string;
  type: "focus" | "break";
  duration: number;
  taskId?: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface UserStats {
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  tasksCompletedToday: number;
  focusMinutesToday: number;
  level: number;
}

export interface WellnessReminder {
  id: string;
  type: "water" | "stretch" | "breathe" | "walk" | "eyes";
  message: string;
  icon: string;
}

export interface JournalEntry {
  id: string;
  title?: string;
  content: string;
  mood?: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  frequency: "daily" | "weekly";
  daysOfWeek?: number[]; // 0-6 for weekly habits
  color: string;
  projectId?: string;
  createdAt: Date;
  completedDays: Record<string, boolean>; // date string "YYYY-MM-DD" -> completed
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: Date;
  completed: boolean;
}

export interface Sketch {
  id: string;
  user_id: string;
  title: string;
  canvas_data: string; // Base64 encoded canvas image data
  thumbnail?: string;  // Small preview image
  created_at: Date;
  updated_at: Date;
}
