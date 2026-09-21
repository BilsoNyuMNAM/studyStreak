import { NextRequest, NextResponse } from "next/server";
import { SessionService } from "@/server/services/session.service";
import { SessionCreateSchema } from "@/shared/validations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId") || undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const sessions = await SessionService.getAll({ subjectId, limit });
    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    console.error("[API_GET_SESSIONS_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Database unavailable" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = SessionCreateSchema.safeParse(body);

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

    const session = await SessionService.create(validatedData.data);
    return NextResponse.json({ success: true, data: session }, { status: 201 });
  } catch (error) {
    console.error("[API_POST_SESSION_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to record session" },
      { status: 500 }
    );
  }
}
