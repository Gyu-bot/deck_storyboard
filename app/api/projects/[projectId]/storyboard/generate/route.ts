import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/client";
import { requireCurrentUserId } from "@/lib/auth/session";
import { getDecryptedUserApiKey } from "@/lib/repositories/user-api-keys";
import { getProjectForUser } from "@/lib/repositories/projects";
import { createOpenRouterProvider } from "@/lib/ai/openrouter";
import {
  analyzeStoryStructure,
  createSlideBreakdown,
} from "@/lib/storyboard/generation";

export const runtime = "nodejs";

function deterministicStoryboard(project: NonNullable<ReturnType<typeof getProjectForUser>>) {
  const slideCount = Math.max(1, project.targetSlideCount);
  const sectionCount = Math.min(3, slideCount);
  const sections = Array.from({ length: sectionCount }, (_, index) => ({
    id: `section-${index + 1}`,
    title: ["Context", "Strategy", "Execution"][index] ?? `Section ${index + 1}`,
    role: ["Set up the situation", "Frame the recommendation", "Show the path"][index] ?? "Support the story",
    coreMessage: `${project.name} ${index + 1}`,
    sourceSummary: project.storyline.slice(0, 240),
    suggestedSlideCount: Math.ceil(slideCount / sectionCount),
  }));
  return {
    documentPurpose: "Storyboard a consulting deck",
    overallThesis: project.storyline.slice(0, 160) || project.name,
    sections,
    improvementSuggestions: project.improvementSuggestionsEnabled
      ? [
          {
            id: "suggestion-1",
            title: "Sharpen executive thesis",
            rationale: "Make the recommendation explicit before detailed evidence.",
          },
        ]
      : undefined,
    targetSlideCountRationale: `Generated ${slideCount} slides to match the requested target.`,
    slides: Array.from({ length: slideCount }, (_, index) => {
      const section = sections[index % sections.length] ?? sections[0]!;
      return {
        sectionId: section.id,
        sectionTitle: section.title,
        title: `${section.title} slide ${index + 1}`,
        coreMessage: section.coreMessage,
        contentPoints: [
          "Key implication from the storyline",
          "Evidence or decision point to validate",
        ],
        visualDirection: "Consulting-style layout with a strong headline and one primary visual.",
        imagePrompt: `${project.resolvedCommonPrompt}\nCreate a ${project.aspectRatio} executive reference image for ${section.title}.`,
        slideRole: section.role,
      };
    }),
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const userId = await requireCurrentUserId();
  const db = getDatabase();
  const project = getProjectForUser(db, projectId, userId);
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  const apiKey = getDecryptedUserApiKey(db, userId, "openrouter");
  if (!apiKey) {
    return NextResponse.json({ error: "OpenRouter key is required." }, { status: 400 });
  }
  const provider = createOpenRouterProvider({
    apiKey,
    fetcher: async () => deterministicStoryboard(project),
  });
  const structure = await analyzeStoryStructure(db, projectId, userId, provider);
  await createSlideBreakdown(db, projectId, userId, provider, structure);
  return NextResponse.redirect(new URL(`/projects/${projectId}`, request.url), 303);
}
