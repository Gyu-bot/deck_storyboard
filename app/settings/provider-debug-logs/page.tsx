import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, Bug, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/auth/session";
import { getUserById } from "@/lib/auth/users";
import { getDatabase } from "@/lib/db/client";
import {
  listProviderCallDebugLogs,
  type ProviderCallDebugLogFilters,
} from "@/lib/provider-debug-logs/repository";
import type { ProviderCallOperation, ProviderCallStatus } from "@/lib/db/schema";

const operationLabels: Record<ProviderCallOperation, string> = {
  story_structure: "Story structure",
  slide_breakdown: "Slide breakdown",
  single_image_generation: "Single image",
};

const statusLabels: Record<ProviderCallStatus, string> = {
  succeeded: "성공",
  failed: "실패",
  skipped: "건너뜀",
};

function compactJson(value: unknown) {
  if (!value) return "없음";
  return JSON.stringify(value, null, 2);
}

function param<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
): T | null {
  return value && allowed.includes(value as T) ? (value as T) : null;
}

function dateBoundary(value: string | undefined, boundary: "start" | "end") {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return boundary === "start"
      ? `${trimmed}T00:00:00.000Z`
      : `${trimmed}T23:59:59.999Z`;
  }
  return trimmed;
}

export default async function ProviderDebugLogsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    projectId?: string;
    slideId?: string;
    operationType?: string;
    provider?: string;
    status?: string;
    createdAfter?: string;
    createdBefore?: string;
  }>;
}) {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) redirect("/login");

  const db = getDatabase();
  const currentUser = getUserById(db, currentUserId);
  if (currentUser?.role !== "admin") redirect("/projects");

  const params = await searchParams;
  const filters: ProviderCallDebugLogFilters = {
    viewerUserId: currentUserId,
    viewerRole: "admin",
    projectId: params?.projectId?.trim() || null,
    slideId: params?.slideId?.trim() || null,
    operationType: param(params?.operationType, [
      "story_structure",
      "slide_breakdown",
      "single_image_generation",
    ] as const),
    provider: params?.provider?.trim() || null,
    status: param(params?.status, ["succeeded", "failed", "skipped"] as const),
    createdAfter: dateBoundary(params?.createdAfter, "start"),
    createdBefore: dateBoundary(params?.createdBefore, "end"),
    limit: 100,
  };
  const logs = listProviderCallDebugLogs(db, filters);
  const selectedLog = logs[0] ?? null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">관리자 설정</p>
          <h1 className="text-3xl font-semibold">Provider 호출 로그</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            LLM과 이미지 provider 호출의 요청/응답 요약, fallback, 실패 사유를 redaction된 snapshot으로 확인합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/settings">회원 관리</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/projects">프로젝트</Link>
          </Button>
        </div>
      </header>

      <form className="mb-6 grid gap-3 rounded-md border border-border bg-card p-4 md:grid-cols-7">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Project ID</span>
          <input
            name="projectId"
            defaultValue={filters.projectId ?? ""}
            className="h-10 rounded-md border border-border bg-background px-3"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Slide ID</span>
          <input
            name="slideId"
            defaultValue={filters.slideId ?? ""}
            className="h-10 rounded-md border border-border bg-background px-3"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">작업</span>
          <select
            name="operationType"
            defaultValue={filters.operationType ?? ""}
            className="h-10 rounded-md border border-border bg-background px-3"
          >
            <option value="">전체</option>
            {Object.entries(operationLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Provider</span>
          <input
            name="provider"
            defaultValue={filters.provider ?? ""}
            placeholder="openrouter"
            className="h-10 rounded-md border border-border bg-background px-3"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">상태</span>
          <select
            name="status"
            defaultValue={filters.status ?? ""}
            className="h-10 rounded-md border border-border bg-background px-3"
          >
            <option value="">전체</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">시작일</span>
          <input
            name="createdAfter"
            type="date"
            defaultValue={filters.createdAfter?.slice(0, 10) ?? ""}
            className="h-10 rounded-md border border-border bg-background px-3"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">종료일</span>
          <input
            name="createdBefore"
            type="date"
            defaultValue={filters.createdBefore?.slice(0, 10) ?? ""}
            className="h-10 rounded-md border border-border bg-background px-3"
          />
        </label>
        <div className="flex items-end">
          <Button type="submit" className="w-full">
            <Search className="size-4" aria-hidden="true" />
            조회
          </Button>
        </div>
      </form>

      <div className="grid gap-6 lg:grid-cols-[minmax(360px,460px)_1fr]">
        <section className="min-w-0 rounded-md border border-border bg-card p-4">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="size-5 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-lg font-semibold">최근 로그 {logs.length}건</h2>
          </div>
          <div className="grid max-h-[720px] gap-2 overflow-auto pr-1">
            {logs.length === 0 ? (
              <p className="rounded-md border border-border bg-background p-4 text-sm text-muted-foreground">
                조건에 맞는 provider 호출 로그가 없습니다.
              </p>
            ) : (
              logs.map((log) => (
                <article
                  key={log.id}
                  className="rounded-md border border-border bg-background p-3 text-sm"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">
                        {operationLabels[log.operationType]} · {log.provider}
                      </h3>
                      <p className="truncate text-muted-foreground">
                        {log.model} · {log.durationMs}ms ·{" "}
                        {new Date(log.startedAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md border border-border px-2 py-1 text-xs">
                      {statusLabels[log.status]}
                    </span>
                  </div>
                  <p className="mt-2 break-all text-xs text-muted-foreground">
                    project: {log.projectId}
                    {log.slideId ? ` · slide: ${log.slideId}` : ""}
                  </p>
                  {log.normalizedError ? (
                    <p className="mt-2 rounded-md border border-border bg-muted p-2 text-xs">
                      {log.normalizedError}
                    </p>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </section>

        <section className="min-w-0 rounded-md border border-border bg-card p-4">
          <div className="mb-4 flex items-center gap-2">
            <Bug className="size-5 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-lg font-semibold">로그 상세</h2>
          </div>
          {!selectedLog ? (
            <div className="grid min-h-80 place-items-center text-center text-muted-foreground">
              <p>조회 결과가 있으면 가장 최근 로그의 redaction snapshot이 표시됩니다.</p>
            </div>
          ) : (
            <div className="grid gap-4 text-sm">
              <div className="grid gap-2 rounded-md border border-border bg-background p-3 md:grid-cols-2">
                <p>작업: {operationLabels[selectedLog.operationType]}</p>
                <p>Provider: {selectedLog.provider}</p>
                <p>Model: {selectedLog.model}</p>
                <p>상태: {statusLabels[selectedLog.status]}</p>
                <p>시작: {new Date(selectedLog.startedAt).toLocaleString()}</p>
                <p>소요: {selectedLog.durationMs}ms</p>
                <p>Attempt: {selectedLog.attemptNumber}</p>
                <p>Fallback: {selectedLog.fallbackOrder ?? "없음"}</p>
              </div>
              {[
                ["요청 snapshot", selectedLog.requestSnapshot],
                ["응답 snapshot", selectedLog.responseSnapshot],
                ["저장 summary", selectedLog.storageSummary],
                ["Redaction metadata", selectedLog.redactionMetadata],
              ].map(([label, value]) => (
                <div key={String(label)} className="min-w-0">
                  <h3 className="mb-2 font-semibold">{String(label)}</h3>
                  <pre className="max-h-72 min-w-0 overflow-auto rounded-md border border-border bg-background p-3 text-xs">
                    {compactJson(value)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
