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

## Task-driven execution policy

Work in this project should proceed by `IMPLEMENTATION_PLAN.md` task IDs whenever practical.

- Treat each task as the default unit for a Codex session, branch, commit set, and PR.
- Use the branch name suggested in `IMPLEMENTATION_PLAN.md` unless there is a clear reason to adjust it.
- Keep each PR traceable to its task ID.
- In every PR body, mention:
  - task ID and task title
  - what was implemented
  - acceptance criteria covered
  - task status file path
  - follow-up work or known gaps
- Do not mark a task `Done` in `IMPLEMENTATION_PLAN.md` until its PR has been merged into `main`.
- Before marking a task `Done` in `IMPLEMENTATION_PLAN.md`, verify every Acceptance Criteria item for that task and change the completed criteria from `[ ]` to `[x]`.
- If any Acceptance Criteria item is not satisfied, do not mark the task `Done`; mark it `Needs Review` or keep it in progress and explain the gap in the task status file.
- If a task is blocked or partially complete, record that in the task-specific status file instead of editing global planning documents during a feature session.
- When one request spans multiple unrelated tasks, split work into separate task branches and PRs when practical.

Planning/documentation cleanup should happen in a dedicated planning/docs session.

- Ordinary feature, fix, refactor, chore, or experiment sessions should not update `IMPLEMENTATION_PLAN.md` unless the user explicitly asks.
- Those sessions should instead update only their task-specific status/backlog file under `.ai/status/active/`.
- Planning/docs sessions should update `IMPLEMENTATION_PLAN.md` by reviewing merged PRs, PR notes, task status files, and direct user instructions.
- New follow-up tasks should be added only when supported by merged PR notes, status files, or explicit user instruction.

Global planning documents should be updated only in dedicated documentation branches, such as:

- `docs/update-project-plan`
- `docs/update-project-status`
- `docs/update-roadmap`

When updating planning documents:

- Use the latest `origin/main` as the source of truth.
- Mark tasks as Done only if their PR has been merged into `main`.
- When marking tasks as Done, check off the verified Acceptance Criteria items in `IMPLEMENTATION_PLAN.md`.
- Add new follow-up tasks only when they are supported by PR notes, status files, or user instruction.
- Mark uncertain items as `Needs Review`.
- Do not modify code files.
