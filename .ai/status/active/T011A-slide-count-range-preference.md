# T011A. Slide count range preference UI와 project contract 정리

- Issue: #7
- Branch: `codex/issues-6-8`
- Status: Needs Review

## Before

- 새 프로젝트 생성 form은 단일 `targetSlideCount` 숫자 입력만 제공했다.
- 저장/LLM 계약도 단일 target count 중심이었다.
- storyline의 page/slide marker 감지와 range 충돌 안내가 없었다.

## After

- 새 프로젝트 생성 form을 `자동`, `간단히`, `표준`, `상세`, `직접 범위` 선택으로 전환했다.
- 기본 선택은 `표준`이고 저장 기본 범위는 9-14 slides다.
- preset 저장 범위:
  - `간단히`: 5-8
  - `표준`: 9-14
  - `상세`: 15-25
- `자동`은 min/max/preferred를 강제하지 않고 LLM prompt에 storyline 구조와 밀도 기준으로 선택하라고 전달한다.
- `직접 범위`는 min/max를 서버에서 1 이상, max >= min, max <= 80으로 validation한다.
- project contract에 `slideCountMode`, `minSlideCount`, `maxSlideCount`, `preferredSlideCount`, marker estimate/confidence를 추가했다.
- 기존 `targetSlideCount` 입력 경로는 `custom` exact range로 계속 동작한다.
- `12페이지`, `Slide 01`, `슬라이드 1`, markdown separator 등은 별도 LLM 호출 없이 heuristic으로 estimate/confidence만 계산한다.
- high/medium confidence marker와 선택 범위가 충돌하면 `targetSlideCountRationale`에 non-blocking notice를 저장한다.

## Acceptance Criteria

- 단일 숫자 입력을 mode/range 선택으로 전환: covered.
- 기본 `표준` 9-14: covered.
- preset ranges 저장: covered.
- `자동` min/max 미강제: covered.
- `직접 범위` validation: covered.
- project 저장 contract range preference 표현: covered.
- 기존 `targetSlideCount` compatibility: covered.
- marker heuristic without LLM: covered.
- marker/range conflict notice: covered.
- browser 또는 equivalent visual check: covered by component render test.

## Verification

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm test`: passed, 9 files / 30 tests.
- `npm run test:storyboard-sample`: passed after copying ignored sample fixtures into this worktree; output `storyboard sample ok | slides=12 | llm_dummy_calls=story_structure | status=storyboard_review | image_generation=not_started`.
- Equivalent visual check: `tests/unit/new-project-form.test.tsx` renders the actual `NewProjectPage` with a mocked session and confirms `자동`, preset options, `직접 범위`, min/max inputs, and default `표준` checked state.
- Browser auth note: in-app browser input automation was unstable in this environment, so authenticated `/projects/new` was covered by equivalent component rendering instead of live form typing.
