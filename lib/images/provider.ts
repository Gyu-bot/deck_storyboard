import type { ProviderKey } from "@/lib/db/schema";

export type ImageGenerationInput = {
  prompt: string;
  aspectRatio: "16:9" | "4:3";
  model: "gpt-image-2" | "nano-banana" | string;
  apiKey: string;
};

export type ImageGenerationOutput = {
  bytes: Buffer;
  contentType: "image/png" | "image/jpeg";
};

export interface ImageGenerationProvider {
  generateImage(input: ImageGenerationInput): Promise<ImageGenerationOutput>;
}

export type ImageGenerationProviderKey = Extract<ProviderKey, "openai" | "gemini">;

export class ImageProviderError extends Error {
  constructor(
    message: string,
    readonly code: "provider_key_missing" | "provider_error",
    readonly provider: ImageGenerationProviderKey,
  ) {
    super(message);
    this.name = "ImageProviderError";
  }
}

export function normalizeImageProviderError(
  provider: ImageGenerationProviderKey,
  message: string,
) {
  return new ImageProviderError(
    `${provider} image generation failed: ${message}`,
    "provider_error",
    provider,
  );
}

export function missingImageProviderKey(provider: ImageGenerationProviderKey) {
  return new ImageProviderError(
    `${provider} API key is required for image generation.`,
    "provider_key_missing",
    provider,
  );
}

export function resolveProviderForImageModel(
  model: string,
): ImageGenerationProviderKey {
  return model === "nano-banana" ? "gemini" : "openai";
}

export type ImageStorageRecord = {
  storageKey: string;
  filePath: string;
  url: string;
  contentType: string;
};

export interface ImageStorageProvider {
  saveProjectImage(input: {
    projectId: string;
    ownerUserId: string;
    fileName: string;
    contentType: string;
    bytes: Buffer;
  }): Promise<ImageStorageRecord>;
}
