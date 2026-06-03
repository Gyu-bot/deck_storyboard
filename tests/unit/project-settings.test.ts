import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { createTestDatabase } from "@/lib/db/test-utils";
import { migrateDatabase } from "@/lib/db/migrate";
import {
  MAX_STORYLINE_CHARACTERS,
  resolveCommonStylePrompt,
  styleTemplates,
  validateStorylineLength,
} from "@/lib/projects/style-settings";
import {
  MAX_SLIDE_COUNT,
  detectStorylineSlideMarkers,
  parseSlideCountPreference,
} from "@/lib/projects/slide-count";
import { createProjectForUser } from "@/lib/repositories/projects";

describe("T011-T012 project creation settings", () => {
  it("validates storyline length and stores resolved style/image settings", () => {
    const db = createTestDatabase();
    expect(Object.keys(styleTemplates)).toEqual([
      "Executive Consulting",
      "Strategy Proposal",
      "Minimal White",
      "Dark Executive",
      "Technical Architecture",
    ]);
    expect(validateStorylineLength("x".repeat(MAX_STORYLINE_CHARACTERS + 1))).toMatch(
      /60000/,
    );

    const prompt = resolveCommonStylePrompt(
      "Technical Architecture",
      "Use blue callouts only when needed.",
    );
    const project = createProjectForUser(db, "user-a", {
      name: "Architecture deck",
      storyline: "Explain platform modernization",
      aspectRatio: "4:3",
      defaultImageModel: "nano-banana",
      styleTemplate: "Technical Architecture",
      customCommonStylePrompt: "Use blue callouts only when needed.",
      resolvedCommonPrompt: prompt,
    });

    expect(project.status).toBe("draft_input");
    expect(project.aspectRatio).toBe("4:3");
    expect(project.defaultImageModel).toBe("nano-banana");
    expect(project.resolvedCommonPrompt).toContain("Technical Architecture");
    expect(project.resolvedCommonPrompt).toContain("blue callouts");
    expect(project.slideCountMode).toBe("standard");
    expect(project.minSlideCount).toBe(9);
    expect(project.maxSlideCount).toBe(14);
  });

  it("keeps targetSlideCount compatibility as an exact custom range", () => {
    const db = createTestDatabase();
    const project = createProjectForUser(db, "user-a", {
      name: "Legacy deck",
      storyline: "Explain the migration plan",
      targetSlideCount: 6,
    });

    expect(project.targetSlideCount).toBe(6);
    expect(project.slideCountMode).toBe("custom");
    expect(project.minSlideCount).toBe(6);
    expect(project.maxSlideCount).toBe(6);
    expect(project.preferredSlideCount).toBe(6);
  });

  it("migrates existing target_slide_count rows into exact custom ranges", () => {
    const sqlite = new Database(":memory:");
    sqlite.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );
      CREATE TABLE projects (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        storyline TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft_input',
        target_slide_count INTEGER NOT NULL DEFAULT 8,
        improvement_suggestions_enabled INTEGER NOT NULL DEFAULT 1,
        aspect_ratio TEXT NOT NULL DEFAULT '16:9',
        default_image_model TEXT NOT NULL DEFAULT 'gpt-image-2',
        style_template TEXT NOT NULL DEFAULT 'Executive Consulting',
        custom_common_style_prompt TEXT NOT NULL DEFAULT '',
        resolved_common_prompt TEXT NOT NULL DEFAULT '',
        story_structure TEXT,
        improvement_suggestions TEXT,
        target_slide_count_rationale TEXT,
        generation_error TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );
      INSERT INTO users (id, email, password_hash, created_at, updated_at)
      VALUES ('user-a', 'user-a@example.com', 'hash', '2026-06-03T00:00:00.000Z', '2026-06-03T00:00:00.000Z');
      INSERT INTO projects (
        id,
        user_id,
        name,
        storyline,
        target_slide_count,
        created_at,
        updated_at
      )
      VALUES (
        'project-a',
        'user-a',
        'Legacy',
        'legacy storyline',
        7,
        '2026-06-03T00:00:00.000Z',
        '2026-06-03T00:00:00.000Z'
      );
    `);

    migrateDatabase(sqlite);

    const migrated = sqlite
      .prepare(
        "SELECT slide_count_mode, min_slide_count, max_slide_count, preferred_slide_count FROM projects WHERE id = ?",
      )
      .get("project-a") as {
      slide_count_mode: string;
      min_slide_count: number;
      max_slide_count: number;
      preferred_slide_count: number;
    };

    expect(migrated).toEqual({
      slide_count_mode: "custom",
      min_slide_count: 7,
      max_slide_count: 7,
      preferred_slide_count: 7,
    });
  });

  it("parses preset, auto, and custom slide count range preferences", () => {
    expect(
      parseSlideCountPreference({
        mode: "standard",
        storyline: "시장 진입 제안서",
      }),
    ).toMatchObject({
      mode: "standard",
      minSlideCount: 9,
      maxSlideCount: 14,
      preferredSlideCount: 12,
    });

    expect(
      parseSlideCountPreference({
        mode: "auto",
        storyline: "스토리 밀도에 맞춰 구성",
      }),
    ).toMatchObject({
      mode: "auto",
      minSlideCount: null,
      maxSlideCount: null,
      preferredSlideCount: null,
    });

    expect(
      parseSlideCountPreference({
        mode: "custom",
        customMin: "4",
        customMax: "7",
        storyline: "4장부터 7장 사이의 짧은 제안서",
      }),
    ).toMatchObject({
      mode: "custom",
      minSlideCount: 4,
      maxSlideCount: 7,
      preferredSlideCount: 6,
    });

    expect(() =>
      parseSlideCountPreference({
        mode: "custom",
        customMin: "0",
        customMax: "81",
        storyline: "invalid",
      }),
    ).toThrow(`1-${MAX_SLIDE_COUNT}`);
  });

  it("estimates explicit slide/page markers without an LLM call", () => {
    expect(detectStorylineSlideMarkers("총 12페이지로 정리해주세요.")).toMatchObject({
      estimatedCount: 12,
      confidence: "medium",
    });
    expect(
      detectStorylineSlideMarkers(["Slide 01: Problem", "Slide 02: Plan", "Slide 03: Ask"].join("\n")),
    ).toMatchObject({
      estimatedCount: 3,
      confidence: "high",
    });
  });
});
