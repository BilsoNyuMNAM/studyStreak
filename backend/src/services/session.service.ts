import { prisma } from "../lib/prisma.js";
import { SessionCreateInput } from "../validations/index.js";

export class SessionService {
  static async getAll(filter?: { subjectId?: string; limit?: number }) {
    const where: { subjectId?: string } = {};
    if (filter?.subjectId) {
      where.subjectId = filter.subjectId;
    }

    return prisma.studySession.findMany({
      where,
      orderBy: { startTime: "desc" },
      take: filter?.limit,
    });
  }

  static async getById(id: string) {
    return prisma.studySession.findUnique({
      where: { id },
    });
  }

  static async create(data: SessionCreateInput) {
    let subject = await prisma.subject.findUnique({
      where: { id: data.subjectId },
    });

    if (!subject) {
      subject = await prisma.subject.create({
        data: {
          id: data.subjectId,
          name: data.subjectName,
          color: data.subjectColor,
        },
      });
    }

    return prisma.studySession.create({
      data: {
        subjectId: subject.id,
        subjectName: data.subjectName,
        subjectColor: data.subjectColor,
        durationMinutes: data.durationMinutes,
        durationSeconds: data.durationSeconds,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        mode: data.mode,
        notes: data.notes,
        completed: data.completed,
      },
    });
  }

  static async delete(id: string) {
    return prisma.studySession.delete({
      where: { id },
    });
  }
}
