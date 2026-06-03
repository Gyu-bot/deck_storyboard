# T017A Slide Selection Detail Sync

- Status: Needs Review
- Branch: feature/pre-t020-admin-and-fixes
- Scope: Fixed stale right-side detail panel textarea values when switching selected slide cards.

## Changes

- Added `slide.id`-scoped keys to detail panel field labels and textareas.
- Increased the storyboard workspace detail panel width from a fixed `360px` column to responsive `480-560px` desktop columns.
- Increased textarea heights for high-volume fields: core message and visual direction now use 5 rows, and content points uses 7 rows.
- Expanded project and dev sample containers to `max-w-[1500px]` so the wider detail panel does not overly squeeze the slide list.
- Added focused regression coverage for selecting another slide and seeing the image prompt update.
- Kept save/delete actions bound to the selected slide id already captured by the detail panel.

## Verification

- `npm run test -- tests/unit/login-workspace-layout.test.tsx` -> passed in delegated UI-fix pass.
- `npm run test:unit -- tests/unit/login-workspace-layout.test.tsx` -> passed after width adjustment.
- `npm run test:unit` -> passed, 7 files / 16 tests.
- `npm run lint` -> passed.
- `npm run typecheck` -> passed.
- `npm run build` -> passed after sandbox escalation.
- Server-render check: `curl -s http://localhost:3000/dev/storyboard-sample` confirmed the sample storyboard workspace renders.
- In-app browser DOM check at `http://localhost:3010/projects/b16fc1fc-40f9-42aa-afcc-e905958e0d49` confirmed the wider grid classes and textarea row counts.

## Notes

- In-app browser click-through QA was attempted but blocked by `ERR_BLOCKED_BY_CLIENT`; jsdom regression tests cover the selection sync behavior.
