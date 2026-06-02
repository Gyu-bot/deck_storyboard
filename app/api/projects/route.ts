import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/client";
import { requireCurrentUserId } from "@/lib/auth/session";
import {
  createProjectForUser,
  listProjectsForUser,
  softDeleteProjectForUser,
  updateProjectForUser,
} from "@/lib/repositories/projects";
import {
  parseStyleTemplate,
  resolveCommonStylePrompt,
  validateStorylineLength,
} from "@/lib/projects/style-settings";
import { appUrl } from "@/lib/http/redirects";

export const runtime = "nodejs";

export async function GET() {
  const userId = await requireCurrentUserId();
  return NextResponse.json(listProjectsForUser(getDatabase(), userId));
}

export async function POST(request: Request) {
  const userId = await requireCurrentUserId();
  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  const storyline = String(form.get("storyline") ?? "");
  const lengthError = validateStorylineLength(storyline);
  if (!name || !storyline || lengthError) {
    return NextResponse.json(
      { error: lengthError ?? "Project name and storyline are required." },
      { status: 400 },
    );
  }
  const styleTemplate = parseStyleTemplate(form.get("styleTemplate"));
  const customCommonStylePrompt = String(form.get("customCommonStylePrompt") ?? "");
  const project = createProjectForUser(getDatabase(), userId, {
    name,
    storyline,
    targetSlideCount: Number(form.get("targetSlideCount") ?? 8),
    improvementSuggestionsEnabled:
      String(form.get("improvementSuggestionsEnabled") ?? "on") === "on",
    aspectRatio: String(form.get("aspectRatio")) === "4:3" ? "4:3" : "16:9",
    defaultImageModel:
      String(form.get("defaultImageModel")) === "nano-banana"
        ? "nano-banana"
        : "gpt-image-2",
    styleTemplate,
    customCommonStylePrompt,
    resolvedCommonPrompt: resolveCommonStylePrompt(
      styleTemplate,
      customCommonStylePrompt,
    ),
  });
  return NextResponse.redirect(appUrl(`/projects/${project.id}`, request), 303);
}

export async function PATCH(request: Request) {
  const userId = await requireCurrentUserId();
  const form = await request.formData();
  const projectId = String(form.get("projectId") ?? "");
  const name = String(form.get("name") ?? "").trim();
  if (!projectId || !name) {
    return NextResponse.json({ error: "Project id and name are required." }, { status: 400 });
  }
  const updated = updateProjectForUser(getDatabase(), projectId, userId, { name });
  if (!updated) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const userId = await requireCurrentUserId();
  const form = await request.formData();
  const projectId = String(form.get("projectId") ?? "");
  if (!projectId) {
    return NextResponse.json({ error: "Project id is required." }, { status: 400 });
  }
  softDeleteProjectForUser(getDatabase(), projectId, userId);
  return NextResponse.json({ ok: true });
}
