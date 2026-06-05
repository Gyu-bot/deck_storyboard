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

export type ImageGenerationProviderKey = Extract<ProviderKey, "openrouter" | "openai" | "gemini">;

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

const providerLabels: Record<ImageGenerationProviderKey, string> = {
  openrouter: "OpenRouter",
  openai: "OpenAI",
  gemini: "Gemini",
};

export function missingImageProviderKeys(providers: ImageGenerationProviderKey[]) {
  const uniqueProviders = [...new Set(providers)];
  const providerList = uniqueProviders
    .map((provider) => providerLabels[provider])
    .join(" 또는 ");
  return new ImageProviderError(
    `${providerList} API key가 없습니다. 관리자 화면에서 해당 회원에게 provider key를 할당한 뒤 다시 시도하세요.`,
    "provider_key_missing",
    uniqueProviders[0] ?? "openrouter",
  );
}

export function resolveProviderForImageModel(
  model: string,
): Exclude<ImageGenerationProviderKey, "openrouter"> {
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
