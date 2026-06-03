# T017B. Storyboard detail input floating panel UX 수정

- Issue: #8
- Branch: `codex/issues-6-8`
- Status: Needs Review

## Before

- storyboard workspace 오른쪽 상세 입력 panel이 일반 grid item이라 긴 왼쪽 storyboard list를 아래로 스크롤하면 입력란이 화면 밖으로 사라졌다.
- 긴 content tab 입력에서는 panel 자체 scroll boundary가 분리되어 있지 않았다.

## After

- desktop layout에서 상세 panel에 `lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)]`를 적용했다.
- panel header에는 선택 slide summary와 삭제 action을 유지하고, content/prompt/images tab 아래 입력 영역은 내부 `overflow-y-auto` scroll area로 분리했다.
- mobile/narrow viewport에서는 `lg:` sticky만 적용되어 panel이 list 아래로 쌓이는 non-floating fallback을 유지한다.
- dev sample preview와 실제 project detail이 같은 `StoryboardWorkspace` 컴포넌트를 공유하므로 동일한 layout behavior를 사용한다.

## Acceptance Criteria

- desktop에서 오른쪽 panel sticky 유지: covered.
- Content/Prompt tab 주요 textarea, 저장/삭제 action, selected slide summary 접근 가능: covered.
- 긴 입력에서 internal scroll과 page scroll 충돌 방지: covered with internal scroll area.
- header/card/footer/mobile overlap 방지: covered by top offset and mobile fallback.
- mobile/narrow viewport non-floating fallback: covered.
- dev sample preview와 actual project detail shared behavior: covered.
- browser/equivalent visual check: covered.

## Verification

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm test`: passed, 9 files / 30 tests.
- Browser check at `http://localhost:3002/dev/storyboard-sample`: detail panel existed with sticky/max-height classes and `storyboard-detail-scroll-area` had `overflow-y-auto`.
- Browser mobile check at 390x844 on `/dev/storyboard-sample`: panel width was 327px inside a 375px body, confirming the narrow viewport fallback does not squeeze the editor into a desktop side column.
- Actual project detail note: `/projects/{projectId}` uses the same `StoryboardWorkspace` component verified by unit tests and the dev sample route.
