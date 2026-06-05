# T027C Provider call debug log storage and viewer

## Scope

- Task ID: T027C
- Issue: #56
- Branch: `feature/T027C-provider-debug-logs`
- Status: In Progress

## 구현 요약

- `provider_call_debug_logs` SQLite table과 Drizzle schema를 추가했다.
- LLM `story_structure`, `slide_breakdown` orchestration에서 provider 호출 결과를 debug log로 기록한다.
- Single slide image generation의 OpenRouter/direct fallback 시도별로 debug log를 기록한다.
- request/response/storage snapshot은 redaction과 size limit을 거친 뒤 저장한다. `storyline`, `prompt`, `imagePrompt`, `slidePrompt`는 bounded preview object로만 저장하고 `previousStructure` 같은 structured prompt payload는 본문을 생략한다.
- Debug log persistence 실패는 provider 성공 흐름을 실패시키지 않고 server log 또는 callback으로만 노출한다.
- `/api/provider-debug-logs`에서 viewer role과 filter를 적용해 logs를 조회한다.
- `/settings/provider-debug-logs` 관리자 viewer를 추가했고 `/admin/provider-debug-logs`는 해당 페이지로 redirect한다.

## Schema

- `projectId`, `slideId`, `userId`
- `operationType`: `story_structure`, `slide_breakdown`, `single_image_generation`
- `provider`, `model`, `aspectRatio`
- `attemptNumber`, `fallbackOrder`
- `startedAt`, `completedAt`, `durationMs`
- `status`, `httpStatus`, `requestId`, `normalizedError`
- `requestSnapshot`, `responseSnapshot`, `storageSummary`, `redactionMetadata`
- `createdAt`, `deletedAt`

## Redaction policy

- API keys, Authorization headers, tokens, passwords, ciphertext/auth tags are replaced with `[redacted]`.
- Buffer, Uint8Array, ArrayBuffer, `bytes`, `b64_json`, inline image `data`, and similar binary fields are replaced with `[binary omitted]`.
- Long strings and oversized serialized snapshots are truncated.
- `redactionMetadata` records truncated fields, redacted fields, omitted binary fields, and size limits.
- Raw binary image bytes and decrypted secrets are never intentionally stored in debug logs.
- Prompt-like sensitive strings are stored as bounded preview metadata, not as raw full payload fields.
- Structured prompt payloads such as `previousStructure` are summarized as omitted structured payloads.

## Viewer and access policy

- Admin viewer: `/settings/provider-debug-logs`.
- API: `/api/provider-debug-logs`.
- Admin viewers can inspect all active-project logs.
- Member access through the API is limited to logs for their own active projects.
- Logs for deleted projects or deleted slides are hidden from default repository/API results.
- Filters include project, slide, operation type, provider, status, and created date range.

## Independent review

- Reviewer pass found four issues:
  - short sensitive prompts/storylines were being stored raw;
  - `slide_breakdown` success logs were recorded even when no provider call happened;
  - storage failures were too similar to provider errors and direct-provider missing keys could mask the earlier attempted provider failure;
  - admin viewer did not expose created date filters.
- Fixes applied:
  - prompt-like fields now store bounded preview metadata; `previousStructure` structured payloads are omitted from snapshots;
  - `slide_breakdown` debug logs are recorded only when the provider is actually called;
  - image storage failures now record response metadata plus `storageSummary: { status: "failed", error }`, and later missing direct-provider keys do not overwrite an earlier attempted-provider error;
  - viewer/API date filters support date-only input via start/end day ISO boundaries.
- Remaining calibrated gap:
  - raw provider HTTP `requestId`, `httpStatus`, and usage metadata are schema-ready but only populated when available through the current orchestration/provider interfaces. The current provider adapters still normalize away some raw HTTP metadata; deeper adapter-level instrumentation should be a follow-up if exact request-id/usage capture is required for live providers.

## Verification

- RED observed:
  - `npm run test:unit -- tests/unit/provider-debug-logs.test.ts tests/unit/provider-debug-log-viewer-route.test.ts tests/unit/storyboard-debug-logs.test.ts tests/unit/image-providers.test.ts`
  - Failed because `providerCallDebugLogs`, repository, redaction module, and viewer route did not exist.
- GREEN observed:
  - `npm run test:unit -- tests/unit/provider-debug-logs.test.ts tests/unit/provider-debug-log-viewer-route.test.ts tests/unit/storyboard-debug-logs.test.ts tests/unit/image-providers.test.ts`
  - 17 files, 76 tests passed after review fixes.
- Full unit suite:
  - `npm run test:unit`
  - 17 files, 76 tests passed.
  - Added a regression check that usage metadata such as `promptTokenCount` is preserved while explicit image `inlineData` is omitted.
  - Added regression coverage for prompt-like preview redaction, deleted project/slide visibility, no-call slide breakdown logging, storage failure diagnostics, and created date filter propagation.
- Typecheck:
  - `npm run typecheck`
  - Passed.
- Lint:
  - `npm run lint`
  - Passed.
- Build:
  - `npm run build`
  - Passed. Route manifest includes `/api/provider-debug-logs`, `/settings/provider-debug-logs`, and `/admin/provider-debug-logs`.
- Storyboard sample:
  - Initial run failed because the ignored `tmp/rca-ax-readiness-storyline-sample.md` and `tmp/rca-ax-readiness-storyboard-sample.json` fixtures were absent in the new worktree.
  - Copied the ignored fixture files from the main checkout into this worktree `tmp/`.
  - Re-run passed: `storyboard sample ok | slides=12 | llm_dummy_calls=story_structure | status=storyboard_review | image_generation=not_started`.
- Browser/equivalent viewer check:
  - Inspected current Docker/listen state before local server changes; honcho ports remained `127.0.0.1:8000`, `127.0.0.1:6379`, `127.0.0.1:5432`.
  - `npm run dev -- --port 3000` without DB env exposed the login page but authentication failed because default `/app/data` DB path is not writable in this local worktree.
  - Restarted with `DATABASE_PATH=/private/tmp/deck_storyboard-T027C-provider-debug-logs/tmp/dev-data/deck-storyboard.db`, `NEXTAUTH_URL=http://localhost:3000`, and `NEXTAUTH_SECRET=dev-secret-for-t027c`.
  - Dev server showed `EMFILE` watcher warnings and returned 404 for newly added routes, while production build route manifest was correct.
  - Switched to `npm run start -- --port 3000` using the same env.
  - In-app browser confirmed unauthenticated access redirects to `/login`, but Browser input/cookie mutation failed due the current Browser runtime clipboard/read-only limitations.
  - Inserted mocked LLM and image debug logs into the dev DB, then used an authenticated HTTP request against the running production server:
    - `/api/provider-debug-logs?operationType=single_image_generation&status=failed` returned the mocked failed image log.
    - `/settings/provider-debug-logs?operationType=single_image_generation&status=failed` returned rendered HTML containing `Provider 호출 로그`, filters, recent log count, failed log card, request/response/storage snapshot, and redaction metadata.
    - Rebuilt, restarted production server, and rechecked with `createdAfter=2026-06-05&createdBefore=2026-06-05`; API returned the log and page HTML rendered `시작일`, `종료일`, and the filtered failed log.

## 남은 검증

- None for local implementation. Live provider `requestId`/usage metadata capture remains adapter-interface dependent as noted above.
