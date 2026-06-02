import { describe, expect, it } from "vitest";
import { createTestDatabase } from "@/lib/db/test-utils";
import {
  MAX_STORYLINE_CHARACTERS,
  resolveCommonStylePrompt,
  styleTemplates,
  validateStorylineLength,
} from "@/lib/projects/style-settings";
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
  });
});
