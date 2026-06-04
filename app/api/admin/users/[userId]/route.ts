import { NextResponse } from "next/server";
import {
  deactivateUser,
  deleteUser,
  getUserByIdIncludingInactive,
  grantAdminRole,
} from "@/lib/auth/users";
import { requireAdminUserId } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db/client";
import { appUrl } from "@/lib/http/redirects";

export const runtime = "nodejs";

function adminUsersUrl(request: Request, userId?: string) {
  return appUrl(userId ? `/settings?userId=${encodeURIComponent(userId)}` : "/settings", request);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  let adminUserId: string;
  try {
    adminUserId = await requireAdminUserId();
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { userId } = await context.params;
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  if (
    (intent === "deactivate" || intent === "delete") &&
    userId === adminUserId
  ) {
    return NextResponse.json(
      {
        error:
          intent === "deactivate"
            ? "You cannot deactivate your own admin account."
            : "You cannot delete your own admin account.",
      },
      { status: 400 },
    );
  }

  const db = getDatabase();
  const targetUser = getUserByIdIncludingInactive(db, userId);
  if (!targetUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (intent === "grant_admin") {
    if (targetUser.disabledAt) {
      return NextResponse.json(
        { error: "Inactive accounts cannot be promoted." },
        { status: 400 },
      );
    }
    grantAdminRole(db, userId);
    return NextResponse.redirect(adminUsersUrl(request, userId), 303);
  }

  if (intent === "deactivate") {
    if (targetUser.role === "admin") {
      return NextResponse.json(
        { error: "Admin accounts cannot be deactivated from this workflow." },
        { status: 400 },
      );
    }
    deactivateUser(db, userId);
    return NextResponse.redirect(adminUsersUrl(request, userId), 303);
  }

  if (intent === "delete") {
    if (targetUser.role === "admin") {
      return NextResponse.json(
        { error: "Admin accounts cannot be deleted from this workflow." },
        { status: 400 },
      );
    }
    deleteUser(db, userId);
    return NextResponse.redirect(adminUsersUrl(request), 303);
  }

  return NextResponse.json(
    { error: "Unsupported member action." },
    { status: 400 },
  );
}
