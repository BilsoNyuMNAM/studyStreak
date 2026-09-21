import { z } from "zod";

export const SubjectCreateSchema = z.object({
  name: z.string().trim().min(1, "Subject name is required").max(60, "Subject name too long"),
  color: z.string().trim().regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Invalid color hex format").default("#e4e4e7"),
  icon: z.string().optional().nullable(),
});

export const SessionCreateSchema = z.object({
  subjectId: z.string().min(1, "Subject ID is required"),
  subjectName: z.string().trim().min(1, "Subject name is required").max(60),
  subjectColor: z.string().trim().min(1),
  durationMinutes: z.number().min(0, "Duration minutes cannot be negative").max(1440).transform((v) => Math.round(v)),
  durationSeconds: z.number().min(1, "Duration seconds must be at least 1 second").max(86400).transform((v) => Math.round(v)),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  mode: z.enum(["pomodoro", "stopwatch", "countdown"]).default("pomodoro"),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional().nullable(),
  completed: z.boolean().default(true),
});

export type SubjectCreateInput = z.infer<typeof SubjectCreateSchema>;
export type SessionCreateInput = z.infer<typeof SessionCreateSchema>;
