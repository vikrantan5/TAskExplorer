/**
 * Task Master Type Definitions
 */

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface Category {
  id: string;
  userId: string;
  title: string;
  orderIndex: number;
  createdAt: Date;
}

export interface Task {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  isCompleted: boolean;
  isDaily: boolean;
  lastCompletedDate?: Date;
  createdAt: Date;
  notes?: string;
}

export interface Note {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
}

export interface DailyStats {
  totalTasks: number;
  completedTasks: number;
  missedTasks: number;
  completionPercentage: number;
}

export interface CategoryStats {
  categoryId: string;
  categoryTitle: string;
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
}

export interface UserStats {
  daysActive: number;
  totalTasksCompleted: number;
  bestStreak: number;
  currentStreak: number;
}
