## Planning and backlog policy

The repository may contain global planning documents:

- `PRD.md`
- `IMPLEMENTATION_PLAN.md`
- `PROJECT_BACKLOG.md`
- `PROJECT_STATUS.md`
- `ROADMAP.md`
- `DECISIONS.md`

These documents are global project documents.

Feature, fix, refactor, chore, or experiment branches must not update global planning documents unless explicitly instructed.

For implementation work, follow the task ID from `IMPLEMENTATION_PLAN.md`.

Each task branch must create or update only its own branch status file:

`.ai/status/active/<task-id>-<short-name>.md`

At the end of the task, summarize the result in the PR body.

Global planning documents should be updated only in dedicated documentation branches, such as:

- `docs/update-project-plan`
- `docs/update-project-status`
- `docs/update-roadmap`

When updating planning documents:

- Use the latest `origin/main` as the source of truth.
- Mark tasks as Done only if their PR has been merged into `main`.
- Add new follow-up tasks only when they are supported by PR notes, status files, or user instruction.
- Mark uncertain items as `Needs Review`.
- Do not modify code files.