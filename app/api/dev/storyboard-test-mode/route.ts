import { NextResponse } from "next/server";
import { requireCurrentUserId } from "@/lib/auth/session";
import { STORYBOARD_TEST_MODE_COOKIE } from "@/lib/storyboard/sample-fixture";

export const runtime = "nodejs";

function redirectBack(request: Request) {
  const referer = request.headers.get("referer");
  return new URL(referer ?? "/projects", request.url);
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production." }, { status: 404 });
  }

  await requireCurrentUserId();
  const form = await request.formData();
  const enabled = String(form.get("enabled") ?? "") === "true";
  const response = NextResponse.redirect(redirectBack(request), 303);

  if (enabled) {
    response.cookies.set(STORYBOARD_TEST_MODE_COOKIE, "sample-fixture", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return response;
  }

  response.cookies.set(STORYBOARD_TEST_MODE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
