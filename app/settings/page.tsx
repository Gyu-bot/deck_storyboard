import { redirect } from "next/navigation";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db/client";
import { getUserApiKeyPresence } from "@/lib/repositories/user-api-keys";

const providers = [
  ["openrouter", "OpenRouter"],
  ["openai", "OpenAI"],
  ["anthropic", "Anthropic / Claude"],
  ["gemini", "Gemini"],
] as const;

export default async function SettingsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");
  const presence = getUserApiKeyPresence(getDatabase(), userId);

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">설정</p>
          <h1 className="text-3xl font-semibold">Provider key 할당 상태</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/projects">프로젝트</Link>
          </Button>
          <LogoutButton />
        </div>
      </header>
      <section className="mb-5 rounded-md border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <KeyRound className="mt-0.5 size-5 text-muted-foreground" aria-hidden="true" />
          <div>
            <h2 className="font-semibold">관리자 할당 방식</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              일반 사용자는 provider API key를 직접 입력하거나 교체할 수 없습니다.
              필요한 key는 관리자 화면에서 회원별로 할당됩니다.
            </p>
          </div>
        </div>
      </section>
      <div className="grid gap-4">
        {providers.map(([provider, label]) => (
          <section key={provider} className="rounded-md border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{label}</h2>
                <p className="text-sm text-muted-foreground">
                  {presence[provider] ? `할당됨: ${presence[provider]}` : "할당된 key 없음"}
                </p>
              </div>
              <span className="rounded-md border border-border px-3 py-1 text-sm">
                {presence[provider] ? "Assigned" : "Unassigned"}
              </span>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
