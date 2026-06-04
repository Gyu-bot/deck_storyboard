import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/client";
import { requireCurrentUserId } from "@/lib/auth/session";
import { LocalImageStorageProvider } from "@/lib/images/local-storage";
import { setSlideImageGenerationSelectionForProject } from "@/lib/repositories/projects";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; fileName: string }> },
) {
  const { projectId, fileName } = await params;
  const userId = await requireCurrentUserId();
  const storage = new LocalImageStorageProvider();
  const bytes = await storage.readProjectImage(
    getDatabase(),
    `projects/${projectId}/images/${fileName}`,
    userId,
  );
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": fileName.endsWith(".jpg") ? "image/jpeg" : "image/png",
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string; fileName: string }> },
) {
  const { projectId, fileName } = await params;
  const userId = await requireCurrentUserId();
  const body = request.headers.get("content-type")?.includes("application/json")
    ? await request.json().catch(() => null) as { selected?: unknown } | null
    : null;
  const selected = body?.selected === false ? false : true;
  const image = setSlideImageGenerationSelectionForProject(
    getDatabase(),
    projectId,
    userId,
    fileName,
    selected,
  );

  if (!image) {
    return NextResponse.json(
      { error: selected ? "선택할 수 있는 완료된 목업이 없습니다." : "선택 해제할 수 있는 완료된 목업이 없습니다." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    id: image.id,
    slideId: image.slideId,
    imageUrl: image.imageUrl,
    provider: image.provider,
    model: image.model,
    aspectRatio: image.aspectRatio,
    status: image.status,
    selected: image.selected,
    errorMessage: image.errorMessage,
    createdAt: image.createdAt,
    updatedAt: image.updatedAt,
  });
}
