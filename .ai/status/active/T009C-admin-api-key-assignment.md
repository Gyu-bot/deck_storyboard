# T009C Admin API Key Assignment

- Status: Ready for User Review
- Branch: feature/T009B-admin-member-key-management-page
- Scope: Moved provider key assignment to admin-managed account-level keys.

## Changes

- Replaced self-service image-only provider key names with account-level providers:
  - `openrouter`
  - `openai`
  - `anthropic`
  - `gemini`
- Added admin API route at `/api/admin/users/{userId}/api-keys`.
- Admin route validates admin access, target user existence, provider value, and required API key on assignment.
- Admin assignment and deletion reuse the existing AES-GCM encrypted `user_api_keys` storage.
- UI/API responses expose only masked key presence, never full plaintext.
- General `/settings` page now displays assignment status only.
- Missing OpenRouter storyboard key now returns a clear Korean admin-assignment error instead of a generic provider error.
- Missing OpenRouter storyboard key now stores `storyboard_generation_failed` and redirects back to the project page, so form submissions show an in-app alert instead of a raw JSON API response.
- Missing image provider keys now return the same member-specific admin-assignment guidance instead of a seeded-account-specific message.
- Inactive users cannot receive provider key edits through the admin UI because deactivation is an access-blocking `disabledAt` state.
- Deleted users are hidden from the admin list/selection while their existing project and slide rows remain preserved.

## Audit Metadata Decision

- MVP does not add a dedicated key-assignment audit table yet.
- Current traceability is limited to `user_api_keys.createdAt`, `updatedAt`, `deletedAt`, and the acting admin route boundary.
- A richer audit trail can be added when there is a product requirement for compliance-grade key operation history.

## Verification

- `npm run test:unit` -> passed, 14 files / 56 tests.
- `npm run lint` -> passed.
- `npm run typecheck` -> passed.
- `npm run build` -> passed.
- `npm run test:storyboard-sample` -> passed with `slides=12`, `llm_dummy_calls=story_structure`, `status=storyboard_review`, `image_generation=not_started`.
- Browser check at `http://127.0.0.1:3000/settings` with `admin/admin` -> confirmed provider assignment cards show masked assigned state only, inactive-member key inputs/actions are disabled, and active-member key inputs are available for assignment/replacement/deletion.
- Browser check at `http://127.0.0.1:3000/projects/ae1d79c2-ebd9-4ee9-9375-8b41da149191` -> submitting storyboard generation without an assigned OpenRouter key returned `303` and rendered the project page `스토리보드 생성 실패` alert instead of raw JSON.

## Notes

- OpenAI/Gemini image generation already uses account-level provider keys.
- OpenAI/Gemini LLM adapter calls remain deferred to T035; this task keeps those keys in unified account-level storage so the later LLM adapters can use the same provider key rows.
- In-app browser typing was limited by a virtual clipboard error during one OpenAI assignment attempt; input-clearing and no-full-value exposure after masked presence changes are covered by unit regression.
