export interface Subject {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TimerMode = "pomodoro" | "stopwatch" | "countdown";

export interface StudySession {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  durationSeconds: number;
  durationMinutes: number;
  startTime: Date | string;
  endTime: Date | string;
  mode: string;
  notes?: string | null;
  completed: boolean;
  createdAt?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Record<string, string[]>;
  message?: string;
}
