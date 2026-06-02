import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDatabase } from "@/lib/db/test-utils";
import { slideEditOperations, slides } from "@/lib/db/schema";
import {
  createProjectForUser,
  createSlideForProject,
  getSlidesForProject,
  insertBlankSlideForProject,
  reorderSlidesForProject,
  softDeleteSlideForProject,
  updateSlideFieldForProject,
} from "@/lib/repositories/projects";

describe("T017-T019 manual slide operations", () => {
  it("edits fields as userModified, recommends regeneration, reorders, inserts, deletes, and records history", () => {
    const db = createTestDatabase();
    const project = createProjectForUser(db, "user-a", {
      name: "Deck",
      storyline: "story",
      status: "storyboard_confirmed",
    });
    const first = createSlideForProject(db, project.id, "user-a", {
      title: "First",
      imageGenerationStatus: "generated",
    });
    const second = createSlideForProject(db, project.id, "user-a", {
      title: "Second",
    });

    const edited = updateSlideFieldForProject(
      db,
      project.id,
      "user-a",
      first.id,
      "imagePrompt",
      "New prompt",
    );
    expect(edited?.fieldEditState.imagePrompt).toBe("userModified");
    expect(edited?.imageGenerationStatus).toBe("regeneration_recommended");

    reorderSlidesForProject(db, project.id, "user-a", [second.id, first.id]);
    const blank = insertBlankSlideForProject(db, project.id, "user-a", 2);
    softDeleteSlideForProject(db, project.id, "user-a", first.id);

    expect(blank.imageGenerationStatus).toBe("not_generated");
    expect(getSlidesForProject(db, project.id, "user-a").map((slide) => slide.id)).toEqual([
      second.id,
      blank.id,
    ]);
    expect(db.select().from(slides).where(eq(slides.id, first.id)).get()?.deletedAt).not.toBeNull();
    expect(db.select().from(slideEditOperations).all().map((op) => op.operationType)).toEqual(
      expect.arrayContaining([
        "edit_field",
        "reorder",
        "insert_blank",
        "delete_slide",
      ]),
    );
  });
});
