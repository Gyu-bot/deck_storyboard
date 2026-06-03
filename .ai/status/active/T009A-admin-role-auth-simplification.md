# T009A Admin Role Auth Simplification

- Status: Needs Review
- Branch: feature/pre-t020-admin-and-fixes
- Scope: Simplified signup so users create accounts without provider API keys and added admin/member role foundation.

## Changes

- Removed OpenRouter/image provider key fields from `/signup`.
- Removed signup route key persistence; signup now creates only a member account with email/password.
- Added `users.role` with `member` default and `admin` support in schema and migration.
- Seeded non-production `admin` account with `admin` role while keeping `test` as `member`.
- Added role to credentials auth JWT/session callbacks.
- Added DB-backed role lookup helpers and `requireAdminUserId`.
- Changed `/settings` to status-only provider assignment visibility for normal users.
- Blocked self-service POST/DELETE on `/api/settings/api-keys`.

## Verification

- `npm run test:unit` -> passed, 7 files / 16 tests.
- `npm run lint` -> passed.
- `npm run typecheck` -> passed.
- `npm run build` -> passed after sandbox escalation.
- Server-render check: `curl -s http://localhost:3000/signup` confirmed only email, password, and password confirmation inputs.

## Notes

- Existing encrypted key storage remains reusable for admin assignment.
- In-app browser visual QA was blocked by `ERR_BLOCKED_BY_CLIENT`; server-render checks and regression tests were used instead.
