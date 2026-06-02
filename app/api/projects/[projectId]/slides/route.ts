import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/client";
import { requireCurrentUserId } from "@/lib/auth/session";
import {
  getSlidesForProject,
  insertBlankSlideForProject,
  reorderSlidesForProject,
} from "@/lib/repositories/projects";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const userId = await requireCurrentUserId();
  return NextResponse.json(getSlidesForProject(getDatabase(), projectId, userId));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const userId = await requireCurrentUserId();
  const form = await request.formData();
  const position = Number(form.get("position") ?? 1);
  const slide = insertBlankSlideForProject(getDatabase(), projectId, userId, position);
  return NextResponse.json(slide);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const userId = await requireCurrentUserId();
  const body = (await request.json()) as { orderedSlideIds?: string[] };
  const slides = reorderSlidesForProject(
    getDatabase(),
    projectId,
    userId,
    body.orderedSlideIds ?? [],
  );
  return NextResponse.json(slides);
}
