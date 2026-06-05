import { describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

import { providerCallDebugLogs, slideImageGenerations } from "@/lib/db/schema";
import { createTestDatabase } from "@/lib/db/test-utils";
import {
  createProjectForUser,
  createSlideForProject,
  getSlidesForProject,
  listLatestSuccessfulSlideImagesForProject,
  setSlideImageGenerationSelectionForProject,
} from "@/lib/repositories/projects";
import { saveUserApiKey } from "@/lib/repositories/user-api-keys";
import {
  createOpenAIImagesProvider,
  normalizeImageProviderError,
} from "@/lib/images/openai";
import { createGeminiImageProvider } from "@/lib/images/gemini";
import { createOpenRouterImageProvider } from "@/lib/images/openrouter";
import { generateSlideImageForProject } from "@/lib/images/generation";

const encryptionSecret = "0123456789abcdef0123456789abcdef";

function pngBytesWithDimensions(width: number, height: number) {
  const bytes = Buffer.alloc(24);
  Buffer.from("89504e470d0a1a0a", "hex").copy(bytes, 0);
  bytes.writeUInt32BE(13, 8);
  bytes.write("IHDR", 12, "ascii");
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}

describe("OpenRouter image provider", () => {
  it("uses the openrouter account-level key, requests image output, and decodes returned data URLs", async () => {
    const requests: Array<{ url: string; init: RequestInit }> = [];
    const provider = createOpenRouterImageProvider({
      fetchImpl: async (url, init) => {
        requests.push({ url: String(url), init: init ?? {} });
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  images: [
                    {
                      imageUrl: {
                        url: `data:image/png;base64,${Buffer.from("openrouter-png").toString("base64")}`,
                      },
                    },
                  ],
                },
              },
            ],
          }),
          { status: 200 },
        );
      },
    });

    const output = await provider.generateImage({
      apiKey: "sk-openrouter-user",
      model: "gpt-image-2",
      prompt: "Executive slide mockup",
      aspectRatio: "16:9",
    });

    expect(output.bytes).toEqual(Buffer.from("openrouter-png"));
    expect(output.contentType).toBe("image/png");
    expect(requests[0]?.url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(requests[0]?.init.headers).toMatchObject({
      Authorization: "Bearer sk-openrouter-user",
      "Content-Type": "application/json",
    });
    const body = JSON.parse(String(requests[0]?.init.body)) as {
      model: string;
      messages: Array<{ role: string; content: string }>;
      modalities: string[];
      image_config: { aspect_ratio: string };
    };
    expect(body.model).toBe("openai/gpt-5.4-image-2");
    expect(body.modalities).toEqual(["image", "text"]);
    expect(body.image_config.aspect_ratio).toBe("16:9");
    expect(body.messages[0]?.content).toContain("Executive slide mockup");
  });
});

describe("T021 OpenAI Images provider", () => {
  it("uses the openai account-level key, maps slide aspect ratio into the request, and decodes returned bytes", async () => {
    const requests: Array<{ url: string; init: RequestInit }> = [];
    const provider = createOpenAIImagesProvider({
      fetchImpl: async (url, init) => {
        requests.push({ url: String(url), init: init ?? {} });
        return new Response(
          JSON.stringify({
            data: [{ b64_json: Buffer.from("openai-png").toString("base64") }],
          }),
          { status: 200 },
        );
      },
    });

    const output = await provider.generateImage({
      apiKey: "sk-openai-user",
      model: "gpt-image-2",
      prompt: "Executive slide mockup",
      aspectRatio: "16:9",
    });

    expect(output.bytes).toEqual(Buffer.from("openai-png"));
    expect(output.contentType).toBe("image/png");
    expect(requests).toHaveLength(1);
    expect(requests[0]?.url).toBe("https://api.openai.com/v1/images/generations");
    expect(requests[0]?.init.method).toBe("POST");
    expect(requests[0]?.init.headers).toMatchObject({
      Authorization: "Bearer sk-openai-user",
      "Content-Type": "application/json",
    });
    const body = JSON.parse(String(requests[0]?.init.body)) as {
      model: string;
      prompt: string;
      size: string;
      n: number;
    };
    expect(body).toMatchObject({
      model: "gpt-image-2",
      size: "1536x1024",
      n: 1,
    });
    expect(body.prompt).toContain("Aspect ratio: 16:9");
    expect(body.prompt).toContain("Executive slide mockup");
  });

  it("normalizes provider failures without leaking raw response shape", async () => {
    const provider = createOpenAIImagesProvider({
      fetchImpl: async () =>
        new Response(JSON.stringify({ error: { message: "bad request" } }), {
          status: 400,
        }),
    });

    await expect(
      provider.generateImage({
        apiKey: "sk-openai-user",
        model: "gpt-image-2",
        prompt: "Executive slide mockup",
        aspectRatio: "4:3",
      }),
    ).rejects.toMatchObject(
      normalizeImageProviderError("openai", "bad request"),
    );
  });
});

