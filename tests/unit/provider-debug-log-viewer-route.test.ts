import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  db: { id: "db" },
  requireCurrentUserId: vi.fn(),
  getCurrentUserRole: vi.fn(),
  getDatabase: vi.fn(),
  listProviderCallDebugLogs: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  requireCurrentUserId: routeMocks.requireCurrentUserId,
  getCurrentUserRole: routeMocks.getCurrentUserRole,
}));

vi.mock("@/lib/db/client", () => ({
  getDatabase: routeMocks.getDatabase,
}));

vi.mock("@/lib/provider-debug-logs/repository", () => ({
  listProviderCallDebugLogs: routeMocks.listProviderCallDebugLogs,
}));

import { GET } from "@/app/api/provider-debug-logs/route";

describe("T027C provider debug log viewer route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.requireCurrentUserId.mockResolvedValue("user-a");
    routeMocks.getCurrentUserRole.mockResolvedValue("member");
    routeMocks.getDatabase.mockReturnValue(routeMocks.db);
    routeMocks.listProviderCallDebugLogs.mockReturnValue([
      {
        id: "log-1",
        projectId: "project-1",
        slideId: "slide-1",
        operationType: "single_image_generation",
        provider: "openrouter",
        model: "gpt-image-2",
        status: "succeeded",
      },
    ]);
  });

  it("passes filter params with member ownership context", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/provider-debug-logs?projectId=project-1&slideId=slide-1&operationType=single_image_generation&provider=openrouter&status=succeeded&createdAfter=2026-06-05T00:00:00.000Z&createdBefore=2026-06-06T00:00:00.000Z",
      ),
    );

    expect(response.status).toBe(200);
    expect(routeMocks.listProviderCallDebugLogs).toHaveBeenCalledWith(
      routeMocks.db,
      expect.objectContaining({
        viewerUserId: "user-a",
        viewerRole: "member",
        projectId: "project-1",
        slideId: "slide-1",
        operationType: "single_image_generation",
        provider: "openrouter",
        status: "succeeded",
        createdAfter: "2026-06-05T00:00:00.000Z",
        createdBefore: "2026-06-06T00:00:00.000Z",
      }),
    );
    await expect(response.json()).resolves.toMatchObject({
      logs: [
        {
          id: "log-1",
          projectId: "project-1",
        },
      ],
    });
  });
});
