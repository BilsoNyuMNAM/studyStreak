import { prisma } from "../lib/prisma.js";
import { HabitCreateInput, HabitToggleInput } from "../validations/habit.validation.js";

const DEFAULT_HABITS = [
  { name: "Deep Work Session", color: "#10b981", icon: "zap" },
  { name: "Read 20+ Pages", color: "#38bdf8", icon: "book" },
  { name: "Daily Exercise", color: "#f59e0b", icon: "activity" },
  { name: "Outside Walk", color: "#a855f7", icon: "sun" },
  { name: "Zero Distractions", color: "#ec4899", icon: "shield" },
  { name: "Sleep 8+ Hours", color: "#6366f1", icon: "moon" },
];

export class HabitService {
  static async getAll(month?: string) {
    let habits = await prisma.habit.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        completions: month
          ? {
              where: {
                date: {
                  startsWith: month,
                },
              },
            }
          : true,
      },
    });

    if (habits.length === 0) {
      // Auto-seed default habits
      for (const h of DEFAULT_HABITS) {
        await prisma.habit.create({ data: h });
      }
      habits = await prisma.habit.findMany({
        orderBy: { createdAt: "asc" },
        include: {
          completions: true,
        },
      });
    }

    return habits;
  }

  static async getById(id: string) {
    return prisma.habit.findUnique({
      where: { id },
      include: { completions: true },
    });
  }

  static async create(data: HabitCreateInput) {
    return prisma.habit.create({
      data: {
        name: data.name,
        color: data.color,
        icon: data.icon,
      },
      include: { completions: true },
    });
  }

  static async delete(id: string) {
    return prisma.habit.delete({
      where: { id },
    });
  }

  static async toggle(data: HabitToggleInput) {
    return prisma.habitCompletion.upsert({
      where: {
        habitId_date: {
          habitId: data.habitId,
          date: data.date,
        },
      },
      update: {
        completed: data.completed,
      },
      create: {
        habitId: data.habitId,
        date: data.date,
        completed: data.completed,
      },
    });
  }
}
