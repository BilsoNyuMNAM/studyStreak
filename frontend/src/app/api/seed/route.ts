import { NextResponse } from "next/server";
import { SubjectService } from "@/server/services/subject.service";
import { SessionService } from "@/server/services/session.service";
import { DEFAULT_SUBJECTS, generateSeedSessions } from "@/shared/utils/initialData";

export async function POST() {
  try {
    for (const sub of DEFAULT_SUBJECTS) {
      await SubjectService.create({
        name: sub.name,
        color: sub.color,
        icon: sub.icon,
      });
    }

    const seedSessions = generateSeedSessions();
    for (const s of seedSessions) {
      await SessionService.create({
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        subjectColor: s.subjectColor,
        durationMinutes: s.durationMinutes,
        durationSeconds: s.durationSeconds,
        startTime: s.startTime,
        endTime: s.endTime,
        mode: s.mode,
        notes: s.notes,
        completed: s.completed,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
    });
  } catch (error) {
    console.error("[API_SEED_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to seed database" },
      { status: 500 }
    );
  }
}
