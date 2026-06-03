import type { createTestDatabase } from "@/lib/db/test-utils";
import type { OpenRouterProvider, StoryboardResponse } from "@/lib/ai/openrouter";
import {
  createSlideForProject,
  getProjectForUser,
  updateProjectForUser,
} from "@/lib/repositories/projects";
import type { SlideCountMode } from "@/lib/projects/slide-count";

type Db = ReturnType<typeof createTestDatabase>;

function projectSlideCountPreference(project: {
  slideCountMode: SlideCountMode;
  minSlideCount: number | null;
  maxSlideCount: number | null;
  preferredSlideCount: number | null;
}) {
  return {
    mode: project.slideCountMode,
    minSlideCount: project.minSlideCount,
    maxSlideCount: project.maxSlideCount,
    preferredSlideCount: project.preferredSlideCount,
  };
}

function rangeMismatchRationale(
  project: {
    slideCountMode: SlideCountMode;
    minSlideCount: number | null;
    maxSlideCount: number | null;
  },
  generatedCount: number,
) {
  if (
    project.slideCountMode === "auto" ||
    !project.minSlideCount ||
    !project.maxSlideCount ||
    (generatedCount >= project.minSlideCount &&
      generatedCount <= project.maxSlideCount)
  ) {
    return null;
  }

  return `생성된 ${generatedCount}장이 선택한 ${project.minSlideCount}-${project.maxSlideCount}장 범위와 다릅니다. 스토리라인 구조와 밀도에 맞춘 결과인지 검토하세요.`;
}

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
      slideCountPreference: projectSlideCountPreference(project),
      includeSuggestions: project.improvementSuggestionsEnabled,
    });
    const generatedCount = structure.slides?.length ?? null;
    updateProjectForUser(db, projectId, userId, {
      status: "story_structure_ready",
      storyStructure: structure,
      improvementSuggestions: structure.improvementSuggestions ?? null,
      targetSlideCountRationale:
        structure.targetSlideCountRationale ??
        (generatedCount
          ? rangeMismatchRationale(project, generatedCount) ??
            project.targetSlideCountRationale
          : project.targetSlideCountRationale),
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
          slideCountPreference: projectSlideCountPreference(project),
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
