import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/client";
import { requireCurrentUserId } from "@/lib/auth/session";
import {
  softDeleteSlideForProject,
  updateSlideFieldForProject,
} from "@/lib/repositories/projects";

export const runtime = "nodejs";

const editableFields = [
  "title",
  "coreMessage",
  "contentPoints",
  "visualDirection",
  "imagePrompt",
  "slideRole",
] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string; slideId: string }> },
) {
  const { projectId, slideId } = await params;
  const userId = await requireCurrentUserId();
  const form = await request.formData();
  const field = String(form.get("field"));
  if (!editableFields.includes(field as (typeof editableFields)[number])) {
    return NextResponse.json({ error: "Field is not editable." }, { status: 400 });
  }
  const rawValue = String(form.get("value") ?? "");
  const value = field === "contentPoints" ? rawValue.split("\n").filter(Boolean) : rawValue;
  const updated = updateSlideFieldForProject(
    getDatabase(),
    projectId,
    userId,
    slideId,
    field as (typeof editableFields)[number],
    value,
  );
  if (!updated) return NextResponse.json({ error: "Slide not found." }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; slideId: string }> },
) {
  const { projectId, slideId } = await params;
  const userId = await requireCurrentUserId();
  softDeleteSlideForProject(getDatabase(), projectId, userId, slideId);
  return NextResponse.json({ ok: true });
}
