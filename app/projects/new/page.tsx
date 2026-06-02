import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/auth/session";
import {
  MAX_STORYLINE_CHARACTERS,
  styleTemplates,
} from "@/lib/projects/style-settings";

export default async function NewProjectPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-8">
      <header className="mb-8 border-b border-border pb-5">
        <p className="text-sm font-medium text-muted-foreground">New project</p>
        <h1 className="text-3xl font-semibold">Create storyboard input</h1>
      </header>
      <form action="/api/projects" method="post" className="grid gap-5">
        <section className="grid gap-4 rounded-md border border-border bg-card p-5">
          <label className="grid gap-2 text-sm font-medium">
            Project name
            <input name="name" required className="h-10 rounded-md border border-border bg-background px-3" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Storyline
            <textarea
              name="storyline"
              required
              maxLength={MAX_STORYLINE_CHARACTERS}
              rows={12}
              className="rounded-md border border-border bg-background p-3"
            />
          </label>
          <p className="text-sm text-muted-foreground">
            Limit: {MAX_STORYLINE_CHARACTERS.toLocaleString()} characters.
          </p>
        </section>
        <details open className="rounded-md border border-border bg-card p-5">
          <summary className="cursor-pointer text-lg font-semibold">Slide count and AI options</summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Slide count
              <input name="targetSlideCount" type="number" min={1} max={80} defaultValue={8} className="h-10 rounded-md border border-border bg-background px-3" />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input name="improvementSuggestionsEnabled" type="checkbox" defaultChecked />
              Generate improvement suggestions
            </label>
          </div>
        </details>
        <details className="rounded-md border border-border bg-card p-5">
          <summary className="cursor-pointer text-lg font-semibold">Style settings</summary>
          <div className="mt-4 grid gap-4">
            <label className="grid gap-2 text-sm font-medium">
              Template
              <select name="styleTemplate" className="h-10 rounded-md border border-border bg-background px-3">
                {Object.keys(styleTemplates).map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Custom common style prompt
              <textarea name="customCommonStylePrompt" rows={4} className="rounded-md border border-border bg-background p-3" />
            </label>
          </div>
        </details>
        <details className="rounded-md border border-border bg-card p-5">
          <summary className="cursor-pointer text-lg font-semibold">Image settings</summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Aspect ratio
              <select name="aspectRatio" defaultValue="16:9" className="h-10 rounded-md border border-border bg-background px-3">
                <option value="16:9">16:9</option>
                <option value="4:3">4:3</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Default image model
              <select name="defaultImageModel" defaultValue="gpt-image-2" className="h-10 rounded-md border border-border bg-background px-3">
                <option value="gpt-image-2">gpt-image-2</option>
                <option value="nano-banana">nano-banana</option>
              </select>
            </label>
          </div>
        </details>
        <Button type="submit" className="justify-self-start">
          <Sparkles className="size-4" aria-hidden="true" />
          Create project
        </Button>
      </form>
    </main>
  );
}
