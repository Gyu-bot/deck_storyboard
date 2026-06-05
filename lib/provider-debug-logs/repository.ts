import { randomUUID } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import type { createTestDatabase } from "@/lib/db/test-utils";
import {
  projects,
  providerCallDebugLogs,
  slides,
  users,
  type ProviderCallOperation,
  type ProviderCallStatus,
  type UserRole,
} from "@/lib/db/schema";
import { buildRedactedSnapshot } from "@/lib/provider-debug-logs/redaction";

type Db = ReturnType<typeof createTestDatabase>;

export type ProviderCallDebugLogInput = {
  projectId: string;
  slideId?: string | null;
  userId: string;
  operationType: ProviderCallOperation;
  provider: string;
  model: string;
  aspectRatio?: "16:9" | "4:3" | null;
  attemptNumber?: number;
  fallbackOrder?: number | null;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  status: ProviderCallStatus;
  httpStatus?: number | null;
  requestId?: string | null;
  normalizedError?: string | null;
  requestSnapshot?: unknown;
  responseSnapshot?: unknown;
  storageSummary?: unknown;
};

export type ProviderCallDebugLogFilters = {
  viewerUserId: string;
  viewerRole: UserRole;
  projectId?: string | null;
  slideId?: string | null;
  operationType?: ProviderCallOperation | null;
  provider?: string | null;
  status?: ProviderCallStatus | null;
  createdAfter?: string | null;
  createdBefore?: string | null;
  limit?: number;
};

function now() {
  return new Date().toISOString();
}

function normalizeOptional<T>(value: T | null | undefined) {
  return value === undefined ? null : value;
}

export function safeRecordProviderCallDebugLog(
  db: Db,
  input: ProviderCallDebugLogInput,
  options: { onPersistenceError?: (error: unknown) => void } = {},
) {
  try {
    const request = buildRedactedSnapshot(input.requestSnapshot ?? null);
    const response = buildRedactedSnapshot(input.responseSnapshot ?? null);
    const storage = buildRedactedSnapshot(input.storageSummary ?? null);
    const redactionMetadata = {
      request: request.metadata,
      response: response.metadata,
      storage: storage.metadata,
      truncated:
        request.metadata.truncated ||
        response.metadata.truncated ||
        storage.metadata.truncated,
    };
    const createdAt = now();
    const row = {
      id: randomUUID(),
      projectId: input.projectId,
      slideId: normalizeOptional(input.slideId),
      userId: input.userId,
      operationType: input.operationType,
      provider: input.provider,
      model: input.model,
      aspectRatio: normalizeOptional(input.aspectRatio),
      attemptNumber: input.attemptNumber ?? 1,
      fallbackOrder: normalizeOptional(input.fallbackOrder),
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      durationMs: Math.max(0, Math.round(input.durationMs)),
      status: input.status,
      httpStatus: normalizeOptional(input.httpStatus),
      requestId: normalizeOptional(input.requestId),
      normalizedError: normalizeOptional(input.normalizedError),
      requestSnapshot: request.value,
      responseSnapshot: response.value,
      storageSummary: storage.value,
      redactionMetadata,
      createdAt,
      deletedAt: null,
    } satisfies typeof providerCallDebugLogs.$inferInsert;
    db.insert(providerCallDebugLogs).values(row).run();
    return row;
  } catch (error) {
    options.onPersistenceError?.(error);
    if (!options.onPersistenceError) {
      console.error("provider debug log persistence failed", error);
    }
    return null;
  }
}

function isActiveProjectVisible(
  db: Db,
  projectId: string,
  viewerUserId: string,
  viewerRole: UserRole,
) {
  const project = db
    .select({ id: projects.id, userId: projects.userId })
    .from(projects)
    .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
    .get();
  if (!project) return false;
  return viewerRole === "admin" || project.userId === viewerUserId;
}

function isActiveSlideVisible(db: Db, slideId: string | null) {
  if (!slideId) return true;
  return Boolean(
    db
      .select({ id: slides.id })
      .from(slides)
      .where(and(eq(slides.id, slideId), isNull(slides.deletedAt)))
      .get(),
  );
}

export function listProviderCallDebugLogs(
  db: Db,
  filters: ProviderCallDebugLogFilters,
) {
  const rows = db
    .select()
    .from(providerCallDebugLogs)
    .where(isNull(providerCallDebugLogs.deletedAt))
    .orderBy(desc(providerCallDebugLogs.createdAt))
    .all();

  return rows
    .filter((log) =>
      isActiveProjectVisible(
        db,
        log.projectId,
        filters.viewerUserId,
        filters.viewerRole,
      ),
    )
    .filter((log) => isActiveSlideVisible(db, log.slideId))
    .filter((log) => !filters.projectId || log.projectId === filters.projectId)
    .filter((log) => !filters.slideId || log.slideId === filters.slideId)
    .filter(
      (log) =>
        !filters.operationType || log.operationType === filters.operationType,
    )
    .filter((log) => !filters.provider || log.provider === filters.provider)
    .filter((log) => !filters.status || log.status === filters.status)
    .filter(
      (log) => !filters.createdAfter || log.createdAt >= filters.createdAfter,
    )
    .filter(
      (log) => !filters.createdBefore || log.createdAt <= filters.createdBefore,
    )
    .slice(0, Math.min(Math.max(filters.limit ?? 100, 1), 500));
}

export function userRoleFromDb(db: Db, userId: string): UserRole {
  return (
    db.select({ role: users.role }).from(users).where(eq(users.id, userId)).get()
      ?.role ?? "member"
  );
}
