import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDatabase } from "@/lib/db/client";
import { requireCurrentUserId } from "@/lib/auth/session";
import { getDecryptedUserApiKey } from "@/lib/repositories/user-api-keys";
import { getProjectForUser } from "@/lib/repositories/projects";
import { createOpenRouterProvider } from "@/lib/ai/openrouter";
import {
  STORYBOARD_TEST_MODE_COOKIE,
  isStoryboardTestModeEnabled,
  loadStoryboardSampleFixture,
} from "@/lib/storyboard/sample-fixture";
import {
  analyzeStoryStructure,
  createSlideBreakdown,
} from "@/lib/storyboard/generation";
import { appUrl } from "@/lib/http/redirects";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const userId = await requireCurrentUserId();
  const db = getDatabase();
  const project = getProjectForUser(db, projectId, userId);
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  const cookieStore = await cookies();
  const testModeEnabled = isStoryboardTestModeEnabled({
    cookieValue: cookieStore.get(STORYBOARD_TEST_MODE_COOKIE)?.value,
  });
  const sampleStoryboard = loadStoryboardSampleFixture({ testModeEnabled });
  const apiKey = sampleStoryboard
    ? "dummy-openrouter-key"
    : getDecryptedUserApiKey(db, userId, "openrouter");
  if (!apiKey) {
    return NextResponse.json({ error: "OpenRouter key is required." }, { status: 400 });
  }
  const provider = createOpenRouterProvider({
    apiKey,
    fetcher: sampleStoryboard ? async () => sampleStoryboard : undefined,
  });
  const structure = await analyzeStoryStructure(db, projectId, userId, provider);
  await createSlideBreakdown(db, projectId, userId, provider, structure);
  return NextResponse.redirect(appUrl(`/projects/${projectId}`, request), 303);
}
