import Link from "next/link";
import {
  KeyRound,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { providerKeyValues, type ProviderKey, type UserRole } from "@/lib/db/schema";

type AdminSettingsUser = {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  disabledAt: string | null;
  deletedAt: string | null;
};

const providerLabels: Record<ProviderKey, string> = {
  openrouter: "OpenRouter",
  openai: "OpenAI",
  anthropic: "Anthropic / Claude",
  gemini: "Gemini",
};

function settingsHref(userId: string) {
  return `/settings?userId=${encodeURIComponent(userId)}`;
}

function userStatus(user: AdminSettingsUser) {
  if (user.deletedAt) return "삭제됨";
  if (user.disabledAt) return "비활성";
  return "활성";
}

export function AdminMemberKeySettings({
  users,
  selectedUser,
  selectedPresence,
  query,
}: {
  users: AdminSettingsUser[];
  selectedUser: AdminSettingsUser | null;
  selectedPresence: Record<ProviderKey, string | null> | null;
  query: string;
}) {
  const returnTo = selectedUser ? settingsHref(selectedUser.id) : "/settings";
  const selectedUserActive = Boolean(
    selectedUser && !selectedUser.disabledAt && !selectedUser.deletedAt,
  );

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
      <section className="min-w-0 self-start rounded-md border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="size-5 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-lg font-semibold">회원 리스트</h2>
        </div>
        <form className="mb-4 flex min-w-0 gap-2" action="/settings">
          <label className="min-w-0 flex-1">
            <span className="sr-only">회원 이메일 검색</span>
            <input
              name="q"
              defaultValue={query}
              placeholder="이메일 검색"
              className="h-10 w-full rounded-md border border-border bg-background px-3"
            />
          </label>
          <Button type="submit" variant="outline">
            <Search className="size-4" aria-hidden="true" />
            검색
          </Button>
        </form>
        <form
          action="/api/admin/users"
          method="post"
          className="mb-4 grid gap-2 rounded-md border border-border bg-background p-3"
        >
          <div className="flex min-w-0 items-center gap-2 text-sm font-semibold">
            <UserPlus className="size-4 text-muted-foreground" aria-hidden="true" />
            신규 회원 추가
          </div>
          <label>
            <span className="sr-only">신규 회원 이메일</span>
            <input
              name="email"
              type="email"
              placeholder="member@example.com"
              className="h-10 w-full rounded-md border border-border bg-background px-3"
            />
          </label>
          <label>
            <span className="sr-only">신규 회원 비밀번호</span>
            <input
              name="password"
              type="password"
              placeholder="임시 비밀번호 8자 이상"
              className="h-10 w-full rounded-md border border-border bg-background px-3"
            />
          </label>
          <Button type="submit" size="sm">
            회원 추가
          </Button>
        </form>
        <div className="grid min-w-0 gap-2">
          {users.map((user) => (
            <Link
              key={user.id}
              href={settingsHref(user.id)}
              aria-label={user.email}
              className={`box-border block w-full max-w-full min-w-0 overflow-hidden rounded-md border border-border p-3 text-sm transition-colors hover:bg-muted ${
                selectedUser?.id === user.id ? "bg-secondary" : "bg-background"
              }`}
            >
              <span className="flex min-w-0 items-center justify-between gap-3">
                <span className="min-w-0 truncate font-semibold">{user.email}</span>
                <span className="shrink-0 rounded-md border border-border px-2 py-1 text-xs">
                  {userStatus(user)}
                </span>
              </span>
              <span className="mt-1 block truncate text-muted-foreground">
                {user.role === "admin" ? "관리자" : "회원"} ·{" "}
                {new Date(user.updatedAt).toLocaleString()} 수정
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="min-w-0 rounded-md border border-border bg-card p-5">
        {!selectedUser || !selectedPresence ? (
          <div className="grid min-h-72 place-items-center text-center text-muted-foreground">
            <p>회원을 선택하면 provider key를 관리할 수 있습니다.</p>
          </div>
        ) : (
          <div className="grid gap-5">
            <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">회원 상세</p>
                <h2 className="text-2xl font-semibold">{selectedUser.email}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  역할: {selectedUser.role === "admin" ? "관리자" : "회원"} · 상태:{" "}
                  {userStatus(selectedUser)} · 가입:{" "}
                  {new Date(selectedUser.createdAt).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  비활성화는 로그인과 프로젝트 접근을 차단합니다. 삭제는 목록에서 숨기며 기존 프로젝트와 슬라이드는 보존합니다.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <form method="post">
                  <input type="hidden" name="intent" value="grant_admin" />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    formAction={`/api/admin/users/${selectedUser.id}`}
                    disabled={!selectedUserActive || selectedUser.role === "admin"}
                  >
                    <UserCog className="size-4" aria-hidden="true" />
                    관리자 권한 부여
                  </Button>
                </form>
                <form method="post">
                  <input type="hidden" name="intent" value="deactivate" />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    formAction={`/api/admin/users/${selectedUser.id}`}
                    disabled={!selectedUserActive || selectedUser.role === "admin"}
                  >
                    계정 비활성화
                  </Button>
                </form>
                <form method="post">
                  <input type="hidden" name="intent" value="delete" />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    formAction={`/api/admin/users/${selectedUser.id}`}
                    disabled={selectedUser.role === "admin"}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    계정 삭제
                  </Button>
                </form>
              </div>
            </header>
            <div className="grid gap-3 md:grid-cols-2">
              {providerKeyValues.map((provider) => (
                <div key={provider} className="rounded-md border border-border p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{providerLabels[provider]}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedPresence[provider]
                          ? `할당됨: ${selectedPresence[provider]}`
                          : "할당된 key 없음"}
                      </p>
                    </div>
                    <span className="rounded-md border border-border px-2 py-1 text-xs">
                      {selectedPresence[provider] ? "Assigned" : "Unassigned"}
                    </span>
                  </div>
                  <form
                    action={`/api/admin/users/${selectedUser.id}/api-keys`}
                    method="post"
                    className="grid gap-2"
                  >
                    <input type="hidden" name="provider" value={provider} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <label>
                      <span className="sr-only">{providerLabels[provider]} key</span>
                      <input
                        key={`${selectedUser.id}-${provider}-${selectedPresence[provider] ?? "empty"}`}
                        name="apiKey"
                        type="password"
                        placeholder="key 추가 또는 교체"
                        autoComplete="off"
                        disabled={!selectedUserActive}
                        className="h-10 w-full rounded-md border border-border bg-background px-3"
                      />
                    </label>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        name="intent"
                        value="assign"
                        disabled={!selectedUserActive}
                      >
                        <KeyRound className="size-4" aria-hidden="true" />
                        {selectedPresence[provider] ? "교체" : "할당"}
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        variant="outline"
                        name="intent"
                        value="delete"
                        disabled={!selectedUserActive || !selectedPresence[provider]}
                      >
                        삭제
                      </Button>
                    </div>
                  </form>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
