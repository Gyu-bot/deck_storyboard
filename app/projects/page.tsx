import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db/client";
import { listProjectsForUser } from "@/lib/repositories/projects";
import { ProjectDeleteButton, ProjectRenameForm } from "@/app/projects/project-actions";
import type { ProjectStatus } from "@/lib/db/schema";

const projectStatusLabels: Record<ProjectStatus, string> = {
  draft_input: "입력 초안",
  story_structure_ready: "구조 분석 완료",
  storyboard_generating: "생성 중",
  storyboard_review: "검토 대기",
  storyboard_confirmed: "스토리보드 확정",
  storyboard_generation_failed: "생성 실패",
};

export default async function ProjectsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");
  const projects = listProjectsForUser(getDatabase(), userId);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-8">
      <header className="mb-8 flex items-center justify-between border-b border-border pb-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">워크스페이스</p>
          <h1 className="text-3xl font-semibold">스토리보드 프로젝트</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/settings">설정</Link>
          </Button>
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="size-4" aria-hidden="true" />
              새 프로젝트
            </Link>
          </Button>
        </div>
      </header>
      {projects.length === 0 ? (
        <section className="grid min-h-80 place-items-center rounded-md border border-dashed border-border">
          <div className="text-center">
            <FolderOpen className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-xl font-semibold">아직 프로젝트가 없습니다</h2>
            <Button asChild className="mt-4">
              <Link href="/projects/new">첫 프로젝트 만들기</Link>
            </Button>
          </div>
        </section>
      ) : (
        <div className="grid gap-3">
          {projects.map((project) => (
            <article key={project.id} className="grid gap-4 rounded-md border border-border bg-card p-5 sm:grid-cols-[1fr_auto]">
              <div>
                <h2 className="text-lg font-semibold">{project.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {projectStatusLabels[project.status]} · {new Date(project.updatedAt).toLocaleString()} 수정
                </p>
                <div className="mt-3">
                  <ProjectRenameForm projectId={project.id} name={project.name} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/projects/${project.id}`}>열기</Link>
                </Button>
                <ProjectDeleteButton projectId={project.id} />
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
