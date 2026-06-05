import { NextResponse } from "next/server";
import { getCurrentUserRole, requireCurrentUserId } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db/client";
import {
  listProviderCallDebugLogs,
  type ProviderCallDebugLogFilters,
} from "@/lib/provider-debug-logs/repository";
import type {
  ProviderCallOperation,
  ProviderCallStatus,
  UserRole,
} from "@/lib/db/schema";

export const runtime = "nodejs";

const operations = new Set<ProviderCallOperation>([
  "story_structure",
  "slide_breakdown",
  "single_image_generation",
]);

const statuses = new Set<ProviderCallStatus>([
  "succeeded",
  "failed",
  "skipped",
]);

function stringParam(params: URLSearchParams, name: string) {
  const value = params.get(name)?.trim();
  return value || null;
}

function operationParam(params: URLSearchParams) {
  const value = stringParam(params, "operationType");
  return value && operations.has(value as ProviderCallOperation)
    ? (value as ProviderCallOperation)
    : null;
}

function statusParam(params: URLSearchParams) {
  const value = stringParam(params, "status");
  return value && statuses.has(value as ProviderCallStatus)
    ? (value as ProviderCallStatus)
    : null;
}

function dateBoundaryParam(
  params: URLSearchParams,
  name: string,
  boundary: "start" | "end",
) {
  const value = stringParam(params, name);
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return boundary === "start"
      ? `${value}T00:00:00.000Z`
      : `${value}T23:59:59.999Z`;
  }
  return value;
}

export async function GET(request: Request) {
  const userId = await requireCurrentUserId();
  const role = ((await getCurrentUserRole()) ?? "member") as UserRole;
  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get("limit") ?? 100);
  const filters: ProviderCallDebugLogFilters = {
    viewerUserId: userId,
    viewerRole: role,
    projectId: stringParam(url.searchParams, "projectId"),
    slideId: stringParam(url.searchParams, "slideId"),
    operationType: operationParam(url.searchParams),
    provider: stringParam(url.searchParams, "provider"),
    status: statusParam(url.searchParams),
    createdAfter: dateBoundaryParam(url.searchParams, "createdAfter", "start"),
    createdBefore: dateBoundaryParam(url.searchParams, "createdBefore", "end"),
    limit: Number.isFinite(limitParam) ? limitParam : 100,
  };

  const logs = listProviderCallDebugLogs(getDatabase(), filters);
  return NextResponse.json({ logs });
}