describe("T022 Gemini/Nano Banana image provider", () => {
  it("uses the gemini account-level key and sends Nano Banana aspect ratio config", async () => {
    const requests: Array<{ url: string; init: RequestInit }> = [];
    const provider = createGeminiImageProvider({
      fetchImpl: async (url, init) => {
        requests.push({ url: String(url), init: init ?? {} });
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      inlineData: {
                        mimeType: "image/png",
                        data: Buffer.from("gemini-png").toString("base64"),
                      },
                    },
                  ],
                },
              },
            ],
          }),
          { status: 200 },
        );
      },
    });

    const output = await provider.generateImage({
      apiKey: "gemini-user-key",
      model: "nano-banana",
      prompt: "Consulting slide mockup",
      aspectRatio: "4:3",
    });

    expect(output.bytes).toEqual(Buffer.from("gemini-png"));
    expect(output.contentType).toBe("image/png");
    expect(requests[0]?.url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent",
    );
    expect(requests[0]?.init.headers).toMatchObject({
      "x-goog-api-key": "gemini-user-key",
      "Content-Type": "application/json",
    });
    const body = JSON.parse(String(requests[0]?.init.body)) as {
      contents: Array<{ parts: Array<{ text: string }> }>;
      generationConfig: { imageConfig: { aspectRatio: string } };
    };
    expect(body.contents[0]?.parts[0]?.text).toContain("Consulting slide mockup");
    expect(body.generationConfig.imageConfig.aspectRatio).toBe("4:3");
  });
});

