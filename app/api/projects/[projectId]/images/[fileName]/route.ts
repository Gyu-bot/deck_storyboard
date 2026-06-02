import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/client";
import { requireCurrentUserId } from "@/lib/auth/session";
import { LocalImageStorageProvider } from "@/lib/images/local-storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; fileName: string }> },
) {
  const { projectId, fileName } = await params;
  const userId = await requireCurrentUserId();
  const storage = new LocalImageStorageProvider();
  const bytes = await storage.readProjectImage(
    getDatabase(),
    `projects/${projectId}/images/${fileName}`,
    userId,
  );
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": fileName.endsWith(".jpg") ? "image/jpeg" : "image/png",
    },
  });
}
