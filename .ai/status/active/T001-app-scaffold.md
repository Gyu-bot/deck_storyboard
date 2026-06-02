# T001 App Scaffold Status

- Task: T001. Next.js 앱 스캐폴드와 기본 런타임 구성
- Branch: feature/T001-app-scaffold
- Status: Needs Review
- Started: 2026-06-02

## Scope

- Create the Next.js App Router + React + TypeScript project scaffold.
- Add Tailwind CSS and shadcn/ui-compatible baseline configuration.
- Render a basic Deck Storyboard app shell on the default route.
- Verify the scaffold with the available static check.

## Progress

- [x] Created package and configuration files.
- [x] Added Tailwind CSS globals and shadcn-compatible `Button` component.
- [x] Added the default route app shell.
- [x] Installed dependencies.
- [x] Ran `npm run lint`.
- [x] Ran `npm run build`.
- [x] Verified the default route in the Codex in-app browser by DOM checks.
- [x] Ran `npm audit --audit-level=high`.

## Notes

- Authentication, database, Docker Compose, and real project workflows are intentionally deferred to later tasks.
- `npm install` required approved network access.
- The first sandboxed `npm run build` failed because Turbopack attempted a restricted process/port operation; the same command passed with approved execution.
- Browser verification loaded `http://127.0.0.1:3000/` and confirmed the title, app shell heading, `Start draft` button, and workflow labels.
- Browser screenshot capture timed out in the in-app browser runtime; DOM verification succeeded.
- `npm audit --audit-level=high` exited successfully, but reported 2 moderate advisories in Next's transitive PostCSS dependency. The suggested forced fix would install a breaking older Next version, so no forced audit fix was applied.
- Package versions were pinned after initial install to keep the scaffold reproducible.
