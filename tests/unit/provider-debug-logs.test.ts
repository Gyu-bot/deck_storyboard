import { describe, expect, it, vi } from "vitest";

import { projects, slides, users } from "@/lib/db/schema";
import { createTestDatabase } from "@/lib/db/test-utils";
import {
  createProjectForUser,
  createSlideForProject,
  ensureUser,
} from "@/lib/repositories/projects";
import {
  listProviderCallDebugLogs,
  safeRecordProviderCallDebugLog,
} from "@/lib/provider-debug-logs/repository";
import { buildRedactedSnapshot } from "@/lib/provider-debug-logs/redaction";

describe("T027C provider debug log redaction", () => {
  it("redacts secrets, removes binary bytes, and records truncation metadata", () => {
    const snapshot = buildRedactedSnapshot(
      {
        headers: {
          Authorization: "Bearer sk-secret-token",
          "x-goog-api-key": "gemini-secret",
        },
        prompt: "A".repeat(1_500),
        apiKey: "sk-should-not-appear",
        bytes: Buffer.from("raw-image"),
      },
      { maxStringLength: 64, maxSerializedLength: 500 },
    );

    expect(JSON.stringify(snapshot.value)).not.toContain("sk-secret-token");
    expect(JSON.stringify(snapshot.value)).not.toContain("gemini-secret");
    expect(JSON.stringify(snapshot.value)).not.toContain("sk-should-not-appear");
    expect(JSON.stringify(snapshot.value)).not.toContain("raw-image");
    expect(snapshot.value).toMatchObject({
      headers: {
        Authorization: "[redacted]",
        "x-goog-api-key": "[redacted]",
      },
      apiKey: "[redacted]",
      bytes: "[binary omitted]",
    });
    expect(snapshot.metadata.truncated).toBe(true);
    expect(snapshot.metadata.omittedBinaryFields).toContain("bytes");
  });

  it("stores only bounded previews for prompt-like sensitive strings", () => {
    const snapshot = buildRedactedSnapshot({
      storyline: "Short but confidential storyline",
      prompt: "Short but confidential image prompt",
      previousStructure: {
        overallThesis: "Sensitive thesis",
      },
      safeSummary: "diagnostic summary",
    });

    expect(snapshot.value).toMatchObject({
      storyline: {
        preview: "Short but confidential storyline",
        length: 32,
        truncated: false,
      },
      prompt: {
        preview: "Short but confidential image prompt",
        length: 35,
        truncated: false,
      },
      previousStructure: {
        summary: "[structured payload preview omitted]",
      },
      safeSummary: "diagnostic summary",
    });
  });

  it("keeps non-binary metadata fields while omitting explicit inline image data", () => {
    const snapshot = buildRedactedSnapshot({
      usageMetadata: {
        promptTokenCount: 10,
        candidatesTokenCount: 20,
      },
      inlineData: {
        mimeType: "image/png",
        data: "base64-image-payload",
      },
    });

    expect(snapshot.value).toMatchObject({
      usageMetadata: {
        promptTokenCount: 10,
        candidatesTokenCount: 20,
      },
      inlineData: "[binary omitted]",
    });
    expect(snapshot.metadata.omittedBinaryFields).toContain("inlineData");
  });
});

describe("T027C provider debug log repository", () => {
  it("filters member-visible logs to owned active projects and allows admins to inspect all logs", () => {
    const db = createTestDatabase();
    const projectA = createProjectForUser(db, "user-a", {
      name: "Owned deck",
      storyline: "story",
    });
    const slideA = createSlideForProject(db, projectA.id, "user-a", {
      title: "Slide A",
    });
    const projectB = createProjectForUser(db, "user-b", {
      name: "Other deck",
      storyline: "story",
    });
    ensureUser(db, "admin-a", "admin@example.local");
    db.update(users).set({ role: "admin" }).run();

    safeRecordProviderCallDebugLog(db, {
      projectId: projectA.id,
      slideId: slideA.id,
      userId: "user-a",
      operationType: "single_image_generation",
      provider: "openrouter",
      model: "gpt-image-2",
      attemptNumber: 1,
      fallbackOrder: 1,
      startedAt: "2026-06-05T01:00:00.000Z",
      completedAt: "2026-06-05T01:00:01.000Z",
      durationMs: 1000,
      status: "succeeded",
      requestSnapshot: { prompt: "Generate a mockup" },
      responseSnapshot: { contentType: "image/png" },
      storageSummary: { storageKey: "projects/a/image.png" },
    });
    safeRecordProviderCallDebugLog(db, {
      projectId: projectB.id,
      userId: "user-b",
      operationType: "story_structure",
      provider: "openrouter",
      model: "openai/gpt-4o",
      attemptNumber: 1,
      fallbackOrder: null,
      startedAt: "2026-06-05T02:00:00.000Z",
      completedAt: "2026-06-05T02:00:01.000Z",
      durationMs: 1000,
      status: "failed",
      normalizedError: "schema validation failed",
    });

    expect(
      listProviderCallDebugLogs(db, {
        viewerUserId: "user-a",
        viewerRole: "member",
      }).map((log) => log.projectId),
    ).toEqual([projectA.id]);
    expect(
      listProviderCallDebugLogs(db, {
        viewerUserId: "admin-a",
        viewerRole: "admin",
        status: "failed",
      }).map((log) => log.projectId),
    ).toEqual([projectB.id]);

    db.update(slides).set({ deletedAt: "2026-06-05T03:00:00.000Z" }).run();
    expect(
      listProviderCallDebugLogs(db, {
        viewerUserId: "admin-a",
        viewerRole: "admin",
      }).map((log) => log.projectId),
    ).toEqual([projectB.id]);

    db.update(projects).set({ deletedAt: "2026-06-05T03:00:00.000Z" }).run();
    expect(
      listProviderCallDebugLogs(db, {
        viewerUserId: "admin-a",
        viewerRole: "admin",
      }),
    ).toEqual([]);
  });

  it("does not throw when debug log persistence fails", () => {
    const failingDb = {
      insert: vi.fn(() => {
        throw new Error("sqlite is locked");
      }),
    } as never;
    const onPersistenceError = vi.fn();

    expect(() =>
      safeRecordProviderCallDebugLog(
        failingDb,
        {
          projectId: "project-1",
          userId: "user-a",
          operationType: "story_structure",
          provider: "openrouter",
          model: "openai/gpt-4o",
          attemptNumber: 1,
          fallbackOrder: null,
          startedAt: "2026-06-05T01:00:00.000Z",
          completedAt: "2026-06-05T01:00:01.000Z",
          durationMs: 1000,
          status: "succeeded",
        },
        { onPersistenceError },
      ),
    ).not.toThrow();
    expect(onPersistenceError).toHaveBeenCalledWith(expect.any(Error));
  });
});
