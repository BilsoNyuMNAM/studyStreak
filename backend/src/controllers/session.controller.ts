import { Request, Response } from "express";
import { SessionService } from "../services/session.service.js";
import { SessionCreateSchema } from "../validations/index.js";

export class SessionController {
  static async getAll(req: Request, res: Response) {
    try {
      const subjectId = req.query.subjectId as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const sessions = await SessionService.getAll({ subjectId, limit });
      return res.status(200).json({ success: true, data: sessions });
    } catch (error) {
      console.error("[GET_SESSIONS_ERROR]", error);
      return res.status(500).json({ success: false, error: "Database error" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const validated = SessionCreateSchema.safeParse(req.body);
      if (!validated.success) {
        console.error("[CREATE_SESSION_VALIDATION_ERROR]", validated.error.flatten().fieldErrors);
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: validated.error.flatten().fieldErrors,
        });
      }

      const session = await SessionService.create(validated.data);
      return res.status(201).json({ success: true, data: session });
    } catch (error) {
      console.error("[CREATE_SESSION_ERROR]", error);
      return res.status(500).json({ success: false, error: "Failed to record session" });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ success: false, error: "Session ID required" });
      }

      await SessionService.delete(id);
      return res.status(200).json({ success: true, message: "Session deleted" });
    } catch (error) {
      console.error("[DELETE_SESSION_ERROR]", error);
      return res.status(500).json({ success: false, error: "Failed to delete session" });
    }
  }
}
