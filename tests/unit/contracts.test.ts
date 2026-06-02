import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  projectStatusValues,
  slides,
  users,
  userApiKeys,
  projects,
  slideEditOperations,
  slideImageGenerations,
  imageGenerationBatches,
} from "@/lib/db/schema";
import { createTestDatabase } from "@/lib/db/test-utils";
import {
  decryptApiKey,
  encryptApiKey,
  requireApiKeyEncryptionSecret,
} from "@/lib/security/api-key-crypto";
import {
  createProjectForUser,
  createSlideForProject,
  getProjectForUser,
  getSlidesForProject,
  listProjectsForUser,
  softDeleteProjectForUser,
} from "@/lib/repositories/projects";
import {
  createOpenRouterProvider,
  storyboardResponseSchema,
} from "@/lib/ai/openrouter";
import { analyzeStoryStructure, createSlideBreakdown } from "@/lib/storyboard/generation";
import { LocalImageStorageProvider } from "@/lib/images/local-storage";

const tempRoots: string[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  for (const root of tempRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe("T004 database schema contracts", () => {
  it("defines all initial tables and required storyboard fields", () => {
    expect(users).toBeDefined();
    expect(userApiKeys).toBeDefined();
    expect(projects).toBeDefined();
    expect(slides).toBeDefined();
    expect(slideImageGenerations).toBeDefined();
    expect(imageGenerationBatches).toBeDefined();
    expect(slideEditOperations).toBeDefined();
    expect(projectStatusValues).toContain("storyboard_generation_failed");
    expect(Object.keys(slides)).toEqual(
      expect.arrayContaining([
        "sectionId",
        "sectionTitle",
        "fieldEditState",
        "imageGenerationStatus",
        "deletedAt",
      ]),
    );
  });
});

describe("T005 data access ownership", () => {
  it("filters projects and slides by owner and excludes soft deleted records", () => {
    const db = createTestDatabase();
    const owned = createProjectForUser(db, "user-a", {
      name: "Owned",
      storyline: "story",
    });
    const other = createProjectForUser(db, "user-b", {
      name: "Other",
      storyline: "story",
    });
    createSlideForProject(db, owned.id, "user-a", { title: "Visible" });
    createSlideForProject(db, other.id, "user-b", { title: "Hidden" });

    expect(getProjectForUser(db, owned.id, "user-a")?.name).toBe("Owned");
    expect(getProjectForUser(db, other.id, "user-a")).toBeNull();
    expect(getSlidesForProject(db, owned.id, "user-a")).toHaveLength(1);
    expect(getSlidesForProject(db, other.id, "user-a")).toHaveLength(0);

    softDeleteProjectForUser(db, owned.id, "user-a");
    expect(listProjectsForUser(db, "user-a")).toHaveLength(0);
  });
});

describe("T008 API key encryption", () => {
  it("round-trips encrypted API keys without exposing the full plaintext", () => {
    const secret = "0123456789abcdef0123456789abcdef";
    const encrypted = encryptApiKey("sk-live-secret-value", secret);

    expect(encrypted.ciphertext).not.toContain("sk-live-secret-value");
    expect(encrypted.maskedKey).toBe("sk-l...alue");
    expect(decryptApiKey(encrypted, secret)).toBe("sk-live-secret-value");
  });

  it("requires a production encryption secret before key storage", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("API_KEY_ENCRYPTION_SECRET", "");

    expect(() => requireApiKeyEncryptionSecret()).toThrow(
      /API_KEY_ENCRYPTION_SECRET/,
    );
  });
});

describe("T013-T015 storyboard generation contracts", () => {
  it("validates storyboard output, retries invalid provider output, and persists slides", async () => {
    const db = createTestDatabase();
    const project = createProjectForUser(db, "user-a", {
      name: "Deck",
      storyline: "A market entry proposal",
      targetSlideCount: 2,
      improvementSuggestionsEnabled: true,
    });
    const provider = createOpenRouterProvider({
      apiKey: "openrouter-key",
      fetcher: vi
        .fn()
        .mockResolvedValueOnce({ invalid: true })
        .mockResolvedValueOnce({
          documentPurpose: "Proposal",
          overallThesis: "Enter selectively",
          sections: [
            {
              id: "s1",
              title: "Market",
              role: "Context",
              coreMessage: "The market is attractive",
              sourceSummary: "User storyline",
              suggestedSlideCount: 2,
            },
          ],
          improvementSuggestions: [
            {
              id: "i1",
              title: "Clarify risks",
              rationale: "Risk story is thin",
            },
          ],
          targetSlideCountRationale: "Matches requested count",
          slides: [
            {
              sectionId: "s1",
              sectionTitle: "Market",
              title: "Market momentum",
              coreMessage: "Demand is rising",
              contentPoints: ["Demand", "Competition"],
              visualDirection: "2x2 chart",
              imagePrompt: "Executive chart",
              slideRole: "Evidence",
            },
            {
              sectionId: "s1",
              sectionTitle: "Market",
              title: "Entry thesis",
              coreMessage: "Select segment A",
              contentPoints: ["Segment", "Timing"],
              visualDirection: "Roadmap",
              imagePrompt: "Roadmap visual",
              slideRole: "Recommendation",
            },
          ],
        }),
    });

    const structure = await analyzeStoryStructure(db, project.id, "user-a", provider);
    const generatedSlides = await createSlideBreakdown(
      db,
      project.id,
      "user-a",
      provider,
      structure,
    );

    expect(storyboardResponseSchema.safeParse(structure).success).toBe(true);
    expect(structure.improvementSuggestions).toHaveLength(1);
    expect(generatedSlides).toHaveLength(2);
    expect(generatedSlides[0]?.fieldEditState).toMatchObject({
      title: "aiGenerated",
      imagePrompt: "aiGenerated",
    });
    expect(getProjectForUser(db, project.id, "user-a")?.status).toBe(
      "storyboard_review",
    );
  });
});

describe("T020 image storage provider", () => {
  it("stores images under /app/data/storage/projects/{projectId}/images and guards lookup by owner", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "deck-storage-"));
    tempRoots.push(root);
    const db = createTestDatabase();
    const project = createProjectForUser(db, "user-a", {
      name: "Deck",
      storyline: "story",
    });
    const storage = new LocalImageStorageProvider(root);

    const stored = await storage.saveProjectImage({
      projectId: project.id,
      ownerUserId: "user-a",
      fileName: "slide-1.png",
      contentType: "image/png",
      bytes: Buffer.from("png"),
    });

    expect(stored.filePath).toContain(
      `/app/data/storage/projects/${project.id}/images/`,
    );
    expect(await storage.readProjectImage(db, stored.storageKey, "user-a")).toEqual(
      Buffer.from("png"),
    );
    await expect(
      storage.readProjectImage(db, stored.storageKey, "user-b"),
    ).rejects.toThrow(/not found/);
  });
});
