import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  db: { id: "db" },
  requireCurrentUserId: vi.fn(),
  getDatabase: vi.fn(),
  getSlidesForProject: vi.fn(),
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
}));

vi.mock("@/lib/images/generation", () => ({
  generateSlideImageForProject: routeMocks.generateSlideImageForProject,
}));

import { POST } from "@/app/api/projects/[projectId]/images/generate/route";

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
});
