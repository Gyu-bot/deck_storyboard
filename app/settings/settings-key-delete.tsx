"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SettingsKeyDelete({ provider }: { provider: string }) {
  async function onDelete() {
    const form = new FormData();
    form.set("provider", provider);
    await fetch("/api/settings/api-keys", { method: "DELETE", body: form });
    window.location.reload();
  }

  return (
    <Button type="button" variant="outline" onClick={onDelete}>
      <Trash2 className="size-4" aria-hidden="true" />
      삭제
    </Button>
  );
}
