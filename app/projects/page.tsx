import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db/client";
import { listProjectsForUser } from "@/lib/repositories/projects";
import { ProjectDeleteButton } from "@/app/projects/project-actions";

export default async function ProjectsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");
  const projects = listProjectsForUser(getDatabase(), userId);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-8">
      <header className="mb-8 flex items-center justify-between border-b border-border pb-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Workspace</p>
          <h1 className="text-3xl font-semibold">Projects</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/settings">Settings</Link>
          </Button>
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="size-4" aria-hidden="true" />
              New
            </Link>
          </Button>
        </div>
      </header>
      {projects.length === 0 ? (
        <section className="grid min-h-80 place-items-center rounded-md border border-dashed border-border">
          <div className="text-center">
            <FolderOpen className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-xl font-semibold">No projects yet</h2>
            <Button asChild className="mt-4">
              <Link href="/projects/new">Create project</Link>
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
                  {project.status} · Updated {new Date(project.updatedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/projects/${project.id}`}>Open</Link>
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
