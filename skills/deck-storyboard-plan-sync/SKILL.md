---
name: deck-storyboard-plan-sync
description: Use when syncing deck_storyboard IMPLEMENTATION_PLAN.md tasks with GitHub Issues, GitHub Project Status/Priority fields, or GitHub sub-issues during planning/docs cleanup sessions.
---

# Deck Storyboard Plan Sync

Use this skill for planning/docs sessions that sync `IMPLEMENTATION_PLAN.md` with GitHub Issues and the GitHub Project.

## Core Rules

- Treat `IMPLEMENTATION_PLAN.md` as the task metadata source of truth.
- Keep GitHub Issue title/body and GitHub Project item fields in sync separately.
- Do not use issue labels or issue body text as substitutes for Project fields.
- Reflect task `Status` and `Priority` with GitHub Project fields via `gh project item-edit` or the ProjectV2 API.
- Map priorities consistently: `Critical` -> `P0`, `High` -> `P1`, `Medium` -> `P2`, `Low` -> `P3`.
- Map statuses consistently: `Backlog` -> `Backlog`, `Ready` -> `Ready`, `In Progress` -> `In progress`, `Needs Review` -> `In review`, `Done` -> `Done`.
- Do not embed raw task blocks from `IMPLEMENTATION_PLAN.md` in GitHub Issue bodies as fenced code blocks.
- Build issue bodies as renderable GitHub Markdown sections: `Task`, `Dependency Relationships`, `Acceptance Criteria`, `Notes`, and `Sync Policy`.
- Mirror parent/child task grouping with GitHub sub-issues where practical.

## Recommended Workflow

1. Start from a dedicated docs/planning branch based on the latest `origin/main`.
2. Update `IMPLEMENTATION_PLAN.md` first, then run the sync script in dry-run mode:

   ```bash
   npm run github:sync-plan -- --dry-run
   ```

3. Inspect generated issue bodies for a sample task. They should not contain `## Current Plan Section` or fenced raw plan blocks.
4. Verify Project fields before applying:

   ```bash
   npm run github:sync-plan -- --verify
   ```

5. Apply only when the plan is ready to become the remote source:

   ```bash
   npm run github:sync-plan -- --apply
   ```

6. After applying, verify again:

   ```bash
   npm run github:sync-plan -- --verify
   ```

7. If issue body equality matters after a full apply, run:

   ```bash
   npm run github:sync-plan -- --verify --verify-body
   ```

8. Record GitHub changes and verification results in the relevant `.ai/status/active/` planning status file.

## Scoped Sync

For narrow fixes, limit the run:

```bash
npm run github:sync-plan -- --dry-run --task T015E
npm run github:sync-plan -- --apply --task T015E
npm run github:sync-plan -- --verify --task T015E --verify-body
```

## Safety Checks

- If `--verify` reports Project field mismatches, fix them with `--apply` or inspect whether the plan is stale.
- If `--verify --verify-body` reports body mismatches, inspect whether the remote issue has intentional manual edits before overwriting it.
- If a task has no `Issue: #...`, do not invent an issue number. Create issues only when the user explicitly asks for new task registration, then update `IMPLEMENTATION_PLAN.md`.
- If a parent task or umbrella relationship is added, create or update GitHub sub-issues deliberately and verify the GraphQL relationship.
