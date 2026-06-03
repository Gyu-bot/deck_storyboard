import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDatabase } from "@/lib/db/client";
import { getUserById } from "@/lib/auth/users";

export async function getCurrentUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

export async function requireCurrentUserId() {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("authentication required");
  return userId;
}

export async function getCurrentUserRole() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  return getUserById(getDatabase(), userId)?.role ?? null;
}

export async function requireAdminUserId() {
  const userId = await requireCurrentUserId();
  const user = getUserById(getDatabase(), userId);
  if (user?.role !== "admin") throw new Error("admin required");
  return userId;
}
