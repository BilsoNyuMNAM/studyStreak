import { NextRequest, NextResponse } from "next/server";
import { SubjectService } from "@/server/services/subject.service";
import { SubjectCreateSchema } from "@/shared/validations";

export async function GET() {
  try {
    const subjects = await SubjectService.getAll();
    return NextResponse.json({ success: true, data: subjects });
  } catch (error) {
    console.error("[API_GET_SUBJECTS_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Database unavailable" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = SubjectCreateSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validatedData.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const subject = await SubjectService.create(validatedData.data);
    return NextResponse.json({ success: true, data: subject }, { status: 201 });
  } catch (error) {
    console.error("[API_POST_SUBJECT_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create subject" },
      { status: 500 }
    );
  }
}
