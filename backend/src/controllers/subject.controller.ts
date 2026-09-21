import { Request, Response } from "express";
import { SubjectService } from "../services/subject.service.js";
import { SubjectCreateSchema } from "../validations/index.js";

export class SubjectController {
  static async getAll(req: Request, res: Response) {
    try {
      const subjects = await SubjectService.getAll();
      return res.status(200).json({ success: true, data: subjects });
    } catch (error) {
      console.error("[GET_SUBJECTS_ERROR]", error);
      return res.status(500).json({ success: false, error: "Database error" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const validated = SubjectCreateSchema.safeParse(req.body);
      if (!validated.success) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: validated.error.flatten().fieldErrors,
        });
      }

      const subject = await SubjectService.create(validated.data);
      return res.status(201).json({ success: true, data: subject });
    } catch (error) {
      console.error("[CREATE_SUBJECT_ERROR]", error);
      return res.status(500).json({ success: false, error: "Failed to create subject" });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ success: false, error: "Subject ID required" });
      }

      await SubjectService.delete(id);
      return res.status(200).json({ success: true, message: "Subject deleted" });
    } catch (error) {
      console.error("[DELETE_SUBJECT_ERROR]", error);
      return res.status(500).json({ success: false, error: "Failed to delete subject" });
    }
  }
}
