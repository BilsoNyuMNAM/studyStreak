import { Router, Request, Response } from "express";
import { SubjectService } from "../services/subject.service.js";
import { SessionService } from "../services/session.service.js";

const router = Router();

const DEFAULT_SUBJECTS = [
  { id: "sub-1", name: "Deep Work", color: "#e4e4e7" },
  { id: "sub-2", name: "Engineering & Code", color: "#a1a1aa" },
  { id: "sub-3", name: "Reading & Research", color: "#71717a" },
  { id: "sub-4", name: "Mathematics", color: "#d4d4d8" },
];

router.post("/", async (req: Request, res: Response) => {
  try {
    for (const sub of DEFAULT_SUBJECTS) {
      await SubjectService.create({
        name: sub.name,
        color: sub.color,
      });
    }

    const now = new Date();
    for (let i = 30; i >= 0; i--) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() - i);
      const isRestDay = (i === 10 || i === 22);

      if (!isRestDay) {
        const sub = DEFAULT_SUBJECTS[i % DEFAULT_SUBJECTS.length];
        const durationMins = [25, 45, 60, 30][i % 4];
        const durationSecs = durationMins * 60;
        const sessionStart = new Date(targetDate);
        sessionStart.setHours(10, 0, 0, 0);
        const sessionEnd = new Date(sessionStart.getTime() + durationSecs * 1000);

        await SessionService.create({
          subjectId: sub.id,
          subjectName: sub.name,
          subjectColor: sub.color,
          durationMinutes: durationMins,
          durationSeconds: durationSecs,
          startTime: sessionStart.toISOString(),
          endTime: sessionEnd.toISOString(),
          mode: "pomodoro",
          completed: true,
        });
      }
    }

    return res.status(200).json({ success: true, message: "Database seeded successfully" });
  } catch (error) {
    console.error("[SEED_ERROR]", error);
    return res.status(500).json({ success: false, error: "Failed to seed database" });
  }
});

export default router;
