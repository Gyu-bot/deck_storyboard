# T007 Auth UI

- Status: Done
- Branch: feature/T002-T020-mvp
- Implemented: `/signup`, `/login`, `/logout` route, error display in login form, and login redirect to `/projects`.
- 2026-06-03 update: added reusable authenticated logout actions to project, project creation, project detail, settings, and admin headers.
- Verification: `npm run lint`, `npm run typecheck`; browser smoke confirmed signup redirect, login screen, and login redirect to `/projects` with fake local credentials.
