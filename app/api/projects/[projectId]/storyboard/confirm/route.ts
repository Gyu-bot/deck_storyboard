import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/client";
import { requireCurrentUserId } from "@/lib/auth/session";
import { recordSlideOperation, updateProjectForUser } from "@/lib/repositories/projects";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const userId = await requireCurrentUserId();
  const updated = updateProjectForUser(getDatabase(), projectId, userId, {
    status: "storyboard_confirmed",
  });
  if (!updated) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  recordSlideOperation(getDatabase(), {
    projectId,
    userId,
    operationType: "confirm_storyboard",
    metadata: { status: "storyboard_confirmed" },
    afterSnapshot: updated,
  });
  return NextResponse.redirect(new URL(`/projects/${projectId}`, request.url), 303);
}
