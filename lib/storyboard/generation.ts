import type { createTestDatabase } from "@/lib/db/test-utils";
import type { OpenRouterProvider, StoryboardResponse } from "@/lib/ai/openrouter";
import {
  createSlideForProject,
  getProjectForUser,
  updateProjectForUser,
} from "@/lib/repositories/projects";

type Db = ReturnType<typeof createTestDatabase>;

export async function analyzeStoryStructure(
  db: Db,
  projectId: string,
  userId: string,
  provider: OpenRouterProvider,
) {
  const project = getProjectForUser(db, projectId, userId);
  if (!project) throw new Error("project not found");
  try {
    updateProjectForUser(db, projectId, userId, {
      status: "storyboard_generating",
    });
    const structure = await provider.generateStoryboard({
      task: "story_structure",
      storyline: project.storyline,
      targetSlideCount: project.targetSlideCount,
      includeSuggestions: project.improvementSuggestionsEnabled,
    });
    updateProjectForUser(db, projectId, userId, {
      status: "story_structure_ready",
      storyStructure: structure,
      improvementSuggestions: structure.improvementSuggestions ?? null,
      targetSlideCountRationale:
        structure.targetSlideCountRationale ??
        (structure.slides && structure.slides.length !== project.targetSlideCount
          ? `Generated ${structure.slides.length} slides for requested ${project.targetSlideCount}.`
          : null),
      generationError: null,
    });
    return structure;
  } catch (error) {
    updateProjectForUser(db, projectId, userId, {
      status: "storyboard_generation_failed",
      generationError: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function createSlideBreakdown(
  db: Db,
  projectId: string,
  userId: string,
  provider: OpenRouterProvider,
  structure: StoryboardResponse,
) {
  const project = getProjectForUser(db, projectId, userId);
  if (!project) throw new Error("project not found");
  try {
    const breakdown =
      structure.slides ??
      (
        await provider.generateStoryboard({
          task: "slide_breakdown",
          storyline: project.storyline,
          targetSlideCount: project.targetSlideCount,
          includeSuggestions: project.improvementSuggestionsEnabled,
          previousStructure: structure,
        })
      ).slides ??
      [];

    const generated = breakdown.map((slide, index) =>
      createSlideForProject(db, projectId, userId, {
        sectionId: slide.sectionId,
        sectionTitle: slide.sectionTitle,
        position: index + 1,
        title: slide.title,
        coreMessage: slide.coreMessage,
        contentPoints: slide.contentPoints,
        visualDirection: slide.visualDirection,
        imagePrompt: slide.imagePrompt,
        slideRole: slide.slideRole,
      }),
    );
    updateProjectForUser(db, projectId, userId, {
      status: "storyboard_review",
      generationError: null,
    });
    return generated;
  } catch (error) {
    updateProjectForUser(db, projectId, userId, {
      status: "storyboard_generation_failed",
      generationError: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
