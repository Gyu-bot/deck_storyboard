# T007A Login Layout Spacing

- Status: Needs Review
- Branch: feature/pre-t020-admin-and-fixes
- Scope: Reduced excessive vertical spacing on `/login` while keeping the signup/login layout rhythm aligned.

## Changes

- Updated `/login` main layout spacing from `gap-8 py-10` to `gap-6 py-8`.
- Tightened the final login layout to `min-h-svh`, `max-w-4xl`, `items-center`, `py-6`, and `lg:grid-cols-[1fr_360px]`.
- Added `self-center` to the login form so the form keeps its content height instead of stretching vertically across the full grid row.
- Reduced the login heading from `text-4xl` to `text-3xl` to better match the compact auth surface.
- Added a focused regression test for the login layout spacing classes.

## Verification

- `npm run test:unit -- tests/unit/login-workspace-layout.test.tsx` -> passed, 7 files / 16 tests.
- `npm run lint` -> passed.
- `npm run typecheck` -> passed.
- `npm run build` -> passed after rerunning with sandbox escalation because Turbopack needs internal process/port binding.
- In-app browser DOM check at `http://localhost:3010/login` confirmed `min-h-svh`, `max-w-4xl`, `items-center`, `py-6`, `lg:grid-cols-[1fr_360px]`, and form `self-center`.

## Notes

- In-app browser visual QA was attempted against `localhost`, `127.0.0.1`, and the LAN URL, but the browser returned `ERR_BLOCKED_BY_CLIENT`. DOM/unit/server-render checks were used as the equivalent verification path.
