import Link from "next/link";
import { notFound } from "next/navigation";
import { StoryboardWorkspace } from "@/app/projects/[projectId]/storyboard-workspace";
import { Button } from "@/components/ui/button";
import { loadStoryboardSampleFixture } from "@/lib/storyboard/sample-fixture";

export const runtime = "nodejs";

export default function DevStoryboardSamplePage() {
  if (process.env.NODE_ENV === "production") notFound();

  const sample = loadStoryboardSampleFixture();
  if (!sample?.slides?.length) notFound();

  const now = new Date().toISOString();
  const project = {
    id: "dev-storyboard-sample",
    name: "RCA AX Readiness 샘플 스토리보드",
    status: "storyboard_review" as const,
    improvementSuggestions: sample.improvementSuggestions ?? null,
    targetSlideCountRationale: sample.targetSlideCountRationale ?? null,
    generationError: null,
  };
  const slides = sample.slides.map((slide, index) => ({
    id: `dev-sample-slide-${index + 1}`,
    projectId: project.id,
    sectionId: slide.sectionId,
    sectionTitle: slide.sectionTitle,
    position: index + 1,
    title: slide.title,
    coreMessage: slide.coreMessage,
    contentPoints: slide.contentPoints,
    visualDirection: slide.visualDirection,
    imagePrompt: slide.imagePrompt,
    slideRole: slide.slideRole,
    fieldEditState: {
      title: "aiGenerated",
      coreMessage: "aiGenerated",
      contentPoints: "aiGenerated",
      visualDirection: "aiGenerated",
      imagePrompt: "aiGenerated",
      slideRole: "aiGenerated",
    },
    imageGenerationStatus: "not_generated",
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }));

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1500px] px-6 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="text-sm font-medium text-primary">개발용 샘플 fixture</p>
          <h1 className="mt-1 text-3xl font-semibold">{project.name}</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            `tmp/rca-ax-readiness-storyboard-sample.json`을 더미 LLM 응답으로
            렌더링한 화면입니다. 실제 OpenRouter 호출과 이미지 생성 호출은 실행하지 않습니다.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/projects">프로젝트 목록</Link>
        </Button>
      </header>
      <StoryboardWorkspace project={project} initialSlides={slides} />
    </main>
  );
}
