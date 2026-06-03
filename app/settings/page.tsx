import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/auth/session";
import { getUserById, listUsers } from "@/lib/auth/users";
import { getDatabase } from "@/lib/db/client";
import { getUserApiKeyPresence } from "@/lib/repositories/user-api-keys";
import { AdminMemberKeySettings } from "@/app/settings/admin-member-key-settings";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; userId?: string }>;
}) {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) redirect("/login");

  const db = getDatabase();
  const currentUser = getUserById(db, currentUserId);
  if (currentUser?.role !== "admin") redirect("/projects");

  const params = await searchParams;
  const query = params?.q ?? "";
  const users = listUsers(db, { query });
  const selectedUser =
    users.find((user) => user.id === params?.userId) ??
    (params?.userId ? getUserById(db, params.userId) : null);
  const selectedPresence = selectedUser
    ? getUserApiKeyPresence(db, selectedUser.id)
    : null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">관리자 설정</p>
          <h1 className="text-3xl font-semibold">회원 및 provider key 관리</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/projects">프로젝트</Link>
          </Button>
          <LogoutButton />
        </div>
      </header>
      <AdminMemberKeySettings
        users={users}
        selectedUser={selectedUser}
        selectedPresence={selectedPresence}
        query={query}
      />
    </main>
  );
}
