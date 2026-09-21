import { NextRequest, NextResponse } from "next/server";
import { SessionService } from "@/server/services/session.service";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Session ID is required" },
        { status: 400 }
      );
    }

    await SessionService.delete(id);
    return NextResponse.json({ success: true, message: "Session deleted" });
  } catch (error) {
    console.error("[API_DELETE_SESSION_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
