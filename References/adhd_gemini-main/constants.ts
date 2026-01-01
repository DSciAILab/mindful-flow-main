
import { LifeArea, WheelScore, Task, Project, Habit, Mood, Energy, InboxItem } from "./types";

export const INITIAL_WHEEL_SCORES: WheelScore[] = [
  { area: LifeArea.Health, score: 3 }, // Low score example from prompt
  { area: LifeArea.Career, score: 7 },
  { area: LifeArea.Finance, score: 6 },
  { area: LifeArea.Relationships, score: 8 },
  { area: LifeArea.Growth, score: 5 },
  { area: LifeArea.Leisure, score: 4 },
  { area: LifeArea.Environment, score: 7 },
  { area: LifeArea.Spirituality, score: 6 },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    title: 'Lose 2.5 kg in 3 months',
    goalId: 'g1',
    area: LifeArea.Health,
    deadline: '2023-12-31',
    progress: 35,
  },
  {
    id: 'p2',
    title: 'Launch Personal Website',
    goalId: 'g2',
    area: LifeArea.Career,
    deadline: '2023-11-15',
    progress: 10,
  }
];

export const INITIAL_HABITS: Habit[] = [
  {
    id: 'h1',
    title: 'Exercise 3x/week',
    frequency: 'weekly',
    area: LifeArea.Health,
    streak: 2,
  },
  {
    id: 'h2',
    title: 'Drink 2L Water',
    frequency: 'daily',
    area: LifeArea.Health,
    streak: 5,
  },
  {
    id: 'h3',
    title: 'Read 10 pages',
    frequency: 'daily',
    area: LifeArea.Growth,
    streak: 0,
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Schedule medical check up',
    projectId: 'p1',
    isCompleted: false,
    isPriority: true,
    dueDate: '2023-10-25',
    area: LifeArea.Health,
    energyLevel: Energy.High,
  },
  {
    id: 't2',
    title: 'Define preferred exercise type',
    projectId: 'p1',
    isCompleted: true, // Example of completed task
    isPriority: false,
    dueDate: '2023-10-20',
    area: LifeArea.Health,
    energyLevel: Energy.Medium,
  },
  {
    id: 't3',
    title: 'Exercise today (Habit)',
    habitId: 'h1',
    isCompleted: false,
    isPriority: true,
    dueDate: 'Today',
    area: LifeArea.Health,
    energyLevel: Energy.High,
  },
  {
    id: 't4',
    title: 'Buy domain name',
    projectId: 'p2',
    isCompleted: false,
    isPriority: false,
    dueDate: '2023-10-26',
    area: LifeArea.Career,
    energyLevel: Energy.Low,
  },
  {
    id: 't5',
    title: 'Quick kitchen tidy',
    isCompleted: false,
    isPriority: true,
    dueDate: 'Today',
    area: LifeArea.Environment,
    energyLevel: Energy.Low,
  }
];

export const INITIAL_INBOX: InboxItem[] = [
  { 
    id: 'i1', 
    content: 'Look into better running shoes for the marathon', 
    createdAt: Date.now() - 100000, 
    isProcessed: false 
  },
  { 
    id: 'i2', 
    content: 'Why do I always feel sleepy at 3pm?', 
    createdAt: Date.now(), 
    isProcessed: false 
  },
];

export const MOOD_OPTIONS = [
  { value: Mood.Great, icon: '😄', color: 'bg-green-100 text-green-700' },
  { value: Mood.Good, icon: '🙂', color: 'bg-blue-100 text-blue-700' },
  { value: Mood.Okay, icon: '😐', color: 'bg-gray-100 text-gray-700' },
  { value: Mood.Low, icon: '😔', color: 'bg-orange-100 text-orange-700' },
  { value: Mood.Awful, icon: '😫', color: 'bg-red-100 text-red-700' },
];