describe("T021-T022 slide image generation orchestration", () => {
  it("returns a provider-key error when no OpenRouter or direct fallback user key exists", async () => {
    const db = createTestDatabase();
    const project = createProjectForUser(db, "user-a", {
      name: "Deck",
      storyline: "story",
      defaultImageModel: "gpt-image-2",
    });
    const slide = createSlideForProject(db, project.id, "user-a", {
      title: "Slide 1",
      imagePrompt: "Generate a clean slide mockup",
    });

    await expect(
      generateSlideImageForProject(db, {
        projectId: project.id,
        slideId: slide.id,
        userId: "user-a",
        encryptionSecret,
      }),
    ).rejects.toMatchObject({
      code: "provider_key_missing",
      provider: "openrouter",
      message:
        "OpenRouter 또는 OpenAI API key가 없습니다. 관리자 화면에서 해당 회원에게 provider key를 할당한 뒤 다시 시도하세요.",
    });
  });

  it("keeps the OpenRouter provider failure when the direct fallback key is missing", async () => {
    const db = createTestDatabase();
    const project = createProjectForUser(db, "user-a", {
      name: "Deck",
      storyline: "story",
      defaultImageModel: "gpt-image-2",
    });
    const slide = createSlideForProject(db, project.id, "user-a", {
      title: "Slide 1",
      imagePrompt: "Generate a clean slide mockup",
    });
    saveUserApiKey(db, "user-a", "openrouter", "openrouter-user-key", {
      encryptionSecret,
    });
    const openRouterProvider = {
      generateImage: vi.fn().mockRejectedValue(new Error("OpenRouter is unavailable")),
    };

    await expect(
      generateSlideImageForProject(db, {
        projectId: project.id,
        slideId: slide.id,
        userId: "user-a",
        encryptionSecret,
        providers: { openrouter: openRouterProvider },
      }),
    ).rejects.toMatchObject({
      code: "provider_error",
      provider: "openrouter",
      message: "openrouter image generation failed: OpenRouter is unavailable",
    });

    const records = db.select().from(slideImageGenerations).all();
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      provider: "openrouter",
      status: "failed",
      errorMessage: "openrouter image generation failed: OpenRouter is unavailable",
    });
  });

  it("marks the slide failed when provider key decryption fails after entering generation", async () => {
    const db = createTestDatabase();
    const project = createProjectForUser(db, "user-a", {
      name: "Deck",
      storyline: "story",
      defaultImageModel: "gpt-image-2",
    });
    const slide = createSlideForProject(db, project.id, "user-a", {
      title: "Slide 1",
      imagePrompt: "Generate a clean slide mockup",
    });
    saveUserApiKey(db, "user-a", "openrouter", "openrouter-user-key", {
      encryptionSecret,
    });

    await expect(
      generateSlideImageForProject(db, {
        projectId: project.id,
        slideId: slide.id,
        userId: "user-a",
        encryptionSecret: "development-only-api-key-secret",
      }),
    ).rejects.toMatchObject({
      code: "provider_error",
      provider: "openrouter",
    });

    expect(getSlidesForProject(db, project.id, "user-a")[0]?.imageGenerationStatus).toBe(
      "failed",
    );
    const records = db.select().from(slideImageGenerations).all();
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      provider: "openrouter",
      status: "failed",
    });
  });

  it("uses OpenRouter successfully without requiring the direct OpenAI image key", async () => {
    const db = createTestDatabase();
    const project = createProjectForUser(db, "user-a", {
      name: "Deck",
      storyline: "story",
      defaultImageModel: "gpt-image-2",
    });
    const slide = createSlideForProject(db, project.id, "user-a", {
      title: "Slide 1",
      imagePrompt: "Generate a clean slide mockup",
    });
    saveUserApiKey(db, "user-a", "openrouter", "openrouter-user-key", {
      encryptionSecret,
    });
    const storage = {
      saveProjectImage: vi.fn().mockResolvedValue({
        storageKey: `projects/${project.id}/images/slide-1.png`,
        filePath: `/app/data/storage/projects/${project.id}/images/slide-1.png`,
        url: `/api/projects/${project.id}/images/slide-1.png`,
        contentType: "image/png",
      }),
    };
    const openRouterProvider = {
      generateImage: vi.fn().mockResolvedValue({
        bytes: Buffer.from("openrouter-png"),
        contentType: "image/png",
      }),
    };
    const openaiProvider = {
      generateImage: vi.fn().mockResolvedValue({
        bytes: Buffer.from("openai-png"),
        contentType: "image/png",
      }),
    };

    const result = await generateSlideImageForProject(db, {
      projectId: project.id,
      slideId: slide.id,
      userId: "user-a",
      encryptionSecret,
      storageProvider: storage,
      providers: { openrouter: openRouterProvider, openai: openaiProvider },
    });

    expect(result.provider).toBe("openrouter");
    expect(openRouterProvider.generateImage).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: "openrouter-user-key" }),
    );
    expect(openaiProvider.generateImage).not.toHaveBeenCalled();
  });

  it("uses the direct OpenAI image provider when OpenRouter key is missing", async () => {
    const db = createTestDatabase();
    const project = createProjectForUser(db, "user-a", {
      name: "Deck",
      storyline: "story",
      defaultImageModel: "gpt-image-2",
    });
    const slide = createSlideForProject(db, project.id, "user-a", {
      title: "Slide 1",
      imagePrompt: "Generate a clean slide mockup",
    });
    saveUserApiKey(db, "user-a", "openai", "openai-user-key", {
      encryptionSecret,
    });
    const storage = {
      saveProjectImage: vi.fn().mockResolvedValue({
        storageKey: `projects/${project.id}/images/slide-1.png`,
        filePath: `/app/data/storage/projects/${project.id}/images/slide-1.png`,
        url: `/api/projects/${project.id}/images/slide-1.png`,
        contentType: "image/png",
      }),
    };
    const openRouterProvider = {
      generateImage: vi.fn().mockResolvedValue({
        bytes: Buffer.from("openrouter-png"),
        contentType: "image/png",
      }),
    };
    const openaiProvider = {
      generateImage: vi.fn().mockResolvedValue({
        bytes: Buffer.from("openai-png"),
        contentType: "image/png",
      }),
    };

    const result = await generateSlideImageForProject(db, {
      projectId: project.id,
      slideId: slide.id,
      userId: "user-a",
      encryptionSecret,
      storageProvider: storage,
      providers: { openrouter: openRouterProvider, openai: openaiProvider },
    });

    expect(openRouterProvider.generateImage).not.toHaveBeenCalled();
    expect(openaiProvider.generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: "openai-user-key",
        model: "gpt-image-2",
      }),
    );
    expect(result.provider).toBe("openai");
  });

  it("accepts the direct OpenAI landscape output size without OpenRouter aspect-ratio enforcement", async () => {
    const db = createTestDatabase();
    const project = createProjectForUser(db, "user-a", {
      name: "Deck",
      storyline: "story",
      defaultImageModel: "gpt-image-2",
    });
    const slide = createSlideForProject(db, project.id, "user-a", {
      title: "Slide 1",
      imagePrompt: "Generate a clean slide mockup",
    });
    saveUserApiKey(db, "user-a", "openai", "openai-user-key", {
      encryptionSecret,
    });
    const storage = {
      saveProjectImage: vi.fn().mockResolvedValue({
        storageKey: `projects/${project.id}/images/slide-1.png`,
        filePath: `/app/data/storage/projects/${project.id}/images/slide-1.png`,
        url: `/api/projects/${project.id}/images/slide-1.png`,
        contentType: "image/png",
      }),
    };
    const openaiProvider = {
      generateImage: vi.fn().mockResolvedValue({
        bytes: pngBytesWithDimensions(1536, 1024),
        contentType: "image/png",
      }),
    };

    const result = await generateSlideImageForProject(db, {
      projectId: project.id,
      slideId: slide.id,
      userId: "user-a",
      encryptionSecret,
      storageProvider: storage,
      providers: { openai: openaiProvider },
    });

    expect(result.provider).toBe("openai");
    expect(storage.saveProjectImage).toHaveBeenCalledWith(
      expect.objectContaining({
        bytes: pngBytesWithDimensions(1536, 1024),
      }),
    );
  });

  it("rejects a mismatched OpenRouter image aspect ratio before storing and falls back", async () => {
    const db = createTestDatabase();
    const project = createProjectForUser(db, "user-a", {
      name: "Deck",
      storyline: "story",
      defaultImageModel: "gpt-image-2",
    });
    const slide = createSlideForProject(db, project.id, "user-a", {
      title: "Slide 1",
      imagePrompt: "Generate a clean slide mockup",
    });
    saveUserApiKey(db, "user-a", "openrouter", "openrouter-user-key", {
      encryptionSecret,
    });
    saveUserApiKey(db, "user-a", "openai", "openai-user-key", {
      encryptionSecret,
    });
    const storage = {
      saveProjectImage: vi.fn().mockResolvedValue({
        storageKey: `projects/${project.id}/images/slide-1.png`,
        filePath: `/app/data/storage/projects/${project.id}/images/slide-1.png`,
        url: `/api/projects/${project.id}/images/slide-1.png`,
        contentType: "image/png",
      }),
    };
    const openRouterProvider = {
      generateImage: vi.fn().mockResolvedValue({
        bytes: pngBytesWithDimensions(1024, 1024),
        contentType: "image/png",
      }),
    };
    const openaiProvider = {
      generateImage: vi.fn().mockResolvedValue({
        bytes: pngBytesWithDimensions(1536, 864),
        contentType: "image/png",
      }),
    };

    const result = await generateSlideImageForProject(db, {
      projectId: project.id,
      slideId: slide.id,
      userId: "user-a",
      encryptionSecret,
      storageProvider: storage,
      providers: { openrouter: openRouterProvider, openai: openaiProvider },
    });

    expect(result.provider).toBe("openai");
    expect(storage.saveProjectImage).toHaveBeenCalledTimes(1);
    expect(storage.saveProjectImage).toHaveBeenCalledWith(
      expect.objectContaining({
        bytes: pngBytesWithDimensions(1536, 864),
      }),
    );
    expect(
      db
        .select()
        .from(providerCallDebugLogs)
        .orderBy(providerCallDebugLogs.fallbackOrder)
        .all()
        .map((log) => ({
          provider: log.provider,
          status: log.status,
          error: log.normalizedError,
        })),
    ).toEqual([
      {
        provider: "openrouter",
        status: "failed",
        error:
          "openrouter image generation failed: Provider returned 1024x1024, which does not match requested 16:9.",
      },
      {
        provider: "openai",
        status: "succeeded",
        error: null,
      },
    ]);
  });

  it("generates one slide image through OpenRouter by default, stores bytes locally, records provider metadata, and updates slide status", async () => {
    const db = createTestDatabase();
    const project = createProjectForUser(db, "user-a", {
      name: "Deck",
      storyline: "story",
      aspectRatio: "4:3",
      defaultImageModel: "nano-banana",
      resolvedCommonPrompt: "Use the corporate blue visual system.",
    });
    const slide = createSlideForProject(db, project.id, "user-a", {
      title: "Slide 1",
      imagePrompt: "Generate a clean slide mockup",
    });
    saveUserApiKey(db, "user-a", "gemini", "gemini-user-key", {
      encryptionSecret,
    });
    saveUserApiKey(db, "user-a", "openrouter", "openrouter-user-key", {
      encryptionSecret,
    });
    const storage = {
      saveProjectImage: vi.fn().mockResolvedValue({
        storageKey: `projects/${project.id}/images/slide-1.png`,
        filePath: `/app/data/storage/projects/${project.id}/images/slide-1.png`,
        url: `/api/projects/${project.id}/images/slide-1.png`,
        contentType: "image/png",
      }),
    };
    const geminiProvider = {
      generateImage: vi.fn().mockResolvedValue({
        bytes: Buffer.from("gemini-png"),
        contentType: "image/png",
      }),
    };
    const openRouterProvider = {
      generateImage: vi.fn().mockResolvedValue({
        bytes: Buffer.from("openrouter-png"),
        contentType: "image/png",
      }),
    };

    const result = await generateSlideImageForProject(db, {
      projectId: project.id,
      slideId: slide.id,
      userId: "user-a",
      encryptionSecret,
      storageProvider: storage,
      providers: { openrouter: openRouterProvider, gemini: geminiProvider },
    });

    expect(openRouterProvider.generateImage).toHaveBeenCalledWith({
      apiKey: "openrouter-user-key",
      model: "nano-banana",
      aspectRatio: "4:3",
      prompt: expect.stringContaining("Generate a clean slide mockup"),
    });
    expect(geminiProvider.generateImage).not.toHaveBeenCalled();
    expect(openRouterProvider.generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("Use the corporate blue visual system."),
      }),
    );
    expect(storage.saveProjectImage).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: project.id,
        ownerUserId: "user-a",
        fileName: `${slide.id}-${result.id}.png`,
        bytes: Buffer.from("openrouter-png"),
      }),
    );
    expect(result.provider).toBe("openrouter");
    expect(result.model).toBe("nano-banana");
    expect(result.imageUrl).toBe(`/api/projects/${project.id}/images/slide-1.png`);
    expect(getSlidesForProject(db, project.id, "user-a")[0]?.imageGenerationStatus).toBe(
      "generated",
    );
    const records = db.select().from(slideImageGenerations).all();
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      projectId: project.id,
      slideId: slide.id,
      provider: "openrouter",
      model: "nano-banana",
      aspectRatio: "4:3",
      status: "succeeded",
      imageUrl: `/api/projects/${project.id}/images/slide-1.png`,
      selected: true,
    });
    expect(records[0]?.promptSnapshot).toContain("Use the corporate blue visual system.");
    expect(records[0]?.commonPromptSnapshot).toBe("Use the corporate blue visual system.");
    expect(records[0]?.slidePromptSnapshot).toBe("Generate a clean slide mockup");
    expect(records[0]?.updatedAt).toBeTruthy();
    const debugLogs = db.select().from(providerCallDebugLogs).all();
    expect(debugLogs).toHaveLength(1);
    expect(debugLogs[0]).toMatchObject({
      projectId: project.id,
      slideId: slide.id,
      userId: "user-a",
      operationType: "single_image_generation",
      provider: "openrouter",
      model: "nano-banana",
      aspectRatio: "4:3",
      attemptNumber: 1,
      fallbackOrder: 1,
      status: "succeeded",
      storageSummary: {
        storageKey: `projects/${project.id}/images/slide-1.png`,
        contentType: "image/png",
      },
    });
    expect(JSON.stringify(debugLogs[0]?.requestSnapshot)).not.toContain(
      "openrouter-user-key",
    );
    expect(JSON.stringify(debugLogs[0]?.responseSnapshot)).not.toContain(
      "openrouter-png",
    );
  });

  it("keeps the existing selected image when a slide is regenerated and appends a new history record", async () => {
    const db = createTestDatabase();
    const project = createProjectForUser(db, "user-a", {
      name: "Deck",
      storyline: "story",
      defaultImageModel: "gpt-image-2",
      resolvedCommonPrompt: "Use executive consulting layout rules.",
    });
    const slide = createSlideForProject(db, project.id, "user-a", {
      title: "Slide 1",
      imagePrompt: "Generate a clean slide mockup",
    });
    saveUserApiKey(db, "user-a", "openrouter", "openrouter-user-key", {
      encryptionSecret,
    });
    const storage = {
      saveProjectImage: vi
        .fn()
        .mockImplementation(
          ({
            fileName,
          }: {
            fileName: string;
          }) => Promise.resolve({
            storageKey: `projects/${project.id}/images/${fileName}`,
            filePath: `/app/data/storage/projects/${project.id}/images/${fileName}`,
            url: `/api/projects/${project.id}/images/${fileName}`,
            contentType: "image/png",
          }),
        ),
    };
    const openRouterProvider = {
      generateImage: vi.fn().mockResolvedValue({
        bytes: Buffer.from("openrouter-png"),
        contentType: "image/png",
      }),
    };

    const first = await generateSlideImageForProject(db, {
      projectId: project.id,
      slideId: slide.id,
      userId: "user-a",
      encryptionSecret,
      storageProvider: storage,
      providers: { openrouter: openRouterProvider },
    });
    const second = await generateSlideImageForProject(db, {
      projectId: project.id,
      slideId: slide.id,
      userId: "user-a",
      encryptionSecret,
      storageProvider: storage,
      providers: { openrouter: openRouterProvider },
    });

    expect(first.id).not.toBe(second.id);
    expect(first.imageUrl).not.toBe(second.imageUrl);
    const records = db
      .select()
      .from(slideImageGenerations)
      .orderBy(slideImageGenerations.createdAt)
      .all();
    expect(records).toHaveLength(2);
    expect(records.map((record) => record.selected)).toEqual([true, false]);
    expect(
      listLatestSuccessfulSlideImagesForProject(db, project.id, "user-a"),
    ).toMatchObject([
      {
        id: first.id,
        imageUrl: first.imageUrl,
        selected: true,
      },
    ]);
  });

  it("does not auto-select regeneration when a legacy successful image exists without a selected flag", async () => {
    const db = createTestDatabase();
    const project = createProjectForUser(db, "user-a", {
      name: "Deck",
      storyline: "story",
      defaultImageModel: "gpt-image-2",
    });
    const slide = createSlideForProject(db, project.id, "user-a", {
      title: "Slide 1",
      imagePrompt: "Generate a clean slide mockup",
    });
    saveUserApiKey(db, "user-a", "openrouter", "openrouter-user-key", {
      encryptionSecret,
    });
    const storage = {
      saveProjectImage: vi
        .fn()
        .mockImplementation(
          ({
            fileName,
          }: {
            fileName: string;
          }) => Promise.resolve({
            storageKey: `projects/${project.id}/images/${fileName}`,
            filePath: `/app/data/storage/projects/${project.id}/images/${fileName}`,
            url: `/api/projects/${project.id}/images/${fileName}`,
            contentType: "image/png",
          }),
        ),
    };
    const openRouterProvider = {
      generateImage: vi.fn().mockResolvedValue({
        bytes: Buffer.from("openrouter-png"),
        contentType: "image/png",
      }),
    };
    const first = await generateSlideImageForProject(db, {
      projectId: project.id,
      slideId: slide.id,
      userId: "user-a",
      encryptionSecret,
      storageProvider: storage,
      providers: { openrouter: openRouterProvider },
    });
    db.update(slideImageGenerations)
      .set({ selected: false })
      .where(eq(slideImageGenerations.id, first.id))
      .run();

    const regenerated = await generateSlideImageForProject(db, {
      projectId: project.id,
      slideId: slide.id,
      userId: "user-a",
      encryptionSecret,
      storageProvider: storage,
      providers: { openrouter: openRouterProvider },
    });

    expect(regenerated.selected).toBe(false);
    const records = db.select().from(slideImageGenerations).all();
    expect(records.map((record) => record.selected)).toEqual([false, false]);
  });

  it("allows a selected slide image to be explicitly deselected", async () => {
    const db = createTestDatabase();
    const project = createProjectForUser(db, "user-a", {
      name: "Deck",
      storyline: "story",
      defaultImageModel: "gpt-image-2",
    });
    const slide = createSlideForProject(db, project.id, "user-a", {
      title: "Slide 1",
      imagePrompt: "Generate a clean slide mockup",
    });
    saveUserApiKey(db, "user-a", "openrouter", "openrouter-user-key", {
      encryptionSecret,
    });
    const storage = {
      saveProjectImage: vi.fn().mockResolvedValue({
        storageKey: `projects/${project.id}/images/slide-1.png`,
        filePath: `/app/data/storage/projects/${project.id}/images/slide-1.png`,
        url: `/api/projects/${project.id}/images/slide-1.png`,
        contentType: "image/png",
      }),
    };
    const openRouterProvider = {
      generateImage: vi.fn().mockResolvedValue({
        bytes: Buffer.from("openrouter-png"),
        contentType: "image/png",
      }),
    };
    const selectedImage = await generateSlideImageForProject(db, {
      projectId: project.id,
      slideId: slide.id,
      userId: "user-a",
      encryptionSecret,
      storageProvider: storage,
      providers: { openrouter: openRouterProvider },
    });

    const deselected = setSlideImageGenerationSelectionForProject(
      db,
      project.id,
      "user-a",
      selectedImage.id,
      false,
    );

    expect(deselected).toMatchObject({
      id: selectedImage.id,
      selected: false,
    });
    expect(listLatestSuccessfulSlideImagesForProject(db, project.id, "user-a")).toEqual([]);
  });

  it("falls back to the direct model provider when OpenRouter image generation fails", async () => {
    const db = createTestDatabase();
    const project = createProjectForUser(db, "user-a", {
      name: "Deck",
      storyline: "story",
      defaultImageModel: "gpt-image-2",
    });
    const slide = createSlideForProject(db, project.id, "user-a", {
      title: "Slide 1",
      imagePrompt: "Generate a clean slide mockup",
    });
    saveUserApiKey(db, "user-a", "openrouter", "openrouter-user-key", {
      encryptionSecret,
    });
    saveUserApiKey(db, "user-a", "openai", "openai-user-key", {
      encryptionSecret,
    });
    const storage = {
      saveProjectImage: vi.fn().mockResolvedValue({
        storageKey: `projects/${project.id}/images/slide-1.png`,
        filePath: `/app/data/storage/projects/${project.id}/images/slide-1.png`,
        url: `/api/projects/${project.id}/images/slide-1.png`,
        contentType: "image/png",
      }),
    };
    const openRouterProvider = {
      generateImage: vi.fn().mockRejectedValue(new Error("OpenRouter is unavailable")),
    };
    const openaiProvider = {
      generateImage: vi.fn().mockResolvedValue({
        bytes: Buffer.from("openai-png"),
        contentType: "image/png",
      }),
    };

    const result = await generateSlideImageForProject(db, {
      projectId: project.id,
      slideId: slide.id,
      userId: "user-a",
      encryptionSecret,
      storageProvider: storage,
      providers: { openrouter: openRouterProvider, openai: openaiProvider },
    });

    expect(openRouterProvider.generateImage).toHaveBeenCalled();
    expect(openaiProvider.generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: "openai-user-key",
        model: "gpt-image-2",
      }),
    );
    expect(result.provider).toBe("openai");
    expect(
      db
        .select()
        .from(providerCallDebugLogs)
        .orderBy(providerCallDebugLogs.fallbackOrder)
        .all()
        .map((log) => ({
          provider: log.provider,
          status: log.status,
          error: log.normalizedError,
        })),
    ).toEqual([
      {
        provider: "openrouter",
        status: "failed",
        error: "openrouter image generation failed: OpenRouter is unavailable",
      },
      {
        provider: "openai",
        status: "succeeded",
        error: null,
      },
    ]);
  });

  it("records storage save failures as storage diagnostics before fallback", async () => {
    const db = createTestDatabase();
    const project = createProjectForUser(db, "user-a", {
      name: "Deck",
      storyline: "story",
      defaultImageModel: "gpt-image-2",
    });
    const slide = createSlideForProject(db, project.id, "user-a", {
      title: "Slide 1",
      imagePrompt: "Generate a clean slide mockup",
    });
    saveUserApiKey(db, "user-a", "openrouter", "openrouter-user-key", {
      encryptionSecret,
    });
    const storage = {
      saveProjectImage: vi.fn().mockRejectedValue(new Error("disk full")),
    };
    const openRouterProvider = {
      generateImage: vi.fn().mockResolvedValue({
        bytes: Buffer.from("openrouter-png"),
        contentType: "image/png",
      }),
    };

    await expect(
      generateSlideImageForProject(db, {
        projectId: project.id,
        slideId: slide.id,
        userId: "user-a",
        encryptionSecret,
        storageProvider: storage,
        providers: { openrouter: openRouterProvider },
      }),
    ).rejects.toMatchObject({
      provider: "openrouter",
    });

    const logs = db.select().from(providerCallDebugLogs).all();
    expect(logs[0]).toMatchObject({
      provider: "openrouter",
      status: "failed",
      responseSnapshot: {
        contentType: "image/png",
        hasBytes: true,
      },
      storageSummary: {
        status: "failed",
        error: "disk full",
      },
    });
  });
});
