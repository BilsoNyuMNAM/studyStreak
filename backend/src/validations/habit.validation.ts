import { z } from "zod";

export const HabitCreateSchema = z.object({
  name: z.string().trim().min(1, "Habit name is required").max(60, "Habit name too long"),
  color: z.string().trim().regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Invalid color hex format").default("#10b981"),
  icon: z.string().optional().nullable(),
});

export const HabitToggleSchema = z.object({
  habitId: z.string().min(1, "Habit ID is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
  completed: z.boolean(),
});

export type HabitCreateInput = z.infer<typeof HabitCreateSchema>;
export type HabitToggleInput = z.infer<typeof HabitToggleSchema>;
