import { NextResponse } from "next/server";
import { createUser } from "@/lib/auth/users";
import { getDatabase } from "@/lib/db/client";
import { saveUserApiKey } from "@/lib/repositories/user-api-keys";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const passwordConfirm = String(form.get("passwordConfirm") ?? "");
  const openrouterKey = String(form.get("openrouterKey") ?? "");
  const imageProvider = String(form.get("imageProvider") ?? "openai_images");
  const imageProviderKey = String(form.get("imageProviderKey") ?? "");

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
    const user = await createUser(db, { email, password });
    if (openrouterKey) saveUserApiKey(db, user.id, "openrouter", openrouterKey);
    if (imageProviderKey && imageProvider === "nano_banana") {
      saveUserApiKey(db, user.id, "nano_banana", imageProviderKey);
    }
    if (imageProviderKey && imageProvider === "openai_images") {
      saveUserApiKey(db, user.id, "openai_images", imageProviderKey);
    }
    return NextResponse.redirect(new URL("/login?created=1", request.url), 303);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Signup failed." },
      { status: 400 },
    );
  }
}
