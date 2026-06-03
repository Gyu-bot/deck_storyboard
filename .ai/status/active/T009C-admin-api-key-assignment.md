# T009C Admin API Key Assignment

- Status: Needs Review
- Branch: feature/pre-t020-admin-and-fixes
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

## Audit Metadata Decision

- MVP does not add a dedicated key-assignment audit table yet.
- Current traceability is limited to `user_api_keys.createdAt`, `updatedAt`, `deletedAt`, and the acting admin route boundary.
- A richer audit trail can be added when there is a product requirement for compliance-grade key operation history.

## Verification

- `npm run test:unit` -> passed, 7 files / 16 tests.
- `npm run lint` -> passed.
- `npm run typecheck` -> passed.
- `npm run build` -> passed after sandbox escalation.

## Notes

- Real LLM/image provider calls remain out of scope for this task.
- OpenAI/Gemini key reuse by future LLM/image paths is represented by account-level provider storage; actual provider calls remain for later tasks.
