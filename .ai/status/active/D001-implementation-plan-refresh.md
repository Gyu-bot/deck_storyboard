# D001 IMPLEMENTATION_PLAN Refresh

- Status: In Progress
- Branch: docs/fix-global-dev-docs-and-bugs
- Scope: Refresh `IMPLEMENTATION_PLAN.md` from current remote PR/Issue state and local task evidence.

## Remote Snapshot

- Checked open PRs on 2026-06-04: none.
- Checked recent PRs through #40.
- Confirmed merged PRs:
  - PR #38: T009B/T009C admin member and provider key management, closed Issue #13.
  - PR #39: T015C slide count range policy generation integration, closed Issue #14.
  - PR #40: T023 single-slide image generation history, closed Issue #15.
- Confirmed open Issues #17-#35.
- Confirmed Issue #36 and Issue #37 do not exist in the remote repository; D001 is now tracked as Issue #58.

## Plan Updates

- Marked T009B/T015C/T023 as Done with merged PR numbers and checked acceptance criteria that are covered by PR notes, status files, and code evidence.
- Kept T009C as Needs Review because the original OpenAI/Gemini LLM+image key reuse criteria are not fully complete until the T035 direct LLM adapters are implemented or the criteria are explicitly split.
- Marked T023B, T024, and T025 as Ready because T023 is now merged.
- Split broad T027A provider progress work into T027A1/T027A2/T027A3 after real-use feedback showed storyboard generation has no visible pending/progress state.
- Promoted T027A1 to Ready because storyboard LLM generation progress depends only on completed T015B; T024 should not block that immediate UX fix.
- Restored T027A as the parent umbrella for Issue #26 and marked T027A1/T027A2/T027A3 as child tasks that should become GitHub sub-issues under #26 when created.
- Added T035A as a Ready bugfix task after confirming storyboard generation currently checks only the `openrouter` key and fails before considering an assigned OpenAI account-level key.
- Adjusted T035A dependency from T009C to completed T009B because the immediate fallback bugfix depends on PR #38's account-level key storage/admin assignment, not on all remaining T009C direct-provider reuse criteria.
- Added T015E as a Ready prompt-contract bugfix after real-use feedback showed generated slide card content is English instead of Korean; linked the same Korean-first policy to future image generation prompt assembly in T023A.
- Added T015F as a Ready bugfix after confirming `detailed` slide count policy was stored as 15-25/preferred 20, but provider output with 11 slides was accepted without retry or enforcement.
- Added T027C as a Critical provider debug-log task after confirming current image history has limited provider/model/status/prompt snapshots, while LLM provider request/response logs and query UI do not exist.
- Added T023C as a Ready bugfix after real-use testing showed single-image generation failure status/history does not update immediately without refresh.
- Added T023D as a Ready bugfix after confirming OpenRouter-first image routing can still surface a final OpenAI-key-missing error when OpenRouter was attempted and the direct OpenAI fallback key is absent.
- Added T017C as a Ready bugfix after confirming slide-detail `onBlur` saves unchanged fields and marks them `userModified` without value comparison.
- Added T009D/T010A/T011D as Low-priority post-MVP feature tasks for master-admin role revocation, public read-only project sharing, and pre-confirm project generation settings editing.
- Added T007B as a Low-priority auth UI polish task for compact `/signup` email/password input sizing while preserving `/login` spacing.
- Created GitHub Issues #41-#59 for newly split/added active planning tasks and updated their `Issue` fields in `IMPLEMENTATION_PLAN.md`; #59 was later retired when D002 was removed.
- Updated GitHub Project `Deck_storyboard MVP` item fields with `gh project item-edit` for all 46 issue-backed tasks: Status maps `Backlog`/`Ready`/`In Progress`/`Needs Review`/`Done` to Project `Backlog`/`Ready`/`In progress`/`In review`/`Done`, and Priority maps `Critical`/`High`/`Medium`/`Low` to `P0`/`P1`/`P2`/`P3`.
- Linked T027A1/T027A2/T027A3 Issues #53/#54/#55 as GitHub sub-issues of T027A Issue #26.
- Updated README.md and README_KO.md with a dedicated LLM calls / prompt structure section documenting `story_structure`, `slide_breakdown`, image prompt assembly, structured outputs, and the current visualDirection/imagePrompt gap.
- Added T011B as a Needs Review investigation task for an intermittent project creation redirect-to-login report after selecting detailed slide count.
- Added/expanded T011C as a Low-priority minor UI improvement bucket for project creation form polish and project list/detail metadata display, starting with a live 60,000-character storyline counter plus slide-count/style/mockup setting visibility.
- Replaced invalid D001 Issue reference with newly created Issue #58.
- Removed D002 after user decision that `PROJECT_BACKLOG.md`, `PROJECT_STATUS.md`, `ROADMAP.md`, and `DECISIONS.md` would duplicate `IMPLEMENTATION_PLAN.md`, GitHub Issues/Project, `.ai/status/active/`, and git history.
- Closed D002 Issue #59 as `not planned` and removed it from the GitHub Project so it no longer appears as active backlog.
- Marked D001 as In Progress on the current docs branch.

## Verification

- `gh pr list --repo Gyu-bot/deck_storyboard --state open --limit 30 --json number,title,headRefName,url` -> `[]`.
- `gh issue view 36 --repo Gyu-bot/deck_storyboard --json number,title,state,url,closedAt` -> not found.
- `gh issue view 37 --repo Gyu-bot/deck_storyboard --json number,title,state,url,closedAt` -> not found.
- `git diff --check -- IMPLEMENTATION_PLAN.md` -> passed.
- `node tmp/verify-github-project-fields.mjs` -> checked 49 project issue items against plan-backed tasks after umbrella issue additions and D002 project removal, mismatches 0.
- GitHub GraphQL query for Issue #26 sub-issues -> confirmed #53, #54, and #55 are linked under T027A.
- Stale-marker search for invalid Issue #36/#37 references and outdated Ready/Needs Review notes in `IMPLEMENTATION_PLAN.md` -> no matches.
- Independent reviewer pass found that T009C should not be marked Done by redefining OpenAI/Gemini LLM reuse criteria; corrected T009C back to Needs Review.
- Task metadata/dependency audit after latest updates -> 70 tasks, no D002 task, no missing dependencies, no Ready tasks with unfinished dependencies.

## Known Gaps

- This pass did not modify code files.
- D001 cannot be marked Done in `IMPLEMENTATION_PLAN.md` until this branch is merged into `main`.
