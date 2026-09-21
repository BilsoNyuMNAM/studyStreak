import { Request, Response } from "express";
import { HabitService } from "../services/habit.service.js";
import { HabitCreateSchema, HabitToggleSchema } from "../validations/habit.validation.js";

export class HabitController {
  static async getAll(req: Request, res: Response) {
    try {
      const month = req.query.month as string | undefined;
      const habits = await HabitService.getAll(month);
      return res.status(200).json({ success: true, data: habits });
    } catch (error) {
      console.error("[GET_HABITS_ERROR]", error);
      return res.status(500).json({ success: false, error: "Database error" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const validated = HabitCreateSchema.safeParse(req.body);
      if (!validated.success) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: validated.error.flatten().fieldErrors,
        });
      }

      const habit = await HabitService.create(validated.data);
      return res.status(201).json({ success: true, data: habit });
    } catch (error) {
      console.error("[CREATE_HABIT_ERROR]", error);
      return res.status(500).json({ success: false, error: "Failed to create habit" });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ success: false, error: "Habit ID required" });
      }

      await HabitService.delete(id);
      return res.status(200).json({ success: true, message: "Habit deleted" });
    } catch (error) {
      console.error("[DELETE_HABIT_ERROR]", error);
      return res.status(500).json({ success: false, error: "Failed to delete habit" });
    }
  }

  static async toggle(req: Request, res: Response) {
    try {
      const validated = HabitToggleSchema.safeParse(req.body);
      if (!validated.success) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: validated.error.flatten().fieldErrors,
        });
      }

      const completion = await HabitService.toggle(validated.data);
      return res.status(200).json({ success: true, data: completion });
    } catch (error) {
      console.error("[TOGGLE_HABIT_ERROR]", error);
      return res.status(500).json({ success: false, error: "Failed to update habit status" });
    }
  }
}
