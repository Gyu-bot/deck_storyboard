import { describe, expect, it } from "vitest";
import { createTestDatabase } from "@/lib/db/test-utils";
import {
  createUser,
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
    });
  });
});

describe("T008-T009 user API key management", () => {
  it("stores provider keys encrypted, reports only masked presence, and deletes keys", async () => {
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
      nano_banana: null,
      openai_images: null,
    });

    deleteUserApiKey(db, user.id, "openrouter");
    expect(getUserApiKeyPresence(db, user.id).openrouter).toBeNull();
  });
});
