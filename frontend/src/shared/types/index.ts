export interface Subject {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
}

export type TimerMode = "pomodoro" | "stopwatch" | "countdown";

export interface StudySession {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  durationSeconds: number;
  durationMinutes: number;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  mode: TimerMode;
  notes?: string | null;
  completed: boolean;
}

export interface DayStudySummary {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  totalMinutes: number;
  hasStudied: boolean;
  subjectBreakdown: { [subjectId: string]: number };
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalDaysActive: number;
  totalMinutes: number;
  todayMinutes: number;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  createdAt: string;
}

export interface Habit {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  completions?: HabitCompletion[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Record<string, string[]>;
  message?: string;
}
