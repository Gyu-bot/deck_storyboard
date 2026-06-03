import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound, Search, ShieldCheck } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import { requireAdminUserId } from "@/lib/auth/session";
import { listUsers } from "@/lib/auth/users";
import { getDatabase } from "@/lib/db/client";
import { providerKeyValues, type ProviderKey } from "@/lib/db/schema";
import { getUserApiKeyPresence } from "@/lib/repositories/user-api-keys";

const providerLabels: Record<ProviderKey, string> = {
  openrouter: "OpenRouter",
  openai: "OpenAI",
  anthropic: "Anthropic / Claude",
  gemini: "Gemini",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  try {
    await requireAdminUserId();
  } catch {
    redirect("/login");
  }

  const params = await searchParams;
  const query = params?.q ?? "";
  const db = getDatabase();
  const users = listUsers(db, { query });

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">관리자</p>
          <h1 className="text-3xl font-semibold">회원 및 provider key 관리</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/projects">프로젝트</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/settings">내 설정</Link>
          </Button>
          <LogoutButton />
        </div>
      </header>

      <form className="mb-5 flex max-w-xl gap-2" action="/admin/users">
        <label className="flex-1">
          <span className="sr-only">회원 이메일 검색</span>
          <input
            name="q"
            defaultValue={query}
            placeholder="이메일로 회원 검색"
            className="h-10 w-full rounded-md border border-border bg-background px-3"
          />
        </label>
        <Button type="submit" variant="outline">
          <Search className="size-4" aria-hidden="true" />
          검색
        </Button>
      </form>

      <div className="grid gap-4">
        {users.map((user) => {
          const presence = getUserApiKeyPresence(db, user.id);
          return (
            <article key={user.id} className="rounded-md border border-border bg-card p-5">
              <div className="grid gap-4 xl:grid-cols-[minmax(260px,1fr)_2fr]">
                <section>
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-1 size-5 text-muted-foreground" aria-hidden="true" />
                    <div>
                      <h2 className="text-lg font-semibold">{user.email}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        역할: {user.role === "admin" ? "관리자" : "회원"} · 상태: 활성
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        가입: {new Date(user.createdAt).toLocaleString()} · 수정:{" "}
                        {new Date(user.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="grid gap-3 md:grid-cols-2">
                  {providerKeyValues.map((provider) => (
                    <div key={provider} className="rounded-md border border-border p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{providerLabels[provider]}</h3>
                          <p className="text-sm text-muted-foreground">
                            {presence[provider]
                              ? `할당됨: ${presence[provider]}`
                              : "할당된 key 없음"}
                          </p>
                        </div>
                        <span className="rounded-md border border-border px-2 py-1 text-xs">
                          {presence[provider] ? "Assigned" : "Unassigned"}
                        </span>
                      </div>
                      <form
                        action={`/api/admin/users/${user.id}/api-keys`}
                        method="post"
                        className="grid gap-2"
                      >
                        <input type="hidden" name="provider" value={provider} />
                        <label>
                          <span className="sr-only">{providerLabels[provider]} key</span>
                          <input
                            name="apiKey"
                            type="password"
                            placeholder="key 추가 또는 교체"
                            className="h-10 w-full rounded-md border border-border bg-background px-3"
                          />
                        </label>
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" name="intent" value="assign">
                            <KeyRound className="size-4" aria-hidden="true" />
                            {presence[provider] ? "교체" : "할당"}
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            name="intent"
                            value="delete"
                            disabled={!presence[provider]}
                          >
                            삭제
                          </Button>
                        </div>
                      </form>
                    </div>
                  ))}
                </section>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
