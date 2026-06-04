import { randomUUID } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import type { createTestDatabase } from "@/lib/db/test-utils";
import {
  slideImageGenerations,
  slides,
  type ProviderKey,
} from "@/lib/db/schema";
import { getDecryptedUserApiKey } from "@/lib/repositories/user-api-keys";
import { getProjectForUser } from "@/lib/repositories/projects";
import { createGeminiImageProvider } from "@/lib/images/gemini";
import { LocalImageStorageProvider } from "@/lib/images/local-storage";
import { createOpenAIImagesProvider } from "@/lib/images/openai";
import { createOpenRouterImageProvider } from "@/lib/images/openrouter";
import {
  ImageProviderError,
  missingImageProviderKey,
  normalizeImageProviderError,
  resolveProviderForImageModel,
  type ImageGenerationProvider,
  type ImageGenerationProviderKey,
  type ImageStorageProvider,
} from "@/lib/images/provider";

type Db = ReturnType<typeof createTestDatabase>;

type ImageProviderRegistry = Partial<Record<ImageGenerationProviderKey, ImageGenerationProvider>>;

type GenerateSlideImageInput = {
  projectId: string;
  slideId: string;
  userId: string;
  encryptionSecret?: string;
  storageProvider?: ImageStorageProvider;
  providers?: ImageProviderRegistry;
};

function now() {
  return new Date().toISOString();
}

function getSlideForProject(db: Db, projectId: string, slideId: string) {
  return (
    db
      .select()
      .from(slides)
      .where(
        and(
          eq(slides.projectId, projectId),
          eq(slides.id, slideId),
          isNull(slides.deletedAt),
        ),
      )
      .get() ?? null
  );
}

function defaultProviders(): Required<ImageProviderRegistry> {
  return {
    openrouter: createOpenRouterImageProvider(),
    openai: createOpenAIImagesProvider(),
    gemini: createGeminiImageProvider(),
  };
}

function imageProviderOrder(model: string): ImageGenerationProviderKey[] {
  return ["openrouter", resolveProviderForImageModel(model)];
}

function composePrompt(input: {
  commonPrompt: string;
  slidePrompt: string;
  slideTitle: string;
}) {
  return [
    input.commonPrompt.trim(),
    `Slide title: ${input.slideTitle}`,
    input.slidePrompt.trim(),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function extensionForContentType(contentType: string) {
  return contentType === "image/jpeg" ? "jpg" : "png";
}

function insertImageGenerationRecord(
  db: Db,
  input: typeof slideImageGenerations.$inferInsert,
) {
  db.insert(slideImageGenerations).values(input).run();
  return input;
}

export async function generateSlideImageForProject(
  db: Db,
  input: GenerateSlideImageInput,
) {
  const project = getProjectForUser(db, input.projectId, input.userId);
  if (!project) throw new Error("Project not found.");
  const slide = getSlideForProject(db, input.projectId, input.slideId);
  if (!slide) throw new Error("Slide not found.");

  const prompt = composePrompt({
    commonPrompt: project.resolvedCommonPrompt,
    slidePrompt: slide.imagePrompt,
    slideTitle: slide.title,
  });
  const providers = { ...defaultProviders(), ...input.providers };
  const storage = input.storageProvider ?? new LocalImageStorageProvider();
  db.update(slides)
    .set({ imageGenerationStatus: "generating", updatedAt: now() })
    .where(eq(slides.id, slide.id))
    .run();

  let lastError: ImageProviderError | null = null;
  let firstError: ImageProviderError | null = null;
  let attemptedProviderCall = false;
  let attemptedProvider: ImageGenerationProviderKey = "openrouter";

  for (const provider of imageProviderOrder(project.defaultImageModel)) {
    attemptedProvider = provider;
    const apiKey = getDecryptedUserApiKey(
      db,
      input.userId,
      provider as ProviderKey,
      { encryptionSecret: input.encryptionSecret },
    );
    if (!apiKey) {
      lastError = missingImageProviderKey(provider);
      firstError ??= lastError;
      continue;
    }

    try {
      attemptedProviderCall = true;
      const generated = await providers[provider].generateImage({
        apiKey,
        model: project.defaultImageModel,
        aspectRatio: project.aspectRatio,
        prompt,
      });
      const fileName = `${slide.id}.${extensionForContentType(generated.contentType)}`;
      const stored = await storage.saveProjectImage({
        projectId: project.id,
        ownerUserId: input.userId,
        fileName,
        contentType: generated.contentType,
        bytes: generated.bytes,
      });
      const record = insertImageGenerationRecord(db, {
        id: randomUUID(),
        projectId: project.id,
        slideId: slide.id,
        provider,
        model: project.defaultImageModel,
        promptSnapshot: prompt,
        commonPromptSnapshot: project.resolvedCommonPrompt,
        slidePromptSnapshot: slide.imagePrompt,
        storageKey: stored.storageKey,
        imageUrl: stored.url,
        status: "succeeded",
        errorMessage: null,
        createdAt: now(),
        deletedAt: null,
      });
      db.update(slides)
        .set({ imageGenerationStatus: "generated", updatedAt: now() })
        .where(eq(slides.id, slide.id))
        .run();
      return record;
    } catch (error) {
      lastError =
        error instanceof Error && "code" in error
          ? (error as ImageProviderError)
          : normalizeImageProviderError(
              provider,
              error instanceof Error ? error.message : "Image generation failed.",
            );
      firstError ??= lastError;
    }
  }

  const normalized =
    attemptedProviderCall
      ? (lastError ?? missingImageProviderKey(attemptedProvider))
      : (firstError ?? lastError ?? missingImageProviderKey(attemptedProvider));
  insertImageGenerationRecord(db, {
    id: randomUUID(),
    projectId: project.id,
    slideId: slide.id,
    provider: normalized.provider,
    model: project.defaultImageModel,
    promptSnapshot: prompt,
    commonPromptSnapshot: project.resolvedCommonPrompt,
    slidePromptSnapshot: slide.imagePrompt,
    storageKey: "",
    imageUrl: "",
    status: "failed",
    errorMessage: normalized.message,
    createdAt: now(),
    deletedAt: null,
  });
  db.update(slides)
    .set({ imageGenerationStatus: "failed", updatedAt: now() })
    .where(eq(slides.id, slide.id))
    .run();
  throw normalized;
}
