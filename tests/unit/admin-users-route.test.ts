import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  db: { id: "db" },
  requireAdminUserId: vi.fn(),
  getDatabase: vi.fn(),
  createUser: vi.fn(),
  deactivateUser: vi.fn(),
  deleteUser: vi.fn(),
  grantAdminRole: vi.fn(),
  getUserById: vi.fn(),
  getUserByIdIncludingInactive: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  requireAdminUserId: routeMocks.requireAdminUserId,
}));

vi.mock("@/lib/db/client", () => ({
  getDatabase: routeMocks.getDatabase,
}));

vi.mock("@/lib/auth/users", () => ({
  createUser: routeMocks.createUser,
  deactivateUser: routeMocks.deactivateUser,
  deleteUser: routeMocks.deleteUser,
  grantAdminRole: routeMocks.grantAdminRole,
  getUserById: routeMocks.getUserById,
  getUserByIdIncludingInactive: routeMocks.getUserByIdIncludingInactive,
}));

import { POST as createMember } from "@/app/api/admin/users/route";
import { POST as updateMember } from "@/app/api/admin/users/[userId]/route";

describe("T009B admin users route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.requireAdminUserId.mockResolvedValue("admin-1");
    routeMocks.getDatabase.mockReturnValue(routeMocks.db);
    routeMocks.createUser.mockResolvedValue({
      id: "member-1",
      email: "new@example.com",
      role: "member",
    });
    routeMocks.getUserById.mockReturnValue({
      id: "member-1",
      email: "member@example.com",
      role: "member",
    });
    routeMocks.getUserByIdIncludingInactive.mockReturnValue({
      id: "member-1",
      email: "member@example.com",
      role: "member",
      disabledAt: null,
      deletedAt: null,
    });
    routeMocks.deactivateUser.mockReturnValue({
      id: "member-1",
      email: "member@example.com",
      disabledAt: "2026-06-04T00:00:00.000Z",
      deletedAt: null,
    });
    routeMocks.grantAdminRole.mockReturnValue({
      id: "member-1",
      email: "member@example.com",
      role: "admin",
    });
    routeMocks.deleteUser.mockReturnValue({
      id: "member-1",
      email: "member@example.com",
      deletedAt: "2026-06-04T00:00:00.000Z",
    });
  });

  it("creates a member account from the admin workflow", async () => {
    const form = new FormData();
    form.set("email", " New@Example.COM ");
    form.set("password", "temporary-pass");

    const response = await createMember(
      new Request("http://localhost/api/admin/users", {
        method: "POST",
        body: form,
      }),
    );

    expect(routeMocks.createUser).toHaveBeenCalledWith(routeMocks.db, {
      email: " New@Example.COM ",
      password: "temporary-pass",
      role: "member",
    });
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/settings?userId=member-1");
  });

  it("grants admin role from the admin workflow", async () => {
    const form = new FormData();
    form.set("intent", "grant_admin");

    const response = await updateMember(
      new Request("http://localhost/api/admin/users/member-1", {
        method: "POST",
        body: form,
      }),
      { params: Promise.resolve({ userId: "member-1" }) },
    );

    expect(routeMocks.grantAdminRole).toHaveBeenCalledWith(routeMocks.db, "member-1");
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/settings?userId=member-1");
  });

  it("deletes a member account from the admin workflow", async () => {
    const form = new FormData();
    form.set("intent", "delete");

    const response = await updateMember(
      new Request("http://localhost/api/admin/users/member-1", {
        method: "POST",
        body: form,
      }),
      { params: Promise.resolve({ userId: "member-1" }) },
    );

    expect(routeMocks.deleteUser).toHaveBeenCalledWith(routeMocks.db, "member-1");
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/settings");
  });

  it("rejects non-admin member creation", async () => {
    routeMocks.requireAdminUserId.mockRejectedValue(new Error("admin required"));

    const response = await createMember(
      new Request("http://localhost/api/admin/users", {
        method: "POST",
        body: new FormData(),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Admin access required.",
    });
  });

  it("deactivates an existing member without hard deleting owned data", async () => {
    const form = new FormData();
    form.set("intent", "deactivate");

    const response = await updateMember(
      new Request("http://localhost/api/admin/users/member-1", {
        method: "POST",
        body: form,
      }),
      { params: Promise.resolve({ userId: "member-1" }) },
    );

    expect(routeMocks.deactivateUser).toHaveBeenCalledWith(routeMocks.db, "member-1");
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/settings?userId=member-1");
  });

  it("does not allow an admin to deactivate their own account", async () => {
    const form = new FormData();
    form.set("intent", "deactivate");

    const response = await updateMember(
      new Request("http://localhost/api/admin/users/admin-1", {
        method: "POST",
        body: form,
      }),
      { params: Promise.resolve({ userId: "admin-1" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "You cannot deactivate your own admin account.",
    });
    expect(routeMocks.deactivateUser).not.toHaveBeenCalled();
  });

  it("does not allow deactivating another admin account", async () => {
    routeMocks.getUserByIdIncludingInactive.mockReturnValue({
      id: "admin-2",
      email: "other-admin@example.com",
      role: "admin",
      disabledAt: null,
      deletedAt: null,
    });
    const form = new FormData();
    form.set("intent", "deactivate");

    const response = await updateMember(
      new Request("http://localhost/api/admin/users/admin-2", {
        method: "POST",
        body: form,
      }),
      { params: Promise.resolve({ userId: "admin-2" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Admin accounts cannot be deactivated from this workflow.",
    });
    expect(routeMocks.deactivateUser).not.toHaveBeenCalled();
  });

  it("does not allow deleting another admin account", async () => {
    routeMocks.getUserByIdIncludingInactive.mockReturnValue({
      id: "admin-2",
      email: "other-admin@example.com",
      role: "admin",
      disabledAt: null,
      deletedAt: null,
    });
    const form = new FormData();
    form.set("intent", "delete");

    const response = await updateMember(
      new Request("http://localhost/api/admin/users/admin-2", {
        method: "POST",
        body: form,
      }),
      { params: Promise.resolve({ userId: "admin-2" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Admin accounts cannot be deleted from this workflow.",
    });
    expect(routeMocks.deleteUser).not.toHaveBeenCalled();
  });
});
