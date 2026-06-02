import { redirect } from "next/navigation";
import { KeyRound, Save } from "lucide-react";
import { getCurrentUserId } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db/client";
import { getUserApiKeyPresence } from "@/lib/repositories/user-api-keys";
import { Button } from "@/components/ui/button";
import { SettingsKeyDelete } from "@/app/settings/settings-key-delete";

const providers = [
  ["openrouter", "OpenRouter"],
  ["nano_banana", "Nano Banana"],
  ["openai_images", "OpenAI Images"],
] as const;

export default async function SettingsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");
  const presence = getUserApiKeyPresence(getDatabase(), userId);

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-8">
      <header className="mb-8 flex items-center justify-between border-b border-border pb-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Settings</p>
          <h1 className="text-3xl font-semibold">API keys</h1>
        </div>
        <a className="text-sm font-medium text-primary" href="/projects">Projects</a>
      </header>
      <div className="grid gap-4">
        {providers.map(([provider, label]) => (
          <section key={provider} className="grid gap-4 rounded-md border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{label}</h2>
                <p className="text-sm text-muted-foreground">
                  {presence[provider] ? `Stored as ${presence[provider]}` : "No key stored"}
                </p>
              </div>
              {presence[provider] ? <SettingsKeyDelete provider={provider} /> : null}
            </div>
            <form action="/api/settings/api-keys" method="post" className="flex flex-col gap-3 sm:flex-row">
              <input type="hidden" name="provider" value={provider} />
              <label className="flex-1 text-sm font-medium">
                <span className="sr-only">{label} key</span>
                <input name="apiKey" type="password" placeholder="Add or replace key" className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3" />
              </label>
              <Button type="submit">
                {presence[provider] ? <Save className="size-4" aria-hidden="true" /> : <KeyRound className="size-4" aria-hidden="true" />}
                {presence[provider] ? "Replace" : "Add"}
              </Button>
            </form>
          </section>
        ))}
      </div>
    </main>
  );
}
