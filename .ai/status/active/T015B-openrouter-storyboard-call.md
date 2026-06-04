# T015B OpenRouter Storyboard Call

- Branch: `feature/T015B-openrouter-storyboard-call`
- Status: Ready for Review
- Scope: connect storyboard generation to the admin-assigned user OpenRouter API key and the real OpenRouter Chat Completions request path.

## Implemented

- Added an OpenRouter Chat Completions fetcher that sends structured-output requests to `https://openrouter.ai/api/v1/chat/completions`.
- Kept `OPENROUTER_STORYBOARD_MODEL` configurable and defaulted MVP storyboard generation to `openai/gpt-4o`.
- Preserved the non-production sample fixture path for fixture-based UI checks.
- Added a temporary development-only storyboard test mode toggle on project detail pages.
- Changed sample fixture generation so it is used only when test mode is enabled.
- Repaired local development seeding so an existing `admin@example.local` account is upgraded back to role `admin` when seed data is applied.
- Moved API key assignment UX to admin-only `/settings`: members no longer see the settings entry, admins see member list first, and selecting a member opens provider key assignment/delete controls.
- Removed the deterministic storyboard fallback from the production generation route.
- Continued using the user-scoped `openrouter` key decrypted from admin-managed key storage when no sample fixture is active.

## Verification

- `npm run test:unit -- tests/unit/contracts.test.ts`
- `npm run test:unit`
- `npm run typecheck`
- `npm run lint`
- `npm run build` (sandbox run failed on Turbopack internal port binding; escalated rerun passed)
- `git diff --check`
- Browser check with `DATA_ROOT=tmp/dev-data NEXTAUTH_SECRET=dev-storyboard-secret npm run dev`: project detail shows the test mode toggle, toggling on changes the label to `테스트 모드 끄기`, and toggling off changes it back to `테스트 모드 켜기`.
- Admin assignment check with local dev server: `admin/admin` can access `/admin/users`, and POSTing a dummy OpenRouter key to `/api/admin/users/:userId/api-keys` returns `303` and stores masked key presence.
- Admin settings check with local dev server: `test/test` project page does not include the settings link; `admin/admin` project page includes it; `/settings` shows the member list first; selecting `test@example.local` opens OpenRouter/OpenAI/Anthropic/Gemini key forms.
- Live OpenRouter retry after schema fix: project `209e9e8a-fa26-407c-9e1d-2d78e6c5c900` generated successfully, returned `303`, moved to `storyboard_review`, and persisted 12 slides with image prompts.

## Known Limits

- The external-call behavior is covered by mocked HTTP tests for request shape, structured-output schema, JSON response parsing, retry validation, and slide-breakdown fallback flow.
- Local browser verification needs `DATA_ROOT` pointed at a writable path and a stable `NEXTAUTH_SECRET`; otherwise signup/session checks can fail before reaching the storyboard flow.

## Planning Handoff

- Reflect in the final implementation plan during the next planning/docs cleanup session: LLM calls should use the same provider priority policy as image generation, attempting OpenRouter first and falling back to the direct provider for the selected model when OpenRouter is unavailable or fails.
- Add admin-configurable provider routing to the implementation plan: administrators should be able to set the priority order and fallback behavior for both LLM calls and image generation from the admin settings surface.
