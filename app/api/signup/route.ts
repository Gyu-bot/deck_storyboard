import { NextResponse } from "next/server";
import { createUser } from "@/lib/auth/users";
import { getDatabase } from "@/lib/db/client";
import { appUrl } from "@/lib/http/redirects";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const passwordConfirm = String(form.get("passwordConfirm") ?? "");

  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Email and an 8+ character password are required." },
      { status: 400 },
    );
  }
  if (password !== passwordConfirm) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  }

  try {
    const db = getDatabase();
    await createUser(db, { email, password });
    return NextResponse.redirect(appUrl("/login?created=1", request), 303);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Signup failed." },
      { status: 400 },
    );
  }
}
