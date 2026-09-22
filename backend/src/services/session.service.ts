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
    const startDate = new Date(data.startTime);
    const endDate = new Date(data.endTime);

    // Deduplication check: return existing record if identical session submitted within ±5s window
    const windowStart = new Date(startDate.getTime() - 5000);
    const windowEnd = new Date(startDate.getTime() + 5000);

    const existingDuplicate = await prisma.studySession.findFirst({
      where: {
        subjectId: data.subjectId,
        durationSeconds: data.durationSeconds,
        startTime: {
          gte: windowStart,
          lte: windowEnd,
        },
      },
    });

    if (existingDuplicate) {
      console.log(`[DEDUPLICATION] Prevented duplicate session. Returning existing: ${existingDuplicate.id}`);
      return existingDuplicate;
    }

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
        startTime: startDate,
        endTime: endDate,
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
