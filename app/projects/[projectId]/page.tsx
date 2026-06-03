import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db/client";
import { getProjectForUser, getSlidesForProject } from "@/lib/repositories/projects";
import { StoryboardWorkspace } from "@/app/projects/[projectId]/storyboard-workspace";
import type { ProjectStatus } from "@/lib/db/schema";

const projectStatusLabels: Record<ProjectStatus, string> = {
  draft_input: "입력 초안",
  story_structure_ready: "구조 분석 완료",
  storyboard_generating: "생성 중",
  storyboard_review: "검토 대기",
  storyboard_confirmed: "스토리보드 확정",
  storyboard_generation_failed: "생성 실패",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");
  const db = getDatabase();
  const project = getProjectForUser(db, projectId, userId);
  if (!project) redirect("/projects");
  const slides = getSlidesForProject(db, projectId, userId);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <Link className="text-sm font-medium text-primary" href="/projects">프로젝트 목록</Link>
          <h1 className="mt-1 text-3xl font-semibold">{project.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            현재 단계: {projectStatusLabels[project.status]}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={`/api/projects/${project.id}/storyboard/generate`} method="post">
            <Button type="submit" variant="outline">
              <WandSparkles className="size-4" aria-hidden="true" />
              스토리보드 생성
            </Button>
          </form>
          <form action={`/api/projects/${project.id}/storyboard/confirm`} method="post">
            <Button type="submit" disabled={project.status !== "storyboard_review"}>
              <CheckCircle2 className="size-4" aria-hidden="true" />
              스토리보드 확정
            </Button>
          </form>
        </div>
      </header>
      <StoryboardWorkspace project={project} initialSlides={slides} />
    </main>
  );
}
