import { beforeEach, describe, expect, it, vi } from "vitest";

const sessionMocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getDatabase: vi.fn(),
  getUserById: vi.fn(),
  db: { id: "db" },
}));

vi.mock("next-auth", () => ({
  getServerSession: sessionMocks.getServerSession,
}));

vi.mock("@/lib/db/client", () => ({
  getDatabase: sessionMocks.getDatabase,
}));

vi.mock("@/lib/auth/users", () => ({
  getUserById: sessionMocks.getUserById,
}));

import { getCurrentUserId, requireCurrentUserId } from "@/lib/auth/session";

describe("active user session guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionMocks.getDatabase.mockReturnValue(sessionMocks.db);
  });

  it("treats a session for a deactivated user as unauthenticated", async () => {
    sessionMocks.getServerSession.mockResolvedValue({
      user: { id: "inactive-user" },
    });
    sessionMocks.getUserById.mockReturnValue(null);

    await expect(getCurrentUserId()).resolves.toBeNull();
    await expect(requireCurrentUserId()).rejects.toThrow(/authentication required/);
  });
});
