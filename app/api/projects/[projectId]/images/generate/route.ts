import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/client";
import { requireCurrentUserId } from "@/lib/auth/session";
import { getSlidesForProject } from "@/lib/repositories/projects";
import { generateSlideImageForProject } from "@/lib/images/generation";
import type { ImageProviderError } from "@/lib/images/provider";

export const runtime = "nodejs";

function imageGenerationErrorMessage(error: unknown) {
  const providerError = error as Partial<ImageProviderError>;
  if (providerError.code === "provider_key_missing") {
    const providerName =
      providerError.provider === "openrouter"
        ? "OpenRouter"
        : providerError.provider === "gemini"
          ? "Gemini"
          : "OpenAI";
    return `${providerName} API key가 없습니다. 관리자 화면에서 해당 회원에게 provider key를 할당한 뒤 다시 시도하세요.`;
  }
  return error instanceof Error ? error.message : "목업 생성에 실패했습니다.";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const userId = await requireCurrentUserId();
  const db = getDatabase();
  const form = await request.formData().catch(() => null);
  const requestedSlideId = String(form?.get("slideId") ?? "");
  const projectSlides = getSlidesForProject(db, projectId, userId);
  const slides = requestedSlideId
    ? projectSlides.filter((slide) => slide.id === requestedSlideId)
    : projectSlides;

  if (slides.length === 0) {
    return NextResponse.json({ error: "생성할 슬라이드가 없습니다." }, { status: 404 });
  }

  let generated = 0;
  const errors: string[] = [];
  const images: Array<{
    slideId: string | null;
    imageUrl: string;
    provider: string;
    model: string;
  }> = [];

  for (const slide of slides) {
    try {
      const image = await generateSlideImageForProject(db, {
        projectId,
        slideId: slide.id,
        userId,
      });
      generated += 1;
      images.push({
        slideId: image.slideId ?? null,
        imageUrl: image.imageUrl,
        provider: image.provider,
        model: image.model,
      });
    } catch (error) {
      errors.push(imageGenerationErrorMessage(error));
    }
  }

  const failed = slides.length - generated;
  if (generated === 0 && errors.length > 0) {
    return NextResponse.json(
      {
        error: errors[0],
        generated,
        failed,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    generated,
    failed,
    error: errors[0] ?? null,
    images,
  });
}
