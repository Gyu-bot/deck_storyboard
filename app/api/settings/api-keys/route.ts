import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/client";
import { requireCurrentUserId } from "@/lib/auth/session";
import { getUserApiKeyPresence } from "@/lib/repositories/user-api-keys";

export const runtime = "nodejs";

export async function GET() {
  const userId = await requireCurrentUserId();
  return NextResponse.json(getUserApiKeyPresence(getDatabase(), userId));
}

export async function POST() {
  await requireCurrentUserId();
  return NextResponse.json(
    { error: "Provider keys are assigned by an administrator." },
    { status: 403 },
  );
}

export async function DELETE() {
  await requireCurrentUserId();
  return NextResponse.json(
    { error: "Provider keys are assigned by an administrator." },
    { status: 403 },
  );
}
