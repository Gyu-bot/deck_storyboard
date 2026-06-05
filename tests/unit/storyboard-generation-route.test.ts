import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  db: { id: "db" },
  requireCurrentUserId: vi.fn(),
  getDatabase: vi.fn(),
  getProjectForUser: vi.fn(),
  updateProjectForUser: vi.fn(),
  getDecryptedUserApiKey: vi.fn(),
  analyzeStoryStructure: vi.fn(),
  createSlideBreakdown: vi.fn(),
  cookies: vi.fn(),
  isStoryboardTestModeEnabled: vi.fn(),
  loadStoryboardSampleFixture: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: routeMocks.cookies,
}));

vi.mock("@/lib/auth/session", () => ({
  requireCurrentUserId: routeMocks.requireCurrentUserId,
}));

vi.mock("@/lib/db/client", () => ({
  getDatabase: routeMocks.getDatabase,
}));

vi.mock("@/lib/repositories/projects", () => ({
  getProjectForUser: routeMocks.getProjectForUser,
  updateProjectForUser: routeMocks.updateProjectForUser,
}));

vi.mock("@/lib/repositories/user-api-keys", () => ({
  getDecryptedUserApiKey: routeMocks.getDecryptedUserApiKey,
}));

vi.mock("@/lib/storyboard/generation", () => ({
  analyzeStoryStructure: routeMocks.analyzeStoryStructure,
  createSlideBreakdown: routeMocks.createSlideBreakdown,
}));

vi.mock("@/lib/storyboard/sample-fixture", () => ({
  STORYBOARD_TEST_MODE_COOKIE: "deck_storyboard_test_mode",
  isStoryboardTestModeEnabled: routeMocks.isStoryboardTestModeEnabled,
  loadStoryboardSampleFixture: routeMocks.loadStoryboardSampleFixture,
}));

import { POST } from "@/app/api/projects/[projectId]/storyboard/generate/route";

describe("T009C storyboard generation key errors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.requireCurrentUserId.mockResolvedValue("user-a");
    routeMocks.getDatabase.mockReturnValue(routeMocks.db);
    routeMocks.getProjectForUser.mockReturnValue({ id: "project-1" });
    routeMocks.updateProjectForUser.mockReturnValue({ id: "project-1" });
    routeMocks.cookies.mockResolvedValue({ get: () => undefined });
    routeMocks.isStoryboardTestModeEnabled.mockReturnValue(false);
    routeMocks.loadStoryboardSampleFixture.mockReturnValue(null);
    routeMocks.getDecryptedUserApiKey.mockReturnValue(null);
    routeMocks.analyzeStoryStructure.mockResolvedValue({
      documentPurpose: "투자 검토",
      overallThesis: "성장성과 리스크를 설명한다.",
      sections: [
        {
          id: "sec-1",
          title: "시장",
          role: "Context",
          coreMessage: "시장이 성장 중이다.",
          sourceSummary: "시장 자료",
          suggestedSlideCount: 1,
        },
      ],
    });
    routeMocks.createSlideBreakdown.mockResolvedValue([]);
  });

  it("redirects back to the project error state when the member has no supported storyboard provider key", async () => {
    const response = await POST(
      new Request("http://localhost/api/projects/project-1/storyboard/generate", {
        method: "POST",
      }),
      { params: Promise.resolve({ projectId: "project-1" }) },
    );

    expect(routeMocks.updateProjectForUser).toHaveBeenCalledWith(
      routeMocks.db,
      "project-1",
      "user-a",
      {
        status: "storyboard_generation_failed",
        generationError:
          "OpenRouter 또는 OpenAI API key가 없습니다. 관리자 화면에서 해당 회원에게 provider key를 할당한 뒤 다시 시도하세요.",
      },
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost/projects/project-1",
    );
  });

  it("falls back to the direct OpenAI storyboard provider when the member has no OpenRouter key", async () => {
    routeMocks.getDecryptedUserApiKey.mockImplementation(
      (_db: unknown, _userId: string, provider: string) =>
        provider === "openai" ? "sk-openai-user" : null,
    );

    const response = await POST(
      new Request("http://localhost/api/projects/project-1/storyboard/generate", {
        method: "POST",
      }),
      { params: Promise.resolve({ projectId: "project-1" }) },
    );

    expect(routeMocks.getDecryptedUserApiKey).toHaveBeenCalledWith(
      routeMocks.db,
      "user-a",
      "openrouter",
    );
    expect(routeMocks.getDecryptedUserApiKey).toHaveBeenCalledWith(
      routeMocks.db,
      "user-a",
      "openai",
    );
    expect(routeMocks.analyzeStoryStructure).toHaveBeenCalledWith(
      routeMocks.db,
      "project-1",
      "user-a",
      expect.objectContaining({
        debugMetadata: expect.objectContaining({ provider: "openai" }),
      }),
    );
    expect(routeMocks.updateProjectForUser).not.toHaveBeenCalledWith(
      routeMocks.db,
      "project-1",
      "user-a",
      expect.objectContaining({ status: "storyboard_generation_failed" }),
    );
    expect(response.status).toBe(303);
  });

  it("keeps using OpenRouter when both OpenRouter and OpenAI storyboard keys are assigned", async () => {
    routeMocks.getDecryptedUserApiKey.mockImplementation(
      (_db: unknown, _userId: string, provider: string) =>
        provider === "openrouter" ? "sk-openrouter-user" : "sk-openai-user",
    );

    const response = await POST(
      new Request("http://localhost/api/projects/project-1/storyboard/generate", {
        method: "POST",
      }),
      { params: Promise.resolve({ projectId: "project-1" }) },
    );

    expect(routeMocks.getDecryptedUserApiKey).toHaveBeenCalledWith(
      routeMocks.db,
      "user-a",
      "openrouter",
    );
    expect(routeMocks.getDecryptedUserApiKey).not.toHaveBeenCalledWith(
      routeMocks.db,
      "user-a",
      "openai",
    );
    expect(routeMocks.analyzeStoryStructure).toHaveBeenCalledWith(
      routeMocks.db,
      "project-1",
      "user-a",
      expect.objectContaining({
        debugMetadata: expect.objectContaining({ provider: "openrouter" }),
      }),
    );
    expect(response.status).toBe(303);
  });
});
