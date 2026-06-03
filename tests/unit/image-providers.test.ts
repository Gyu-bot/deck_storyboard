import { describe, expect, it, vi } from "vitest";

import { slideImageGenerations } from "@/lib/db/schema";
import { createTestDatabase } from "@/lib/db/test-utils";
import {
  createProjectForUser,
  createSlideForProject,
  getSlidesForProject,
} from "@/lib/repositories/projects";
import { saveUserApiKey } from "@/lib/repositories/user-api-keys";
import {
  createOpenAIImagesProvider,
  normalizeImageProviderError,
} from "@/lib/images/openai";
import { createGeminiImageProvider } from "@/lib/images/gemini";
import { generateSlideImageForProject } from "@/lib/images/generation";

const encryptionSecret = "0123456789abcdef0123456789abcdef";

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
  it("returns a provider-key error when the selected model has no account-level user key", async () => {
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
      provider: "openai",
    });
  });

  it("generates one slide image, stores bytes locally, records provider metadata, and updates slide status", async () => {
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

    const result = await generateSlideImageForProject(db, {
      projectId: project.id,
      slideId: slide.id,
      userId: "user-a",
      encryptionSecret,
      storageProvider: storage,
      providers: { gemini: geminiProvider },
    });

    expect(geminiProvider.generateImage).toHaveBeenCalledWith({
      apiKey: "gemini-user-key",
      model: "nano-banana",
      aspectRatio: "4:3",
      prompt: expect.stringContaining("Generate a clean slide mockup"),
    });
    expect(geminiProvider.generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("Use the corporate blue visual system."),
      }),
    );
    expect(storage.saveProjectImage).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: project.id,
        ownerUserId: "user-a",
        fileName: `${slide.id}.png`,
        bytes: Buffer.from("gemini-png"),
      }),
    );
    expect(result.provider).toBe("gemini");
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
      provider: "gemini",
      model: "nano-banana",
      status: "succeeded",
      imageUrl: `/api/projects/${project.id}/images/slide-1.png`,
    });
  });
});
