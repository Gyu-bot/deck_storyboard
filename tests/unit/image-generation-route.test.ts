import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  db: { id: "db" },
  requireCurrentUserId: vi.fn(),
  getDatabase: vi.fn(),
  getSlidesForProject: vi.fn(),
  setSlideImageGenerationSelectionForProject: vi.fn(),
  generateSlideImageForProject: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  requireCurrentUserId: routeMocks.requireCurrentUserId,
}));

vi.mock("@/lib/db/client", () => ({
  getDatabase: routeMocks.getDatabase,
}));

vi.mock("@/lib/repositories/projects", () => ({
  getSlidesForProject: routeMocks.getSlidesForProject,
  setSlideImageGenerationSelectionForProject: routeMocks.setSlideImageGenerationSelectionForProject,
}));

vi.mock("@/lib/images/generation", () => ({
  generateSlideImageForProject: routeMocks.generateSlideImageForProject,
}));

import { POST } from "@/app/api/projects/[projectId]/images/generate/route";
import { PATCH } from "@/app/api/projects/[projectId]/images/[fileName]/route";

describe("T021-T022 project image generation route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.requireCurrentUserId.mockResolvedValue("user-a");
    routeMocks.getDatabase.mockReturnValue(routeMocks.db);
    routeMocks.generateSlideImageForProject.mockImplementation(
      (_db: unknown, input: { slideId: string }) => ({
        slideId: input.slideId,
        imageUrl: `/api/projects/project-1/images/${input.slideId}.png`,
        provider: "openrouter",
        model: "gpt-image-2",
        status: "succeeded",
      }),
    );
  });

  it("generates mockups for every slide in the project", async () => {
    routeMocks.getSlidesForProject.mockReturnValue([
      { id: "slide-a" },
      { id: "slide-b" },
    ]);

    const response = await POST(new Request("http://localhost/api"), {
      params: Promise.resolve({ projectId: "project-1" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      generated: 2,
      failed: 0,
      images: [
        {
          slideId: "slide-a",
          imageUrl: "/api/projects/project-1/images/slide-a.png",
          provider: "openrouter",
        },
        {
          slideId: "slide-b",
          imageUrl: "/api/projects/project-1/images/slide-b.png",
          provider: "openrouter",
        },
      ],
    });
    expect(routeMocks.generateSlideImageForProject).toHaveBeenCalledTimes(2);
    expect(routeMocks.generateSlideImageForProject).toHaveBeenCalledWith(
      routeMocks.db,
      expect.objectContaining({
        projectId: "project-1",
        slideId: "slide-a",
        userId: "user-a",
      }),
    );
    expect(routeMocks.generateSlideImageForProject).toHaveBeenCalledWith(
      routeMocks.db,
      expect.objectContaining({
        projectId: "project-1",
        slideId: "slide-b",
        userId: "user-a",
      }),
    );
  });

  it("generates a mockup for only the requested slide id", async () => {
    routeMocks.getSlidesForProject.mockReturnValue([
      { id: "slide-a" },
      { id: "slide-b" },
    ]);
    const form = new FormData();
    form.set("slideId", "slide-b");

    const response = await POST(
      new Request("http://localhost/api", {
        method: "POST",
        body: form,
      }),
      {
        params: Promise.resolve({ projectId: "project-1" }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      generated: 1,
      failed: 0,
      images: [
        {
          slideId: "slide-b",
          imageUrl: "/api/projects/project-1/images/slide-b.png",
          provider: "openrouter",
        },
      ],
    });
    expect(routeMocks.generateSlideImageForProject).toHaveBeenCalledTimes(1);
    expect(routeMocks.generateSlideImageForProject).toHaveBeenCalledWith(
      routeMocks.db,
      expect.objectContaining({
        projectId: "project-1",
        slideId: "slide-b",
        userId: "user-a",
      }),
    );
  });

  it("returns a member-specific admin assignment message when a provider key is missing", async () => {
    routeMocks.getSlidesForProject.mockReturnValue([{ id: "slide-a" }]);
    routeMocks.generateSlideImageForProject.mockRejectedValue({
      code: "provider_key_missing",
      provider: "openai",
    });

    const response = await POST(new Request("http://localhost/api"), {
      params: Promise.resolve({ projectId: "project-1" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error:
        "OpenAI API key가 없습니다. 관리자 화면에서 해당 회원에게 provider key를 할당한 뒤 다시 시도하세요.",
      generated: 0,
      failed: 1,
    });
  });

  it("preserves multi-provider missing-key messages from the image orchestrator", async () => {
    routeMocks.getSlidesForProject.mockReturnValue([{ id: "slide-a" }]);
    routeMocks.generateSlideImageForProject.mockRejectedValue({
      code: "provider_key_missing",
      provider: "openrouter",
      message:
        "OpenRouter 또는 OpenAI API key가 없습니다. 관리자 화면에서 해당 회원에게 provider key를 할당한 뒤 다시 시도하세요.",
    });

    const response = await POST(new Request("http://localhost/api"), {
      params: Promise.resolve({ projectId: "project-1" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error:
        "OpenRouter 또는 OpenAI API key가 없습니다. 관리자 화면에서 해당 회원에게 provider key를 할당한 뒤 다시 시도하세요.",
      generated: 0,
      failed: 1,
    });
  });
});

describe("T023 selected image route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.requireCurrentUserId.mockResolvedValue("user-a");
    routeMocks.getDatabase.mockReturnValue(routeMocks.db);
  });

  it("selects a completed previous slide image for the current project user", async () => {
    routeMocks.setSlideImageGenerationSelectionForProject.mockReturnValue({
      id: "image-2",
      slideId: "slide-a",
      imageUrl: "/api/projects/project-1/images/slide-a-image-2.png",
      provider: "openrouter",
      model: "gpt-image-2",
      aspectRatio: "16:9",
      status: "succeeded",
      selected: true,
      errorMessage: null,
      createdAt: "2026-06-04T09:30:00.000Z",
      updatedAt: "2026-06-04T09:30:00.000Z",
    });

    const response = await PATCH(new Request("http://localhost/api"), {
      params: Promise.resolve({ projectId: "project-1", fileName: "image-2" }),
    });

    expect(response.status).toBe(200);
    expect(routeMocks.setSlideImageGenerationSelectionForProject).toHaveBeenCalledWith(
      routeMocks.db,
      "project-1",
      "user-a",
      "image-2",
      true,
    );
    await expect(response.json()).resolves.toMatchObject({
      id: "image-2",
      selected: true,
      imageUrl: "/api/projects/project-1/images/slide-a-image-2.png",
    });
  });

  it("deselects the currently selected slide image when requested", async () => {
    routeMocks.setSlideImageGenerationSelectionForProject.mockReturnValue({
      id: "image-2",
      slideId: "slide-a",
      imageUrl: "/api/projects/project-1/images/slide-a-image-2.png",
      provider: "openrouter",
      model: "gpt-image-2",
      aspectRatio: "16:9",
      status: "succeeded",
      selected: false,
      errorMessage: null,
      createdAt: "2026-06-04T09:30:00.000Z",
      updatedAt: "2026-06-04T09:35:00.000Z",
    });

    const response = await PATCH(
      new Request("http://localhost/api", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected: false }),
      }),
      {
        params: Promise.resolve({ projectId: "project-1", fileName: "image-2" }),
      },
    );

    expect(response.status).toBe(200);
    expect(routeMocks.setSlideImageGenerationSelectionForProject).toHaveBeenCalledWith(
      routeMocks.db,
      "project-1",
      "user-a",
      "image-2",
      false,
    );
    await expect(response.json()).resolves.toMatchObject({
      id: "image-2",
      selected: false,
    });
  });
});
