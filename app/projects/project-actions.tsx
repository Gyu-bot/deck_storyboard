"use client";

import { Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProjectRenameForm({
  projectId,
  name,
}: {
  projectId: string;
  name: string;
}) {
  async function rename(formData: FormData) {
    formData.set("projectId", projectId);
    await fetch("/api/projects", { method: "PATCH", body: formData });
    window.location.reload();
  }

  return (
    <form action={rename} className="flex max-w-md gap-2">
      <input
        name="name"
        defaultValue={name}
        className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-sm"
      />
      <Button type="submit" variant="outline" size="sm">
        <Save className="size-4" aria-hidden="true" />
        Rename
      </Button>
    </form>
  );
}

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
