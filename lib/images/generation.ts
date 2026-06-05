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
  missingImageProviderKeys,
  normalizeImageProviderError,
  resolveProviderForImageModel,
  type ImageGenerationProvider,
  type ImageGenerationProviderKey,
  type ImageStorageProvider,
} from "@/lib/images/provider";
import { safeRecordProviderCallDebugLog } from "@/lib/provider-debug-logs/repository";

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

function elapsedMs(startedAt: string, completedAt: string) {
  return new Date(completedAt).getTime() - new Date(startedAt).getTime();
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

function readImageDimensions(bytes: Buffer, contentType: string) {
  if (
    contentType === "image/png" &&
    bytes.length >= 24 &&
    bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")) &&
    bytes.subarray(12, 16).toString("ascii") === "IHDR"
  ) {
    return {
      width: bytes.readUInt32BE(16),
      height: bytes.readUInt32BE(20),
    };
  }

  if (contentType !== "image/jpeg" || bytes.length < 4) return null;
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1];
    const length = bytes.readUInt16BE(offset + 2);
    if (length < 2) return null;
    if (marker && marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: bytes.readUInt16BE(offset + 5),
        width: bytes.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  return null;
}

function aspectRatioValue(aspectRatio: "16:9" | "4:3") {
  return aspectRatio === "16:9" ? 16 / 9 : 4 / 3;
}

function validateGeneratedAspectRatio(input: {
  provider: ImageGenerationProviderKey;
  requestedAspectRatio: "16:9" | "4:3";
  dimensions: { width: number; height: number } | null;
}) {
  if (input.provider !== "openrouter") return null;
  if (!input.dimensions || input.dimensions.height === 0) return null;
  const actual = input.dimensions.width / input.dimensions.height;
  const expected = aspectRatioValue(input.requestedAspectRatio);
  const tolerance = 0.03;
  if (Math.abs(actual - expected) / expected <= tolerance) return null;
  return normalizeImageProviderError(
    input.provider,
    `Provider returned ${input.dimensions.width}x${input.dimensions.height}, which does not match requested ${input.requestedAspectRatio}.`,
  );
}

function insertImageGenerationRecord(
  db: Db,
  input: typeof slideImageGenerations.$inferInsert,
) {
  db.insert(slideImageGenerations).values(input).run();
  return input;
}

function hasSuccessfulImage(db: Db, projectId: string, slideId: string) {
  return Boolean(
    db
      .select({ id: slideImageGenerations.id })
      .from(slideImageGenerations)
      .where(
        and(
          eq(slideImageGenerations.projectId, projectId),
          eq(slideImageGenerations.slideId, slideId),
          eq(slideImageGenerations.status, "succeeded"),
          isNull(slideImageGenerations.deletedAt),
        ),
      )
      .get(),
  );
}

function recordImageDebugLog(
  db: Db,
  input: {
    projectId: string;
    slideId: string;
    userId: string;
    provider: ImageGenerationProviderKey;
    model: string;
    aspectRatio: "16:9" | "4:3";
    attemptNumber: number;
    fallbackOrder: number;
    startedAt: string;
    completedAt: string;
    status: "succeeded" | "failed";
    prompt: string;
    error?: unknown;
    responseSnapshot?: unknown;
    storageSummary?: unknown;
  },
) {
  safeRecordProviderCallDebugLog(db, {
    projectId: input.projectId,
    slideId: input.slideId,
    userId: input.userId,
    operationType: "single_image_generation",
    provider: input.provider,
    model: input.model,
    aspectRatio: input.aspectRatio,
    attemptNumber: input.attemptNumber,
    fallbackOrder: input.fallbackOrder,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    durationMs: elapsedMs(input.startedAt, input.completedAt),
    status: input.status,
    normalizedError: input.error
      ? input.error instanceof Error
        ? input.error.message
        : String(input.error)
      : null,
    requestSnapshot: {
      model: input.model,
      aspectRatio: input.aspectRatio,
      prompt: input.prompt,
    },
    responseSnapshot: input.responseSnapshot ?? null,
    storageSummary: input.storageSummary ?? null,
  });
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
  let attemptedProviderCall = false;
  let attemptedProvider: ImageGenerationProviderKey = "openrouter";

  let attemptNumber = 0;
  const providerOrder = imageProviderOrder(project.defaultImageModel);
  let activeAttemptStartedAt = now();

  try {
    for (const provider of providerOrder) {
      attemptNumber += 1;
      attemptedProvider = provider;
      const startedAt = now();
      activeAttemptStartedAt = startedAt;
      const apiKey = getDecryptedUserApiKey(
        db,
        input.userId,
        provider as ProviderKey,
        { encryptionSecret: input.encryptionSecret },
      );
      if (!apiKey) {
        const missingKeyError = missingImageProviderKey(provider);
        if (!attemptedProviderCall) {
          lastError = missingKeyError;
        }
        const completedAt = now();
        recordImageDebugLog(db, {
          projectId: project.id,
          slideId: slide.id,
          userId: input.userId,
          provider,
          model: project.defaultImageModel,
          aspectRatio: project.aspectRatio,
          attemptNumber,
          fallbackOrder: attemptNumber,
          startedAt,
          completedAt,
          status: "failed",
          prompt,
          error: missingKeyError,
          responseSnapshot: { keyAvailable: false },
        });
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
        const imageDimensions = readImageDimensions(generated.bytes, generated.contentType);
        const aspectRatioError = validateGeneratedAspectRatio({
          provider,
          requestedAspectRatio: project.aspectRatio,
          dimensions: imageDimensions,
        });
        if (aspectRatioError) {
          lastError = aspectRatioError;
          const completedAt = now();
          recordImageDebugLog(db, {
            projectId: project.id,
            slideId: slide.id,
            userId: input.userId,
            provider,
            model: project.defaultImageModel,
            aspectRatio: project.aspectRatio,
            attemptNumber,
            fallbackOrder: attemptNumber,
            startedAt,
            completedAt,
            status: "failed",
            prompt,
            error: lastError,
            responseSnapshot: {
              contentType: generated.contentType,
              width: imageDimensions?.width ?? null,
              height: imageDimensions?.height ?? null,
              hasBytes: generated.bytes.length > 0,
              byteLength: generated.bytes.length,
              providerErrorCode: lastError.code,
            },
          });
          continue;
        }
        const recordId = randomUUID();
        const timestamp = now();
        const selected = !hasSuccessfulImage(db, project.id, slide.id);
        const fileName = `${slide.id}-${recordId}.${extensionForContentType(generated.contentType)}`;
        let stored;
        try {
          stored = await storage.saveProjectImage({
            projectId: project.id,
            ownerUserId: input.userId,
            fileName,
            contentType: generated.contentType,
            bytes: generated.bytes,
          });
        } catch (storageError) {
          const completedAt = now();
          const normalizedStorageError =
            storageError instanceof Error ? storageError.message : String(storageError);
          lastError = normalizeImageProviderError(provider, normalizedStorageError);
          recordImageDebugLog(db, {
            projectId: project.id,
            slideId: slide.id,
            userId: input.userId,
            provider,
            model: project.defaultImageModel,
            aspectRatio: project.aspectRatio,
            attemptNumber,
            fallbackOrder: attemptNumber,
            startedAt,
            completedAt,
            status: "failed",
            prompt,
            error: lastError,
            responseSnapshot: {
              contentType: generated.contentType,
              width: imageDimensions?.width ?? null,
              height: imageDimensions?.height ?? null,
              hasBytes: generated.bytes.length > 0,
              byteLength: generated.bytes.length,
            },
            storageSummary: {
              status: "failed",
              error: normalizedStorageError,
            },
          });
          continue;
        }
        const completedAt = now();
        const record = insertImageGenerationRecord(db, {
          id: recordId,
          projectId: project.id,
          slideId: slide.id,
          provider,
          model: project.defaultImageModel,
          promptSnapshot: prompt,
          commonPromptSnapshot: project.resolvedCommonPrompt,
          slidePromptSnapshot: slide.imagePrompt,
          aspectRatio: project.aspectRatio,
          storageKey: stored.storageKey,
          imageUrl: stored.url,
          status: "succeeded",
          errorMessage: null,
          selected,
          createdAt: timestamp,
          updatedAt: timestamp,
          deletedAt: null,
        });
        db.update(slides)
          .set({ imageGenerationStatus: "generated", updatedAt: now() })
          .where(eq(slides.id, slide.id))
          .run();
        recordImageDebugLog(db, {
          projectId: project.id,
          slideId: slide.id,
          userId: input.userId,
          provider,
          model: project.defaultImageModel,
          aspectRatio: project.aspectRatio,
          attemptNumber,
          fallbackOrder: attemptNumber,
          startedAt,
          completedAt,
          status: "succeeded",
          prompt,
          responseSnapshot: {
            contentType: generated.contentType,
            width: imageDimensions?.width ?? null,
            height: imageDimensions?.height ?? null,
            hasBytes: generated.bytes.length > 0,
            byteLength: generated.bytes.length,
          },
          storageSummary: {
            storageKey: stored.storageKey,
            imageUrl: stored.url,
            contentType: stored.contentType,
          },
        });
        return record;
      } catch (error) {
        lastError =
          error instanceof Error && "code" in error
            ? (error as ImageProviderError)
            : normalizeImageProviderError(
                provider,
                error instanceof Error ? error.message : "Image generation failed.",
              );
        const completedAt = now();
        recordImageDebugLog(db, {
          projectId: project.id,
          slideId: slide.id,
          userId: input.userId,
          provider,
          model: project.defaultImageModel,
          aspectRatio: project.aspectRatio,
          attemptNumber,
          fallbackOrder: attemptNumber,
          startedAt,
          completedAt,
          status: "failed",
          prompt,
          error: lastError,
          responseSnapshot: {
            providerErrorCode: lastError.code,
          },
        });
      }
    }
  } catch (error) {
    lastError =
      error instanceof Error && "code" in error
        ? (error as ImageProviderError)
        : normalizeImageProviderError(
            attemptedProvider,
            error instanceof Error ? error.message : "Image generation failed.",
          );
    const completedAt = now();
    recordImageDebugLog(db, {
      projectId: project.id,
      slideId: slide.id,
      userId: input.userId,
      provider: attemptedProvider,
      model: project.defaultImageModel,
      aspectRatio: project.aspectRatio,
      attemptNumber: Math.max(attemptNumber, 1),
      fallbackOrder: Math.max(attemptNumber, 1),
      startedAt: activeAttemptStartedAt,
      completedAt,
      status: "failed",
      prompt,
      error: lastError,
      responseSnapshot: {
        providerErrorCode: lastError.code,
        keyLookup: "failed",
      },
    });
  }

  const normalized = attemptedProviderCall
    ? (lastError ?? missingImageProviderKey(attemptedProvider))
    : lastError?.code === "provider_error"
      ? lastError
      : missingImageProviderKeys(providerOrder);
  insertImageGenerationRecord(db, {
    id: randomUUID(),
    projectId: project.id,
    slideId: slide.id,
    provider: normalized.provider,
    model: project.defaultImageModel,
    promptSnapshot: prompt,
    commonPromptSnapshot: project.resolvedCommonPrompt,
    slidePromptSnapshot: slide.imagePrompt,
    aspectRatio: project.aspectRatio,
    storageKey: "",
    imageUrl: "",
    status: "failed",
    errorMessage: normalized.message,
    selected: false,
    createdAt: now(),
    updatedAt: now(),
    deletedAt: null,
  });
  db.update(slides)
    .set({ imageGenerationStatus: "failed", updatedAt: now() })
    .where(eq(slides.id, slide.id))
    .run();
  throw normalized;
}
