import { NextRequest, NextResponse } from "next/server";
import { SubjectService } from "@/server/services/subject.service";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Subject ID is required" },
        { status: 400 }
      );
    }

    await SubjectService.delete(id);
    return NextResponse.json({ success: true, message: "Subject deleted" });
  } catch (error) {
    console.error("[API_DELETE_SUBJECT_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete subject" },
      { status: 500 }
    );
  }
}
