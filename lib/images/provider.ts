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
