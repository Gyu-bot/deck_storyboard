import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  db: { id: "db" },
  requireCurrentUserId: vi.fn(),
  getDatabase: vi.fn(),
  getProjectForUser: vi.fn(),
  updateProjectForUser: vi.fn(),
  getDecryptedUserApiKey: vi.fn(),
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
  });

  it("redirects back to the project error state when the member has no OpenRouter key", async () => {
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
          "OpenRouter API key가 없습니다. 관리자 화면에서 해당 회원에게 provider key를 할당한 뒤 다시 시도하세요.",
      },
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost/projects/project-1",
    );
  });
});
