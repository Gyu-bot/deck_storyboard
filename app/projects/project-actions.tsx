"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProjectDeleteButton({ projectId }: { projectId: string }) {
  async function onDelete() {
    const form = new FormData();
    form.set("projectId", projectId);
    await fetch("/api/projects", { method: "DELETE", body: form });
    window.location.reload();
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={onDelete}>
      <Trash2 className="size-4" aria-hidden="true" />
      Delete
    </Button>
  );
}
