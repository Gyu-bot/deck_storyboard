import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/client";
import { requireAdminUserId } from "@/lib/auth/session";
import { getUserById } from "@/lib/auth/users";
import { providerKeyValues, type ProviderKey } from "@/lib/db/schema";
import {
  deleteUserApiKey,
  getUserApiKeyPresence,
  saveUserApiKey,
} from "@/lib/repositories/user-api-keys";

export const runtime = "nodejs";

function parseProvider(value: FormDataEntryValue | null): ProviderKey | null {
  return providerKeyValues.includes(value as ProviderKey)
    ? (value as ProviderKey)
    : null;
}

function adminUsersUrl(request: Request) {
  return new URL("/admin/users", request.url);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    await requireAdminUserId();
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { userId } = await context.params;
  const db = getDatabase();
  if (!getUserById(db, userId)) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const form = await request.formData();
  const provider = parseProvider(form.get("provider"));
  const intent = String(form.get("intent") ?? "assign");
  if (!provider) {
    return NextResponse.json({ error: "Provider is required." }, { status: 400 });
  }

  if (intent === "delete") {
    deleteUserApiKey(db, userId, provider);
    return NextResponse.redirect(adminUsersUrl(request), 303);
  }

  const apiKey = String(form.get("apiKey") ?? "");
  if (!apiKey) {
    return NextResponse.json({ error: "API key is required." }, { status: 400 });
  }
  saveUserApiKey(db, userId, provider, apiKey);
  return NextResponse.redirect(adminUsersUrl(request), 303);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    await requireAdminUserId();
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { userId } = await context.params;
  const db = getDatabase();
  if (!getUserById(db, userId)) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  return NextResponse.json(getUserApiKeyPresence(db, userId));
}
