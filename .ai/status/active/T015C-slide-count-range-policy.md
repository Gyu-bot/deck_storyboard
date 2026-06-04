# T015C. Slide count range policy generation integration

- Issue: #14
- Branch: `feature/T015C-slide-count-range-policy`
- Status: In Progress

## Scope

- OpenRouter storyboard generation boundary now uses `slideCountPolicy` instead of a single provider-facing `targetSlideCount`.
- This task covers provider input contract, prompt policy guidance, compatibility mapping, and rationale persistence.
- UI/storage selection was already introduced by T011A and partially plumbed by PR #11; this branch finishes the provider contract and regression coverage.

## Range Policy Mapping

- `auto`: no min/max/preferred count; prompt instructs the model to choose from storyline complexity, section count, page-like markers, and content density.
- `brief`: user selected range 5-8, with preferred count from the stored project preference.
- `standard`: user selected range 9-14, with preferred count from the stored project preference.
- `detailed`: user selected range 15-25, with preferred count from the stored project preference.
- `custom`: provider-facing mode is serialized as `custom_range`; min/max/preferred come from the stored project preference.

## Compatibility Decision

- Existing project/test paths that still set only `targetSlideCount` continue to flow through `exactSlideCountPreference`.
- That compatibility path stores `slideCountMode = custom`, `minSlideCount = targetSlideCount`, `maxSlideCount = targetSlideCount`, and `preferredSlideCount = targetSlideCount`.
- At the OpenRouter boundary, this exact custom preference is serialized as `custom_range` so the provider contract no longer depends on a single `targetSlideCount` field.

## Acceptance Criteria

- OpenRouter storyboard generation input uses slide count policy modes instead of a provider-facing single `targetSlideCount`: covered.
- `story_structure` and `slide_breakdown` requests receive user-selected range, optional preferred count, heuristic marker count, and marker confidence: covered.
- High-confidence marker conflicts require `targetSlideCountRationale` compression/expansion explanation in the LLM request contract: covered.
- `자동` mode allows model-selected count from complexity, section count, page-like markers, and density: covered.
- `직접 범위`/`custom_range` asks for in-range output and rationale when output must fall outside range: covered.
- Exact-count, range, auto, and marker-count-conflict fixtures verify provider request payload and rationale persistence: covered by unit tests.
- Existing `targetSlideCount` project/test data is interpreted through the range policy compatibility path: covered.

## Verification

- RED: `npm run test:unit -- tests/unit/contracts.test.ts` failed on missing `slideCountPolicy` prompt/request contract before implementation.
- GREEN: `npm run test:unit -- tests/unit/contracts.test.ts` passed, 11 files / 45 tests.
- `npm run typecheck`: passed.
- `npm run test:unit`: passed, 11 files / 45 tests.
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm run test:storyboard-sample`: passed after copying ignored sample fixtures into this worktree; output `storyboard sample ok | slides=12 | llm_dummy_calls=story_structure | status=storyboard_review | image_generation=not_started`.
- Independent reviewer pass: no blocking correctness issues; noted that this status file must be included in the PR diff.
