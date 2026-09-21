import { prisma } from "../db/prisma";
import { SubjectCreateInput } from "@/shared/validations";

export class SubjectService {
  static async getAll() {
    return prisma.subject.findMany({
      orderBy: { createdAt: "asc" },
    });
  }

  static async getById(id: string) {
    return prisma.subject.findUnique({
      where: { id },
    });
  }

  static async create(data: SubjectCreateInput) {
    return prisma.subject.create({
      data: {
        name: data.name,
        color: data.color,
        icon: data.icon,
      },
    });
  }

  static async delete(id: string) {
    return prisma.subject.delete({
      where: { id },
    });
  }
}
