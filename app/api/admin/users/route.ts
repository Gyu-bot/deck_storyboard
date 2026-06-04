import { NextResponse } from "next/server";
import { createUser } from "@/lib/auth/users";
import { requireAdminUserId } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db/client";
import { appUrl } from "@/lib/http/redirects";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireAdminUserId();
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Email and an 8+ character password are required." },
      { status: 400 },
    );
  }

  try {
    const db = getDatabase();
    const user = await createUser(db, { email, password, role: "member" });
    return NextResponse.redirect(
      appUrl(`/settings?userId=${encodeURIComponent(user.id)}`, request),
      303,
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Member creation failed." },
      { status: 400 },
    );
  }
}
