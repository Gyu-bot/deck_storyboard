import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/client";
import { requireCurrentUserId } from "@/lib/auth/session";
import { getDecryptedUserApiKey } from "@/lib/repositories/user-api-keys";
import { getProjectForUser } from "@/lib/repositories/projects";
import { createOpenRouterProvider } from "@/lib/ai/openrouter";
import { loadStoryboardSampleFixture } from "@/lib/storyboard/sample-fixture";
import {
  analyzeStoryStructure,
  createSlideBreakdown,
} from "@/lib/storyboard/generation";
import { appUrl } from "@/lib/http/redirects";

export const runtime = "nodejs";

function deterministicStoryboard(project: NonNullable<ReturnType<typeof getProjectForUser>>) {
  const slideCount = Math.max(1, project.targetSlideCount);
  const sectionCount = Math.min(3, slideCount);
  const sections = Array.from({ length: sectionCount }, (_, index) => ({
    id: `section-${index + 1}`,
    title: ["맥락", "전략", "실행"][index] ?? `섹션 ${index + 1}`,
    role: ["상황과 문제를 정리", "권고 방향을 제시", "실행 경로를 구체화"][index] ?? "스토리 보강",
    coreMessage: `${project.name} 핵심 메시지 ${index + 1}`,
    sourceSummary: project.storyline.slice(0, 240),
    suggestedSlideCount: Math.ceil(slideCount / sectionCount),
  }));
  return {
    documentPurpose: "컨설팅 덱 스토리보드 작성",
    overallThesis: project.storyline.slice(0, 160) || project.name,
    sections,
    improvementSuggestions: project.improvementSuggestionsEnabled
      ? [
          {
            id: "suggestion-1",
            title: "핵심 권고를 더 앞에 배치",
            rationale: "상세 근거 전에 의사결정자가 기억해야 할 결론을 먼저 보여주면 검토 속도가 빨라집니다.",
          },
        ]
      : undefined,
    targetSlideCountRationale: `요청한 목표에 맞춰 ${slideCount}장의 슬라이드로 구성했습니다.`,
    slides: Array.from({ length: slideCount }, (_, index) => {
      const section = sections[index % sections.length] ?? sections[0]!;
      return {
        sectionId: section.id,
        sectionTitle: section.title,
        title: `${section.title} 슬라이드 ${index + 1}`,
        coreMessage: section.coreMessage,
        contentPoints: [
          "스토리라인에서 도출한 핵심 시사점",
          "검토가 필요한 근거 또는 의사결정 포인트",
        ],
        visualDirection: "강한 헤드라인과 하나의 핵심 시각 요소를 중심으로 구성한 컨설팅형 레이아웃",
        imagePrompt: `${project.resolvedCommonPrompt}\n${section.title} 내용을 표현하는 ${project.aspectRatio} 비율의 임원 보고용 레퍼런스 이미지를 생성하세요.`,
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
  const sampleStoryboard = loadStoryboardSampleFixture();
  const apiKey = sampleStoryboard
    ? "dummy-openrouter-key"
    : getDecryptedUserApiKey(db, userId, "openrouter");
  if (!apiKey) {
    return NextResponse.json({ error: "OpenRouter key is required." }, { status: 400 });
  }
  const provider = createOpenRouterProvider({
    apiKey,
    fetcher: async () => sampleStoryboard ?? deterministicStoryboard(project),
  });
  const structure = await analyzeStoryStructure(db, projectId, userId, provider);
  await createSlideBreakdown(db, projectId, userId, provider, structure);
  return NextResponse.redirect(appUrl(`/projects/${projectId}`, request), 303);
}
