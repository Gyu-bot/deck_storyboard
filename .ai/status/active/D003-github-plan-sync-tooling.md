# D003 GitHub Plan Sync Tooling

- Status: In Progress
- Branch: chore/github-plan-sync-tooling
- Scope: Add reusable tooling and a repo-local skill for syncing `IMPLEMENTATION_PLAN.md` with GitHub Issues and GitHub Project fields.

## User Direction

- GitHub Issue bodies generated from `IMPLEMENTATION_PLAN.md` should render cleanly.
- Do not paste raw task blocks into fenced code blocks in issue bodies.
- Since plan-to-GitHub sync recurs in planning/docs sessions, capture the workflow as a reusable skill and script.

## Changes

- Added `scripts/sync-implementation-plan-github.mjs`.
- Added `npm run github:sync-plan`.
- Added repo-local skill `skills/deck-storyboard-plan-sync/SKILL.md`.
- Updated `AGENTS.md` to prefer the skill/script over ad hoc parsing.
- Updated D001 to Done after merged PR #64 closed Issue #58.
- Added D003 to `IMPLEMENTATION_PLAN.md` for this tooling work.

## Verification

- `npm run github:sync-plan -- --dry-run --task T015E` -> generated renderable Markdown body with no raw plan code fence.
- `npm run github:sync-plan -- --dry-run` -> parsed 45 issue-backed tasks.
- `npm run github:sync-plan -- --verify` -> Project field mismatches 0 after updating D001 to merged state.
- `node --check scripts/sync-implementation-plan-github.mjs` -> passed.
- `npm run lint` -> passed.
- `npm run typecheck` -> passed.
- `npm run test:unit` -> 14 files, 66 tests passed.
- `git diff --check` -> passed.

## Known Gaps

- The script syncs existing issue-backed tasks. Creating new issues for `Issue: None` tasks remains a deliberate manual/planning step.
- GitHub sub-issue creation is still a deliberate action; the skill requires verification, but the script does not infer umbrella relationships automatically.
- `--verify --verify-body` is intended after a full `--apply`; current existing issue bodies may still differ until intentionally regenerated.
