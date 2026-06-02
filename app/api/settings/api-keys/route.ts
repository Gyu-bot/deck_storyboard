import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/client";
import { requireCurrentUserId } from "@/lib/auth/session";
import {
  deleteUserApiKey,
  getUserApiKeyPresence,
  saveUserApiKey,
} from "@/lib/repositories/user-api-keys";
import { providerKeyValues, type ProviderKey } from "@/lib/db/schema";

export const runtime = "nodejs";

function parseProvider(value: FormDataEntryValue | null): ProviderKey | null {
  return providerKeyValues.includes(value as ProviderKey)
    ? (value as ProviderKey)
    : null;
}

export async function GET() {
  const userId = await requireCurrentUserId();
  return NextResponse.json(getUserApiKeyPresence(getDatabase(), userId));
}

export async function POST(request: Request) {
  const userId = await requireCurrentUserId();
  const form = await request.formData();
  const provider = parseProvider(form.get("provider"));
  const apiKey = String(form.get("apiKey") ?? "");
  if (!provider || !apiKey) {
    return NextResponse.json({ error: "Provider and key are required." }, { status: 400 });
  }
  saveUserApiKey(getDatabase(), userId, provider, apiKey);
  return NextResponse.redirect(new URL("/settings", request.url), 303);
}

export async function DELETE(request: Request) {
  const userId = await requireCurrentUserId();
  const form = await request.formData();
  const provider = parseProvider(form.get("provider"));
  if (!provider) {
    return NextResponse.json({ error: "Provider is required." }, { status: 400 });
  }
  deleteUserApiKey(getDatabase(), userId, provider);
  return NextResponse.json(getUserApiKeyPresence(getDatabase(), userId));
}
