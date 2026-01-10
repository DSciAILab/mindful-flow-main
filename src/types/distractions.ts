// src/types/distractions.ts

export interface Distraction {
  id: string;
  userId: string;
  content: string;
  capturedDuringTaskId?: string;
  focusSessionId?: string;
  processed: boolean;
  processedAt?: Date;
  convertedToTaskId?: string;
  createdAt: Date;
}

export type DistractionAction = 'task' | 'inbox' | 'delete' | 'processed';

export interface DistractionFilter {
  processed?: boolean;
  focusSessionId?: string;
}
