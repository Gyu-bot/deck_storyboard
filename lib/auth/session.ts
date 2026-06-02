import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function getCurrentUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

export async function requireCurrentUserId() {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("authentication required");
  return userId;
}
