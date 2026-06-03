import { describe, expect, it } from "vitest";
import { createTestDatabase } from "@/lib/db/test-utils";
import {
  createUser,
  getUserById,
  listUsers,
  seedDevelopmentUsers,
  verifyUserPassword,
} from "@/lib/auth/users";
import {
  deleteUserApiKey,
  getUserApiKeyPresence,
  saveUserApiKey,
} from "@/lib/repositories/user-api-keys";

describe("T006 credentials auth", () => {
  it("stores hashed passwords and verifies login credentials", async () => {
    const db = createTestDatabase();
    const user = await createUser(db, {
      email: "owner@example.com",
      password: "correct-horse-battery",
    });

    expect(user.passwordHash).not.toContain("correct-horse-battery");
    await expect(
      createUser(db, {
        email: "owner@example.com",
        password: "different",
      }),
    ).rejects.toThrow(/already exists/);
    await expect(
      verifyUserPassword(db, "owner@example.com", "wrong"),
    ).resolves.toBeNull();
    await expect(
      verifyUserPassword(db, "owner@example.com", "correct-horse-battery"),
    ).resolves.toMatchObject({ id: user.id, email: "owner@example.com" });
  });

  it("seeds local development test and admin accounts with short aliases", async () => {
    const db = createTestDatabase();

    await seedDevelopmentUsers(db);
    await seedDevelopmentUsers(db);

    await expect(verifyUserPassword(db, "test", "test")).resolves.toMatchObject({
      email: "test@example.local",
    });
    await expect(verifyUserPassword(db, "admin", "admin")).resolves.toMatchObject({
      email: "admin@example.local",
      role: "admin",
    });
  });

  it("repairs the local development admin role when the seeded user already exists", async () => {
    const db = createTestDatabase();

    await createUser(db, {
      email: "admin@example.local",
      password: "admin",
    });
    expect(await verifyUserPassword(db, "admin", "admin")).toMatchObject({
      role: "member",
    });

    seedDevelopmentUsers(db);

    await expect(verifyUserPassword(db, "admin", "admin")).resolves.toMatchObject({
      email: "admin@example.local",
      role: "admin",
    });
  });
});

describe("T008-T009C user API key management", () => {
  it("creates members by default and supports admin role lookup for access control", async () => {
    const db = createTestDatabase();
    const member = await createUser(db, {
      email: "member@example.com",
      password: "correct-horse-battery",
    });
    const admin = await createUser(db, {
      email: "admin@example.com",
      password: "correct-horse-battery",
      role: "admin",
    });

    expect(member.role).toBe("member");
    expect(getUserById(db, member.id)).toMatchObject({ role: "member" });
    expect(getUserById(db, admin.id)).toMatchObject({ role: "admin" });
    expect(listUsers(db).map((user) => user.email)).toEqual([
      "admin@example.com",
      "member@example.com",
    ]);
  });

  it("stores account-level provider keys encrypted, reports only masked presence, and deletes keys", async () => {
    const db = createTestDatabase();
    const user = await createUser(db, {
      email: "owner@example.com",
      password: "correct-horse-battery",
    });

    const saved = saveUserApiKey(db, user.id, "openrouter", "sk-openrouter-secret", {
      encryptionSecret: "0123456789abcdef0123456789abcdef",
    });
    expect(saved.ciphertext).not.toContain("sk-openrouter-secret");
    expect(getUserApiKeyPresence(db, user.id)).toEqual({
      openrouter: "sk-o...cret",
      openai: null,
      anthropic: null,
      gemini: null,
    });

    saveUserApiKey(db, user.id, "openai", "sk-openai-secret", {
      encryptionSecret: "0123456789abcdef0123456789abcdef",
    });
    saveUserApiKey(db, user.id, "anthropic", "sk-ant-secret", {
      encryptionSecret: "0123456789abcdef0123456789abcdef",
    });
    saveUserApiKey(db, user.id, "gemini", "gemini-secret", {
      encryptionSecret: "0123456789abcdef0123456789abcdef",
    });
    expect(getUserApiKeyPresence(db, user.id)).toMatchObject({
      openai: "sk-o...cret",
      anthropic: "sk-a...cret",
      gemini: "gemi...cret",
    });

    deleteUserApiKey(db, user.id, "openrouter");
    expect(getUserApiKeyPresence(db, user.id).openrouter).toBeNull();
  });
});
