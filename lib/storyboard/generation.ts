import type { createTestDatabase } from "@/lib/db/test-utils";
import type { OpenRouterProvider, StoryboardResponse } from "@/lib/ai/openrouter";
import {
  createSlideForProject,
  getProjectForUser,
  updateProjectForUser,
} from "@/lib/repositories/projects";
import type { SlideCountMode } from "@/lib/projects/slide-count";
import { safeRecordProviderCallDebugLog } from "@/lib/provider-debug-logs/repository";

type Db = ReturnType<typeof createTestDatabase>;

function projectSlideCountPreference(project: {
  slideCountMode: SlideCountMode;
  minSlideCount: number | null;
  maxSlideCount: number | null;
  preferredSlideCount: number | null;
  storylineSlideMarkerCount: number | null;
  storylineSlideMarkerConfidence: "none" | "low" | "medium" | "high";
  targetSlideCountRationale: string | null;
}) {
  return {
    mode: project.slideCountMode,
    minSlideCount: project.minSlideCount,
    maxSlideCount: project.maxSlideCount,
    preferredSlideCount: project.preferredSlideCount,
    storylineSlideMarkerCount: project.storylineSlideMarkerCount,
    storylineSlideMarkerConfidence: project.storylineSlideMarkerConfidence,
    targetSlideCountRationale: project.targetSlideCountRationale,
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

function now() {
  return new Date().toISOString();
}

function elapsedMs(startedAt: string, completedAt: string) {
  return new Date(completedAt).getTime() - new Date(startedAt).getTime();
}

function providerDebugMetadata(provider: OpenRouterProvider) {
  return {
    provider: provider.debugMetadata?.provider ?? "openrouter",
    model:
      provider.debugMetadata?.model ??
      process.env.OPENROUTER_STORYBOARD_MODEL ??
      "openai/gpt-4o",
  };
}

function storyboardResponseSummary(response: StoryboardResponse | null) {
  if (!response) return null;
  return {
    sectionCount: response.sections.length,
    slideCount: response.slides?.length ?? 0,
    hasSlides: Boolean(response.slides?.length),
    improvementSuggestionCount: response.improvementSuggestions?.length ?? 0,
    hasTargetSlideCountRationale: Boolean(response.targetSlideCountRationale),
    languageSignals: {
      documentPurposePreview: response.documentPurpose.slice(0, 80),
      overallThesisPreview: response.overallThesis.slice(0, 80),
    },
  };
}

function recordStoryboardDebugLog(
  db: Db,
  input: {
    projectId: string;
    userId: string;
    operationType: "story_structure" | "slide_breakdown";
    provider: OpenRouterProvider;
    startedAt: string;
    completedAt: string;
    status: "succeeded" | "failed";
    requestSnapshot: unknown;
    response?: StoryboardResponse | null;
    error?: unknown;
  },
) {
  const metadata = providerDebugMetadata(input.provider);
  safeRecordProviderCallDebugLog(db, {
    projectId: input.projectId,
    userId: input.userId,
    operationType: input.operationType,
    provider: metadata.provider,
    model: metadata.model,
    attemptNumber: 1,
    fallbackOrder: null,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    durationMs: elapsedMs(input.startedAt, input.completedAt),
    status: input.status,
    normalizedError: input.error
      ? input.error instanceof Error
        ? input.error.message
        : String(input.error)
      : null,
    requestSnapshot: input.requestSnapshot,
    responseSnapshot: {
      ...storyboardResponseSummary(input.response ?? null),
      diagnostics: {
        schemaValidation: input.status === "failed" ? "failed" : "passed",
        missingUsageMetadata: true,
      },
    },
  });
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
    const requestSnapshot = {
      task: "story_structure",
      storyline: project.storyline,
      slideCountPolicy: projectSlideCountPreference(project),
      includeSuggestions: project.improvementSuggestionsEnabled,
    };
    const startedAt = now();
    const structure = await provider.generateStoryboard({
      task: "story_structure",
      storyline: project.storyline,
      slideCountPolicy: projectSlideCountPreference(project),
      includeSuggestions: project.improvementSuggestionsEnabled,
    });
    const completedAt = now();
    recordStoryboardDebugLog(db, {
      projectId,
      userId,
      operationType: "story_structure",
      provider,
      startedAt,
      completedAt,
      status: "succeeded",
      requestSnapshot,
      response: structure,
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
    recordStoryboardDebugLog(db, {
      projectId,
      userId,
      operationType: "story_structure",
      provider,
      startedAt: now(),
      completedAt: now(),
      status: "failed",
      requestSnapshot: {
        task: "story_structure",
        storyline: project.storyline,
        slideCountPolicy: projectSlideCountPreference(project),
        includeSuggestions: project.improvementSuggestionsEnabled,
      },
      error,
    });
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
    let breakdownResponse = structure;
    if (!structure.slides) {
      const requestSnapshot = {
        task: "slide_breakdown",
        storyline: project.storyline,
        slideCountPolicy: projectSlideCountPreference(project),
        includeSuggestions: project.improvementSuggestionsEnabled,
        previousStructure: structure,
      };
      const startedAt = now();
      breakdownResponse = await provider.generateStoryboard({
          task: "slide_breakdown",
          storyline: project.storyline,
          slideCountPolicy: projectSlideCountPreference(project),
          includeSuggestions: project.improvementSuggestionsEnabled,
          previousStructure: structure,
        });
      const completedAt = now();
      recordStoryboardDebugLog(db, {
        projectId,
        userId,
        operationType: "slide_breakdown",
        provider,
        startedAt,
        completedAt,
        status: "succeeded",
        requestSnapshot,
        response: breakdownResponse,
      });
    }
    const breakdown = breakdownResponse.slides ?? [];

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
      targetSlideCountRationale:
        breakdownResponse.targetSlideCountRationale ??
        (breakdown.length > 0
          ? rangeMismatchRationale(project, breakdown.length)
          : null) ??
        project.targetSlideCountRationale,
      generationError: null,
    });
    return generated;
  } catch (error) {
    recordStoryboardDebugLog(db, {
      projectId,
      userId,
      operationType: "slide_breakdown",
      provider,
      startedAt: now(),
      completedAt: now(),
      status: "failed",
      requestSnapshot: {
        task: "slide_breakdown",
        storyline: project.storyline,
        slideCountPolicy: projectSlideCountPreference(project),
        includeSuggestions: project.improvementSuggestionsEnabled,
        previousStructure: structure,
      },
      error,
    });
    updateProjectForUser(db, projectId, userId, {
      status: "storyboard_generation_failed",
      generationError: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
