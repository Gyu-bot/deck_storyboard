import Link from "next/link";
import { Plus } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";

export function ProjectsHeaderActions({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {isAdmin ? (
        <Button asChild variant="outline">
          <Link href="/settings">설정</Link>
        </Button>
      ) : null}
      <LogoutButton />
      <Button asChild>
        <Link href="/projects/new">
          <Plus className="size-4" aria-hidden="true" />
          새 프로젝트
        </Link>
      </Button>
    </div>
  );
}
