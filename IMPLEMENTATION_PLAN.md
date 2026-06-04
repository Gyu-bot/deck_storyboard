# Deck Storyboard Implementation Plan

> This plan is the source of truth for task IDs. Feature sessions should work by task ID, create/update a task-specific status file under `.ai/status/active/`, and avoid editing this global plan unless the user explicitly starts a planning/docs update session.

## Tracking Policy

- **Status values:** `Backlog`, `Ready`, `In Progress`, `Needs Review`, `Done`, `Blocked`
- **Done 기준:** A task is `Done` only after its PR has been merged into `main`.
- **Issue field:** Each task should include an `Issue` field. Use `None` when no GitHub Issue is linked yet.
- **PR field:** Each task should include a `PR` field. Use `None` until the task is completed by a merged PR, then record the closing PR number such as `#123`.
- **GitHub Issue sync:** Create GitHub Issues only for tasks whose `Status` is `Ready` and whose `Issue` field is `None`; after creation, update the task's `Issue` field with the issue number.
- **Default PR 단위:** One task per PR unless this plan explicitly groups tasks or the user approves a different split.
- **Task status file:** Each implementation branch should create or update `.ai/status/active/<task-id>-<short-name>.md`.
- **PR body:** Each PR should be written in Korean and mention the task ID, linked issue number, acceptance criteria covered, status-file path, and any follow-up work. If a task has a linked Issue, include a GitHub closing keyword such as `Closes #123`.
- **Plan updates:** Update this document from merged PRs, PR notes, task status files, or direct user instruction in a dedicated planning/docs session.

---

## Epic E00. Project Foundation

### Feature F00. App Scaffold and Development Baseline

#### Task T001. Next.js 앱 스캐폴드와 기본 런타임 구성
- Priority: High
- Status: Done
- Issue: None
- PR: None
- Depends on: None
- Branch: `feature/T001-app-scaffold`
- Expected PR Unit: `PR-T001`
- Acceptance Criteria:
  - [x] Next.js App Router + React + TypeScript 프로젝트가 생성되어 있다.
  - [x] Tailwind CSS와 shadcn/ui 초기 설정이 완료되어 있다.
  - [x] 기본 라우트가 앱 shell을 렌더링한다.
  - [x] `npm run lint` 또는 동등한 정적 검사가 통과한다.
  - [x] `.ai/status/active/T001-app-scaffold.md`에 작업 결과가 기록되어 있다.
- Notes:
  - 인증, DB, Docker Compose는 후속 Task에서 처리한다.
  - Completed by direct initialization merge to `main` at commit `96ca882`.

#### Task T002. Dockerfile과 Docker Compose 개발 환경 구성
- Priority: High
- Status: Done
- Issue: None
- PR: None
- Depends on: T001
- Branch: `feature/T002-docker-foundation`
- Expected PR Unit: `PR-T002`
- Acceptance Criteria:
  - [x] 앱이 Dockerfile로 빌드된다.
  - [x] Docker Compose로 앱 컨테이너를 실행할 수 있다.
  - [x] `/app/data` 볼륨 경로가 구성되어 있다.
  - [x] honcho 포트 `8000`, `5432`, `6379`와 충돌하지 않는 포트를 사용한다.
  - [x] `.ai/status/active/T002-docker-foundation.md`에 실행 포트와 검증 결과가 기록되어 있다.
- Notes:
  - 컨테이너 실행 전 현재 Docker/포트 상태를 먼저 확인한다.

#### Task T003. 테스트, 린트, 포맷 기본 명령 정리
- Priority: High
- Status: Done
- Issue: None
- PR: None
- Depends on: T001
- Branch: `feature/T003-quality-baseline`
- Expected PR Unit: `PR-T003`
- Acceptance Criteria:
  - [x] 테스트 러너가 설정되어 있다.
  - [x] lint/typecheck 명령이 package script에 정의되어 있다.
  - [x] 최소 smoke test가 추가되어 있다.
  - [x] CI 없이도 로컬에서 검증할 명령 목록이 명확하다.
  - [x] `.ai/status/active/T003-quality-baseline.md`에 검증 명령과 결과가 기록되어 있다.
- Notes:
  - CI 워크플로는 필요해질 때 별도 Task로 추가한다.

#### Task T003A. First screen product-purpose copy 보강
- Priority: Low
- Status: Done
- Issue: #6
- PR: #11
- Depends on: T001
- Branch: `fix/T003A-home-purpose-copy`
- Expected PR Unit: `PR-T003A`
- Acceptance Criteria:
  - [x] 앱 첫 화면에서 Deck Storyboard의 대상 사용자가 "전체 프리젠테이션/제안서/리포트 스토리라인을 이미 가지고 있는 사람"임을 짧게 설명한다.
  - [x] 첫 화면에서 산출물이 최종 납품용 완성 deck이 아니라 초기 skeleton deck 참고자료임을 짧고 명확하게 경고한다.
  - [x] 목적/한계 copy는 한두 줄 수준으로 간결해야 하며, `완성 deck을 만들 수 없음`과 `참고용 skeleton deck` 의미를 모두 포함한다.
  - [x] 첫 화면의 한계 문구는 warning icon, caution notice, 또는 equivalent visual treatment로 일반 설명과 구분된다.
  - [x] 첫 화면 copy가 README/README_KO의 제품 목적 설명과 의미상 일관된다.
  - [x] 첫 화면 copy는 한국어 UI 원칙을 따른다.
  - [x] 브라우저 또는 equivalent visual check로 desktop/mobile 첫 viewport에서 설명 문구가 잘 보이고 과도하게 길지 않은지 확인한다.
  - [x] `.ai/status/active/T003A-home-purpose-copy.md`에 copy before/after와 검증 결과가 기록되어 있다.
- Notes:
  - 2026-06-03 user direction: UI 맨 처음 화면에도 이 프로젝트가 최종 deck generator가 아니라 skeleton deck 참고자료를 만드는 도구라는 점을 명확히 넣는다.
  - 2026-06-03 user direction: README와 첫 화면 모두 "완성 deck은 못 만들고 어디까지나 참고용"이라는 한계를 경고 문구/아이콘으로 명확히 보여준다.
  - 구현 시 README/README_KO의 product-purpose/caution 문구를 기준으로 짧은 first-screen copy로 압축한다.
  - Done by merged PR #11, which closed Issue #6 and verified desktop/mobile first viewport copy.

---

## Epic E01. Persistence and Domain Model

### Feature F01. SQLite and Drizzle Data Model

#### Task T004. SQLite + Drizzle 초기 스키마 구현
- Priority: High
- Status: Done
- Issue: None
- PR: None
- Depends on: T001
- Branch: `feature/T004-drizzle-schema`
- Expected PR Unit: `PR-T004`
- Acceptance Criteria:
  - [x] `User`, `UserApiKey`, `Project`, `Slide`, `SlideImageGeneration`, `ImageGenerationBatch`, `SlideEditOperation` 스키마가 정의되어 있다.
  - [x] `ProjectStatus`에 `storyboard_generation_failed`가 포함되어 있다.
  - [x] `Slide`가 `sectionId`, `sectionTitle`, `fieldEditState`, `imageGenerationStatus`를 저장한다.
  - [x] soft delete를 위한 `deletedAt` 필드가 필요한 테이블에 있다.
  - [x] migration 또는 schema push 절차가 검증되어 있다.
  - [x] `.ai/status/active/T004-drizzle-schema.md`에 스키마 결정과 검증 결과가 기록되어 있다.
- Notes:
  - 실제 AI/provider 연동은 포함하지 않는다.

#### Task T005. 데이터 접근 계층과 사용자 소유권 필터 구현
- Priority: High
- Status: Done
- Issue: None
- PR: None
- Depends on: T004
- Branch: `feature/T005-data-access-ownership`
- Expected PR Unit: `PR-T005`
- Acceptance Criteria:
  - [x] 프로젝트 조회가 `project.userId = currentUser.id` 기준으로 제한된다.
  - [x] soft-deleted project/slide가 기본 조회에서 제외된다.
  - [x] project, slide, image history 접근 함수가 소유권 검사를 포함한다.
  - [x] 소유권 위반 케이스 테스트가 있다.
  - [x] `.ai/status/active/T005-data-access-ownership.md`에 테스트 결과가 기록되어 있다.
- Notes:
  - UI 구현 전 서버 측 guard를 먼저 세운다.

---

## Epic E02. Authentication and API Key Management

### Feature F02. Credentials Authentication

#### Task T006. Auth.js Credentials 기반 세션 구현
- Priority: High
- Status: Done
- Issue: None
- PR: None
- Depends on: T004
- Branch: `feature/T006-auth-session`
- Expected PR Unit: `PR-T006`
- Acceptance Criteria:
  - [x] 이메일/비밀번호 기반 회원가입 API가 있다.
  - [x] 비밀번호가 argon2 또는 bcrypt로 해시되어 저장된다.
  - [x] 로그인/로그아웃이 secure cookie 세션으로 동작한다.
  - [x] 이메일 인증, OAuth, SSO, 2FA, 비밀번호 재설정은 구현되지 않는다.
  - [x] 인증 성공/실패 테스트가 있다.
  - [x] `.ai/status/active/T006-auth-session.md`에 검증 결과가 기록되어 있다.
- Notes:
  - 회원가입 UI는 T007에서 처리한다.

#### Task T007. 회원가입, 로그인, 로그아웃 UI 구현
- Priority: High
- Status: Done
- Issue: None
- PR: None
- Depends on: T006
- Branch: `feature/T007-auth-ui`
- Expected PR Unit: `PR-T007`
- Acceptance Criteria:
  - [x] `/signup` 화면에 이메일, 비밀번호, 비밀번호 확인 입력이 있다. Provider API key 입력은 T009A 이후 관리자 할당 flow로 이동했다.
  - [x] `/login` 화면에 이메일/비밀번호 입력과 로그인 버튼이 있다.
  - [x] 로그아웃 action 또는 `/logout` route가 동작한다.
  - [x] 로그인 후 `/projects`로 이동한다.
  - [x] 실패 시 사용자에게 에러 메시지를 표시한다.
  - [x] 브라우저 또는 equivalent visual check로 주요 화면을 확인했다.
  - [x] `.ai/status/active/T007-auth-ui.md`에 확인 결과가 기록되어 있다.
- Notes:
  - Settings의 key 교체/삭제는 T009에서 처리한다.
  - 2026-06-03 user-directed Korean UI pass localized signup/login copy and verified the updated smoke CTA.
  - 2026-06-03 PR #1 merged: signup API key 입력은 제거되었고 provider key 할당은 관리자 화면에서 처리한다.

#### Task T007A. Login layout vertical spacing UX 수정
- Priority: High
- Status: Done
- Issue: None
- PR: None
- Depends on: T007
- Branch: `fix/T007A-login-layout-spacing`
- Expected PR Unit: `PR-T007A`
- Acceptance Criteria:
  - [x] `/login` 화면의 세로 여백이 과도하지 않고 첫 viewport 안에서 자연스럽게 보인다.
  - [x] desktop과 mobile viewport에서 로그인 form, heading, 보조 링크가 과하게 분리되지 않는다.
  - [x] signup 화면과 login 화면의 spacing rhythm이 일관된다.
  - [x] 로그인 실패 메시지 표시 시 레이아웃이 크게 밀리지 않는다.
  - [x] 브라우저 또는 equivalent visual check로 `/login` 주요 viewport를 확인했다.
  - [x] `.ai/status/active/T007A-login-layout-spacing.md`에 before/after 확인 결과가 기록되어 있다.
- Notes:
  - 2026-06-03 user feedback: 현재 `/login` 화면은 세로 방향 여백이 너무 크다.
  - Done by merged PR #1, with unit/layout checks and in-app browser DOM verification recorded in the task status file.

#### Task T007B. Auth form compact input sizing UI polish
- Priority: Low
- Status: Backlog
- Issue: #41
- PR: None
- Depends on: T007, T007A
- Branch: `fix/T007B-auth-form-compact-inputs`
- Expected PR Unit: `PR-T007B`
- Acceptance Criteria:
  - [ ] `/signup` 화면의 이메일, 비밀번호, 비밀번호 확인 입력 박스가 과도하게 큰 세로 높이로 렌더링되지 않고 로그인 화면과 일관된 compact input height를 사용한다.
  - [ ] `/signup` form card, label, input, button spacing이 desktop/mobile viewport에서 자연스럽고 첫 화면에서 불필요하게 늘어나지 않는다.
  - [ ] `/login` 화면의 기존 spacing 개선을 깨지 않고 auth form rhythm이 두 화면에서 일관된다.
  - [ ] 브라우저 또는 equivalent visual check로 `/signup`과 `/login`의 주요 viewport를 확인했다.
  - [ ] `.ai/status/active/T007B-auth-form-compact-inputs.md`에 before/after 화면 확인과 검증 결과가 기록되어 있다.
- Notes:
  - 2026-06-04 user feedback: `/signup` 페이지에서 이메일/비밀번호 입력 박스의 세로 길이가 과도하게 길어 보이며, 굳이 길 필요가 없다.
  - This is a low-priority UI polish item and can be bundled with other minor UI improvement work in a single polish PR if practical.

### Feature F03. User API Key Management

#### Task T008. API key AES-GCM 암호화 저장 구현
- Priority: High
- Status: Done
- Issue: None
- PR: None
- Depends on: T004
- Branch: `feature/T008-api-key-encryption`
- Expected PR Unit: `PR-T008`
- Acceptance Criteria:
  - [x] `API_KEY_ENCRYPTION_SECRET` 기반 AES-GCM 암호화/복호화 유틸이 있다.
  - [x] DB에는 full plaintext API key가 저장되지 않는다.
  - [x] production에서 secret이 없으면 key 저장이 비활성화되거나 startup이 실패한다.
  - [x] OpenRouter, Nano Banana, OpenAI Images provider key 저장을 지원한다.
  - [x] 암호화 round-trip과 secret 누락 테스트가 있다.
  - [x] `.ai/status/active/T008-api-key-encryption.md`에 검증 결과가 기록되어 있다.
- Notes:
  - provider connection test는 초기 MVP 필수가 아니다.
  - 향후 provider key는 이미지 전용 key(`openai_images`, `nano_banana`)가 아니라 계정/provider 단위 key(`openrouter`, `openai`, `anthropic`, `gemini`)로 통합한다.
  - 같은 provider account key를 LLM 호출과 해당 provider의 이미지 생성 호출에 함께 사용할 수 있게 한다.

#### Task T009. Settings API key 관리 화면 구현
- Priority: High
- Status: Done
- Issue: None
- PR: None
- Depends on: T007, T008
- Branch: `feature/T009-api-key-settings`
- Expected PR Unit: `PR-T009`
- Acceptance Criteria:
  - [x] `/settings`에서 OpenRouter, Nano Banana, OpenAI Images key를 추가/교체/삭제할 수 있다.
  - [x] 저장된 key는 masked form으로만 표시된다.
  - [x] key 삭제 후 해당 provider의 신규 호출이 차단된다.
  - [x] Settings 화면은 key presence를 보여주되 자동 provider validation call을 하지 않는다.
  - [x] 브라우저 또는 equivalent visual check로 add/replace/remove flow를 확인했다.
  - [x] `.ai/status/active/T009-api-key-settings.md`에 확인 결과가 기록되어 있다.
- Notes:
  - 서버 fallback provider key는 사용하지 않는다.
  - 2026-06-03 user-directed Korean UI pass localized Settings key-management copy.
  - T009A 이후 일반 사용자의 self-service provider key 관리는 제거한다.
  - 일반 사용자 로그인 시 API 설정 메뉴는 노출하지 않는다. 필요한 경우 key 상태 확인은 관리자 화면에서만 처리한다.
  - T009C 이후 이미지 provider 전용 key 관리는 account-level provider key 관리로 대체한다.

---

## Epic E02A. MVP Admin User and API Key Management

MVP scope:

- Users sign up and log in without entering provider API keys.
- Normal users do not see or use an API settings menu after login.
- Admins assign account-level provider keys to users before live LLM/image generation is connected.
- Admins can add and delete user accounts from the admin workflow.
- Account-level provider keys are shared across LLM and image generation paths where the provider supports both.
- Admin/member management is an MVP prerequisite, not a post-MVP feature.

### Feature F03A. Admin-Managed Membership and Provider Keys

#### Task T009A. User signup/login simplification and admin role foundation 구현
- Priority: High
- Status: Done
- Issue: None
- PR: None
- Depends on: T006, T007, T008
- Branch: `feature/T009A-admin-role-auth-simplification`
- Expected PR Unit: `PR-T009A`
- Acceptance Criteria:
  - [x] `/signup`은 이메일, 비밀번호, 비밀번호 확인만 받는다.
  - [x] 일반 회원 가입 시 OpenRouter, OpenAI, Claude/Anthropic, Gemini 등 provider API key 입력은 요구하지 않는다.
  - [x] 일반 사용자 로그인 후 primary navigation/header에 API 설정 또는 provider key 설정 메뉴가 노출되지 않는다.
  - [x] 일반 사용자가 `/settings` 또는 legacy API key settings route에 직접 접근해도 key 추가/교체/삭제 self-service UI를 사용할 수 없다.
  - [x] 일반 사용자는 자신의 API key full value를 입력, 교체, 조회할 수 없다.
  - [x] 관리자 권한을 식별할 수 있는 user role 또는 equivalent admin flag가 DB와 session에 반영된다.
  - [x] 관리자 권한이 없는 사용자는 admin routes/pages/API에 접근할 수 없다.
  - [x] 기존 key encryption/storage contract는 관리자 할당 flow에서도 재사용된다.
  - [x] signup/login/auth regression test가 있다.
  - [x] `.ai/status/active/T009A-admin-role-auth-simplification.md`에 검증 결과가 기록되어 있다.
- Notes:
  - 2026-06-03 user direction: 회원은 가입 시 API key 입력 없이 회원 가입과 로그인만 수행한다.
  - API key 할당 책임은 일반 사용자 self-service에서 관리자 관리 방식으로 이동한다.
  - 2026-06-03 user direction: 일반 계정에는 API 설정 메뉴가 필요하지 않다.
  - Done by merged PR #1 and reinforced by merged PR #2, which made `/settings` admin-only and hid settings navigation from normal members.

#### Task T009B. Admin member and API key management page 구현
- Priority: High
- Status: Done
- Issue: #13
- PR: #38
- Depends on: T009A
- Branch: `feature/T009B-admin-member-key-management-page`
- Expected PR Unit: `PR-T009B + PR-T009C`
- Acceptance Criteria:
  - [x] 관리자 전용 `/admin` 또는 `/admin/users` 회원관리 화면이 있다.
  - [x] 관리자 화면에서 회원 목록, 이메일, 가입일, 최근 수정일, 계정 상태, provider key 할당 상태를 한 화면에서 볼 수 있다.
  - [x] 관리자는 admin workflow에서 신규 회원 계정을 추가할 수 있다.
  - [x] 관리자는 admin workflow에서 회원 계정을 삭제 또는 비활성화할 수 있으며, 삭제/비활성화된 계정은 일반 로그인과 프로젝트 접근이 차단된다.
  - [x] 회원 삭제/비활성화는 기존 프로젝트/슬라이드 데이터 보존 정책을 명확히 따른다.
  - [x] 회원 검색 또는 최소한 이메일 기준 filtering이 가능하다.
  - [x] 회원 상세 또는 expandable row에서 회원별 OpenRouter, OpenAI, Anthropic/Claude, Gemini API key 할당 상태를 확인할 수 있다.
  - [x] 회원별 API key 추가/교체/삭제 action으로 이동하거나 같은 화면에서 inline으로 실행할 수 있다.
  - [x] 저장된 API key 값은 masked form 또는 assigned/unassigned 상태로만 표시되고 full value는 노출되지 않는다.
  - [x] 회원별 generation 가능 여부를 provider key assignment 상태 기준으로 판단할 수 있다.
  - [x] 관리자 화면은 일반 프로젝트 작업 화면과 명확히 분리된다.
  - [x] 관리자 권한이 없는 접근은 login 또는 forbidden 상태로 차단된다.
  - [x] 브라우저 또는 equivalent visual check로 admin access control, 회원 추가/삭제, 회원 목록, 회원별 API key 관리 UI를 확인했다.
  - [x] `.ai/status/active/T009B-admin-member-key-management-page.md`에 검증 결과가 기록되어 있다.
- Notes:
  - 2026-06-03 user direction: 관리자는 회원 계정 추가/삭제와 회원별 API key setting을 모두 수행할 수 있어야 한다.
  - 회원 삭제는 hard delete와 soft delete/disabled status 중 구현 전 결정하고, 프로젝트/슬라이드 소유 데이터 처리 정책을 status에 기록한다.
  - 회원관리와 회원별 API key 관리는 별도 흩어진 화면보다 같은 admin workflow 안에서 처리한다.
  - Merged PR #1/#2 implemented admin-only member list and member-scoped provider key controls.
  - Done by merged PR #38, which closed Issue #13 and added admin member creation, grant-admin, soft-disable, soft-delete, data preservation policy, provider key controls, and browser verification.
  - Follow-up: 계정 삭제는 soft-delete이며, 기존 프로젝트/슬라이드 데이터 정리나 복구 UI는 별도 후속 범위다.

#### Task T009C. Admin-managed user API key assignment 구현
- Priority: High
- Status: Needs Review
- Issue: #42
- PR: None
- Depends on: T009B, T008
- Branch: `feature/T009B-admin-member-key-management-page`
- Expected PR Unit: `PR-T009B + PR-T009C`
- Acceptance Criteria:
  - [x] 관리자는 회원별 OpenRouter, OpenAI, Anthropic/Claude, Gemini account-level provider key를 추가/교체/삭제할 수 있다.
  - [x] 회원별 API key 설정은 admin user/account management workflow 안에서 수행되며, 일반 사용자 Settings 메뉴로 분리하지 않는다.
  - [x] 저장된 key는 모든 UI/API response에서 masked form 또는 presence status로만 노출된다.
  - [x] 일반 사용자 generation flow는 관리자에게 할당된 user-scoped account-level provider key만 사용한다.
  - [ ] OpenAI key는 OpenAI LLM과 OpenAI image generation에 함께 사용할 수 있다.
  - [ ] Gemini key는 Gemini LLM과 Gemini/Nano Banana image generation에 함께 사용할 수 있다.
  - [x] OpenRouter key는 MVP storyboard generation 기본 LLM provider key로 사용할 수 있다.
  - [x] Claude는 Anthropic account key로 저장/관리하되 LLM 호출 연결은 MVP 이후 T035에서 처리한다.
  - [x] key 미할당 회원이 storyboard/image generation을 실행하면 provider-key error가 명확히 표시된다.
  - [x] 관리자 key 변경/삭제 후 해당 회원의 신규 provider 호출 정책이 즉시 반영된다.
  - [x] key assignment audit metadata 또는 operation history를 남길지 구현 전 결정하고, 결정 내용을 status에 기록한다.
  - [x] admin API negative test와 encryption round-trip regression test가 있다.
  - [x] `.ai/status/active/T009C-admin-api-key-assignment.md`에 검증 결과가 기록되어 있다.
- Notes:
  - 서버 fallback provider key는 계속 사용하지 않는다.
  - 일반 사용자 `/settings` API key menu는 T009C 이후 제거한다.
  - MVP key policy: 이미지 전용 API key를 별도로 받지 않고 provider account key를 LLM과 이미지 생성에 공통 사용한다.
  - Merged PR #2 completed the OpenRouter path for storyboard generation with admin-assigned user keys.
  - Merged PR #38 closed Issue #13 and moved provider key assignment into the admin-managed account-level workflow.
  - Needs Review because OpenAI/Gemini image generation uses account-level keys, but direct OpenAI/Gemini LLM adapter calls remain deferred to T035; a planning follow-up should decide whether to split the original LLM+image reuse criteria into T035 or reopen/link a dedicated issue.
  - Follow-up: key operation audit trail remains outside MVP until there is a product requirement for compliance-grade key history.

#### Task T009D. Master admin and admin role revocation 구현
- Priority: Low
- Status: Backlog
- Issue: #43
- PR: None
- Depends on: T009B
- Branch: `feature/T009D-master-admin-role-management`
- Expected PR Unit: `PR-T009D`
- Acceptance Criteria:
  - [ ] 관리자 화면에서 기존 관리자 회원을 일반 회원 권한으로 되돌릴 수 있다.
  - [ ] 관리자 권한 부여와 권한 회수 action이 같은 member management workflow 안에서 일관된 UI로 제공된다.
  - [ ] 최소 한 명의 master admin 또는 equivalent protected super-admin role이 존재해 모든 관리자가 실수로 권한을 잃는 상태를 방지한다.
  - [ ] master admin은 일반 관리자에게 관리자 권한을 부여/회수할 수 있지만, 일반 관리자는 master admin 권한을 회수하거나 master admin을 비활성화/삭제할 수 없다.
  - [ ] 현재 로그인한 관리자가 자기 자신의 마지막 admin/master-admin 권한을 제거하려는 경우 명확하게 차단된다.
  - [ ] 권한 변경 후 session/admin route access가 즉시 또는 다음 요청부터 일관되게 반영된다.
  - [ ] 권한 부여/회수/차단 케이스에 대한 admin API negative tests와 browser/equivalent UI check가 있다.
  - [ ] `.ai/status/active/T009D-master-admin-role-management.md`에 role model, protected account policy, 검증 결과가 기록되어 있다.
- Notes:
  - 2026-06-04 user direction: 현재는 관리자 권한 부여만 있으므로, 관리자 권한을 다시 일반 권한으로 바꾸는 기능도 필요하다.
  - 2026-06-04 user direction: master admin은 별도로 있어야 한다.
  - This is post-MVP low-priority admin hardening and should not block MVP provider key assignment work.

---

## Epic E03. Project Workspace

### Feature F04. Project List and CRUD

#### Task T010. 프로젝트 목록과 soft delete 구현
- Priority: High
- Status: Done
- Issue: None
- PR: None
- Depends on: T005, T007
- Branch: `feature/T010-project-list`
- Expected PR Unit: `PR-T010`
- Acceptance Criteria:
  - [x] 로그인 후 `/projects`에서 사용자 소유 프로젝트 목록을 볼 수 있다.
  - [x] 프로젝트는 `updatedAt` 내림차순으로 정렬된다.
  - [x] 프로젝트 생성, 열기, 이름 변경, 삭제 action이 있다.
  - [x] 삭제는 `deletedAt` 설정으로 처리되고 기본 목록에서 사라진다.
  - [x] 다른 사용자의 프로젝트가 노출되지 않는다.
  - [x] `.ai/status/active/T010-project-list.md`에 검증 결과가 기록되어 있다.
- Notes:
  - 새 프로젝트 상세 생성 form은 T011에서 처리한다.
  - 2026-06-03 user-directed Korean UI pass localized project list status labels and project actions.

#### Task T010A. Public/read-only shared project browsing 구현
- Priority: Low
- Status: Backlog
- Issue: #44
- PR: None
- Depends on: T010, T011, T016
- Branch: `feature/T010A-public-readonly-project-sharing`
- Expected PR Unit: `PR-T010A`
- Acceptance Criteria:
  - [ ] 프로젝트 생성 시 공개/비공개 visibility를 선택할 수 있고 기본값은 비공개다.
  - [ ] 프로젝트 visibility는 DB와 API response에 저장되며, 기존 프로젝트는 migration/compatibility path로 비공개 처리된다.
  - [ ] 공개 프로젝트라도 storyboard가 확정되기 전에는 다른 회원의 프로젝트 목록에 노출되지 않는다.
  - [ ] 프로젝트 목록은 내 프로젝트와 공유된 공개 프로젝트를 함께 보여주되, 각 카드에 `내 프로젝트`/`공유 프로젝트` 구분이 명확히 표시된다.
  - [ ] 공유 프로젝트는 소유자가 아니어도 읽기전용으로 project detail을 열 수 있다.
  - [ ] 소유자가 아닌 공유 프로젝트에서는 이름 변경, 삭제, 스토리보드 생성/확정, 슬라이드 편집, reorder/add/delete, 목업 생성/선택, export 상태 변경 등 mutation action이 노출되지 않거나 서버에서 차단된다.
  - [ ] 공유 프로젝트 detail은 slide content, visual direction, image prompt, selected/generated image history 등 검토용 정보는 볼 수 있지만 편집 가능한 input으로 표시하지 않는다.
  - [ ] 소유자가 공개 프로젝트를 비공개로 바꾸면 이후 다른 회원 목록/detail 접근에서 사라지거나 forbidden 처리된다.
  - [ ] ownership/read-only authorization tests cover private project isolation, public confirmed read-only access, non-owner mutation rejection, and owner-only editing.
  - [ ] Browser or equivalent workflow check confirms project list ownership labels and read-only shared project detail behavior.
  - [ ] `.ai/status/active/T010A-public-readonly-project-sharing.md`에 visibility model, read-only permission matrix, 검증 결과가 기록되어 있다.
- Notes:
  - 2026-06-04 user direction: 스토리라인/스토리보드가 확정된 공개 프로젝트는 다른 회원 프로젝트 목록에도 공유되어 보여야 한다.
  - 2026-06-04 user direction: 프로젝트 생성 시 공개/비공개 여부를 선택하고, 공개인 경우만 공유한다.
  - 2026-06-04 user direction: 내 프로젝트가 아닌 공유 프로젝트는 읽기전용으로 보기만 가능해야 한다.
  - This is post-MVP low-priority collaboration/sharing work and should not weaken the current owner-only mutation guarantees.

### Feature F05. New Project Creation

#### Task T011. 새 프로젝트 one-page 생성 form 구현
- Priority: High
- Status: Done
- Issue: None
- PR: None
- Depends on: T010
- Branch: `feature/T011-new-project-form`
- Expected PR Unit: `PR-T011`
- Acceptance Criteria:
  - [x] `/projects/new`가 one-page form으로 구현되어 있다.
  - [x] Project name과 Storyline input이 기본 visible field로 제공된다.
  - [x] Slide count, AI options, Style settings, Image settings가 collapsible section으로 제공된다.
  - [x] `MAX_STORYLINE_CHARACTERS=60000` 기본 제한을 초과하면 LLM 호출 전 validation message를 표시한다.
  - [x] 생성 후 project가 `draft_input` 또는 generation-ready 상태로 저장된다.
  - [x] 브라우저 또는 equivalent visual check로 form layout과 validation을 확인했다.
  - [x] `.ai/status/active/T011-new-project-form.md`에 확인 결과가 기록되어 있다.
- Notes:
  - 실제 storyboard generation 호출은 T014 이후에 연결한다.
  - 2026-06-03 user-directed Korean UI pass localized the new-project form, option labels, and creation guidance copy.

#### Task T011A. Slide count range preference UI와 project contract 정리
- Priority: High
- Status: Done
- Issue: #7
- PR: #11
- Depends on: T011
- Branch: `feature/T011A-slide-count-range-preference`
- Expected PR Unit: `PR-T011A`
- Acceptance Criteria:
  - [x] 새 프로젝트 생성 form의 단일 `targetSlideCount` 숫자 입력을 `자동`, `간단히`, `표준`, `상세`, `직접 범위` 선택으로 바꾼다.
  - [x] 기본 선택은 `표준`이며 기본 범위는 9-14 slides다.
  - [x] `간단히`는 5-8 slides, `표준`은 9-14 slides, `상세`는 15-25 slides로 저장된다.
  - [x] `자동`은 min/max를 강제하지 않고 storyline의 구조와 밀도를 기준으로 LLM이 적정 slide count를 정하게 한다.
  - [x] `직접 범위`는 사용자가 min/max slide count를 입력할 수 있고, min은 1 이상, max는 min 이상, max는 MVP 상한을 넘지 않도록 validation한다.
  - [x] project 저장 contract가 `slideCountMode`, `minSlideCount`, `maxSlideCount`, optional `preferredSlideCount` 또는 동등한 range preference를 표현한다.
  - [x] 기존 `targetSlideCount` 기반 project와 sample/test data가 migration 또는 compatibility path로 계속 생성/조회된다.
  - [x] storyline 안의 명시적 page/slide marker는 별도 LLM 호출 없이 regex/heuristic으로 confidence와 estimated count만 산출한다.
  - [x] high-confidence marker count와 사용자가 선택한 범위가 충돌하면 생성 전 non-blocking notice 또는 생성 후 rationale로 사용자가 차이를 이해할 수 있다.
  - [x] 브라우저 또는 equivalent visual check로 `자동`, preset range, 직접 범위 입력 UX를 확인했다.
  - [x] `.ai/status/active/T011A-slide-count-range-preference.md`에 range 기본값, migration/compatibility 결정, 검증 결과가 기록되어 있다.
- Notes:
  - 2026-06-03 user direction: 스토리라인은 정확한 page count보다 대략적인 범위로 잡는 경우가 많으므로, MVP 입력도 정확한 숫자보다 slide count range 중심으로 전환한다.
  - 명시적 page marker 감지는 비용 없는 heuristic으로만 처리하고, 별도 LLM preflight call은 추가하지 않는다.
  - Heuristic 예시는 `12페이지`, `12 pages`, `12 slides`, `Page 1`, `Slide 01`, `슬라이드 1`, 반복되는 markdown heading/page separator 등이다.
  - Heuristic 결과는 강제 규칙이 아니라 LLM prompt와 user-facing rationale을 보강하는 advisory signal로 취급한다.
  - Done by merged PR #11, which closed Issue #7 and added range UI, storage compatibility, marker heuristics, and visual/equivalent checks.

#### Task T011B. Intermittent project creation redirect-to-login investigation
- Priority: High
- Status: Needs Review
- Issue: #45
- PR: None
- Depends on: T006, T007, T011, T011A
- Branch: `fix/T011B-project-create-login-redirect`
- Expected PR Unit: `PR-T011B`
- Acceptance Criteria:
  - [ ] 실제 브라우저 workflow에서 project name, storyline, slide count `상세` 선택 후 `프로젝트 만들기`를 눌렀을 때 login 화면으로 튕기는 현상을 재현하거나, 재현 실패 시 시도 조건과 관측 로그를 status file에 기록한다.
  - [ ] `/api/projects` create route, Auth.js session/JWT cookie, redirect target, request origin/host(`localhost` vs `127.0.0.1`), and dev `NEXTAUTH_URL` alignment를 조사한다.
  - [ ] slide count mode가 `detailed`인 경우에도 session이 유지되고 project가 생성/저장/redirect 되는지 확인한다.
  - [ ] 인증 만료, CSRF/origin mismatch, route error, validation error, DB write failure, host mismatch 중 어느 boundary에서 `/login`으로 이동하는지 evidence를 남긴다.
  - [ ] root cause가 확인되기 전에는 symptom-only fix를 적용하지 않는다.
  - [ ] fix가 필요한 경우 project creation regression test 또는 browser/equivalent check로 `표준`, `상세`, `직접 범위` 생성 후 로그인 유지와 project detail redirect를 검증한다.
  - [ ] `.ai/status/active/T011B-project-create-login-redirect.md`에 재현 조건, 로그, 원인, 검증 결과를 기록한다.
- Notes:
  - 2026-06-04 real-use report: 새 프로젝트에서 project name과 storyline을 입력하고 slide count를 `표준`이 아닌 `상세`로 선택한 뒤 `프로젝트 만들기`를 누르자 초기 로그인 화면으로 튕겼다.
  - User noted the issue is not consistently reproducible, so treat this as investigation-first bugfix work.
  - Current local testing has used both `localhost:3000` and `127.0.0.1:3000`; include host/cookie/session alignment in the investigation.

#### Task T011C. Project creation and metadata display minor UX improvements
- Priority: Low
- Status: Backlog
- Issue: #46
- PR: None
- Depends on: T011, T011A
- Branch: `feature/T011C-project-metadata-minor-ux`
- Expected PR Unit: `PR-T011C`
- Acceptance Criteria:
  - [ ] 프로젝트 생성 화면의 storyline 입력란이 현재 입력 글자수와 최대 글자수 60,000자를 함께 표시한다.
  - [ ] 글자수 카운터는 입력 중 실시간으로 갱신되고, 제한에 가까워질 때 사용자가 상태를 쉽게 인지할 수 있다.
  - [ ] 60,000자 초과 입력에 대한 기존 validation/error behavior와 카운터 표시가 서로 충돌하지 않는다.
  - [ ] 모바일/좁은 화면에서도 카운터가 입력란, helper text, error text와 겹치지 않는다.
  - [ ] 프로젝트 목록 카드에서 프로젝트 생성 시 선택한 slide count mode/range, style template, aspect ratio, default image model/mockup setting이 제목/상태와 함께 작게 표시된다.
  - [ ] 프로젝트 상세 화면 header에서도 현재 단계 아래 또는 인접한 metadata row로 slide count mode/range, style template, aspect ratio, default image model/mockup setting이 작게 표시된다.
  - [ ] 표시 label은 한국어 UI 원칙을 따르고, `auto`, `brief`, `standard`, `detailed`, `custom_range`, `gpt-image-2`, `nano-banana` 같은 내부 값은 사용자에게 이해 가능한 한국어/제품명으로 매핑한다.
  - [ ] metadata display는 긴 project title, 좁은 화면, action button 영역과 겹치지 않고 wrap 가능한 compact chip/text 형태로 표시된다.
  - [ ] 같은 프로젝트 생성/목록/상세 metadata 관련 minor UI 개선사항이 생기면 이 task 범위에 함께 묶을 수 있다.
  - [ ] 브라우저 또는 equivalent visual check로 빈 입력, 일반 입력, 제한 근접/초과 상태와 프로젝트 목록/상세 metadata 표시를 확인했다.
  - [ ] `.ai/status/active/T011C-project-metadata-minor-ux.md`에 반영 UI 개선사항과 검증 결과가 기록되어 있다.
- Notes:
  - 2026-06-04 user direction: storyline 입력에 60,000자 제한이 있으므로 실제 입력된 글자수가 카운팅되면 좋겠다.
  - 2026-06-04 user direction: 프로젝트 목록과 프로젝트 상세 header에서 생성 시 선택한 슬라이드 수, 스타일 설정, 목업 설정을 볼 수 있어야 한다.
  - 이 task는 minor UX 개선 묶음이며, 프로젝트 생성/목록/상세의 blocking bugfix와 분리해 낮은 우선순위로 처리한다.

#### Task T011D. Pre-confirm project generation settings editing 구현
- Priority: Low
- Status: Backlog
- Issue: #47
- PR: None
- Depends on: T011A, T012, T016
- Branch: `feature/T011D-preconfirm-project-settings-edit`
- Expected PR Unit: `PR-T011D`
- Acceptance Criteria:
  - [ ] 스토리보드 확정 전 project detail 또는 project settings surface에서 slide count mode/range를 수정할 수 있다.
  - [ ] 스토리보드 확정 전 style template, custom common style prompt, aspect ratio, default image/mockup model을 수정할 수 있다.
  - [ ] 이미 생성된 storyboard가 확정 전 상태에서 존재할 때 생성 설정을 변경하면 기존 storyboard/slide/image prompt 결과를 유지할지 폐기/재생성 필요 상태로 표시할지 명확한 확인 UX를 제공한다.
  - [ ] 설정 변경 후 새 storyboard generation은 변경된 slide count/style/mockup model settings를 사용한다.
  - [ ] 스토리보드 확정 이후에는 해당 생성 설정을 기본적으로 잠그고, 후속 수정이 필요하면 별도 재생성 workflow 또는 명확한 destructive confirmation을 요구한다.
  - [ ] 프로젝트 목록/상세 metadata display(T011C)와 설정 편집 화면의 label/value mapping이 일관된다.
  - [ ] 권한 없는 사용자와 공유 read-only 프로젝트에서는 설정 수정 action이 노출되지 않거나 서버에서 차단된다.
  - [ ] Unit/API tests cover editable statuses, locked confirmed status, changed slide count/style/mockup persistence, and unauthorized edit rejection.
  - [ ] Browser or equivalent workflow check confirms settings can be edited before storyboard confirmation and are locked after confirmation.
  - [ ] `.ai/status/active/T011D-preconfirm-project-settings-edit.md`에 editable status policy, regeneration/reset decision, 검증 결과가 기록되어 있다.
- Notes:
  - 2026-06-04 user direction: 스토리보드 확정 전에는 프로젝트 선택사항(슬라이드 수, 스타일, 목업 모델)을 수정할 수 있어야 한다.
  - This is a post-MVP low-priority feature; MVP can continue treating project generation settings as create-time settings.

#### Task T012. 스타일 템플릿과 이미지 설정 구현
- Priority: High
- Status: Done
- Issue: None
- PR: None
- Depends on: T011
- Branch: `feature/T012-style-image-settings`
- Expected PR Unit: `PR-T012`
- Acceptance Criteria:
  - [x] Executive Consulting, Strategy Proposal, Minimal White, Dark Executive, Technical Architecture 템플릿이 있다.
  - [x] custom common style prompt를 저장한다.
  - [x] aspect ratio `16:9`, `4:3`를 지원하고 기본값은 `16:9`다.
  - [x] default image model은 `gpt-image-2`와 `nano-banana` 중 선택할 수 있다.
  - [x] resolved common prompt가 project style에 저장된다.
  - [x] `.ai/status/active/T012-style-image-settings.md`에 검증 결과가 기록되어 있다.
- Notes:
  - provider key 존재 여부 validation은 이미지 생성 시점에서 처리한다.
  - MVP 이미지 모델 선택은 기존 default image model 기반으로 유지하되, provider key는 account-level key를 쓰는 방향으로 T009C/T021/T022에서 전환한다.
  - LLM provider/model 선택 UI는 MVP 이후 T036에서 처리한다.

---

## Epic E04. Storyboard Generation

### Feature F06. LLM Provider and Structured Output

#### Task T013. OpenRouter LLM provider와 Zod schema 구현
- Priority: High
- Status: Done
- Issue: None
- PR: None
- Depends on: T008, T012
- Branch: `feature/T013-openrouter-structured-output`
- Expected PR Unit: `PR-T013`
- Acceptance Criteria:
  - [x] `story_structure`와 `slide_breakdown` task를 지원하는 OpenRouter provider가 있다.
  - [x] StoryStructure, StoryImprovementSuggestion, SlideBreakdown output Zod schema가 있다.
  - [x] invalid output은 accepted storyboard data로 저장되지 않는다.
  - [x] validation failure는 한 번 retry 후 stage-specific error로 surfaced 된다.
  - [x] OpenRouter key가 없으면 server fallback 없이 provider-key error를 반환한다.
  - [x] provider unit test와 schema validation test가 있다.
  - [x] `.ai/status/active/T013-openrouter-structured-output.md`에 검증 결과가 기록되어 있다.
- Notes:
  - Phase 5용 `merge_slides`, `split_slide`, `insert_slide`는 예약만 하고 구현하지 않는다.
  - 현재 완료 범위는 structured output schema, provider boundary, validation/retry contract다.
  - 실제 OpenRouter HTTP 호출 연결은 샘플 출력 객체 기반 계약 테스트가 고정된 뒤 T015B에서 처리한다.

#### Task T014. Story structure analysis와 improvement suggestion 생성
- Priority: High
- Status: Done
- Issue: None
- PR: None
- Depends on: T013
- Branch: `feature/T014-story-structure-analysis`
- Expected PR Unit: `PR-T014`
- Acceptance Criteria:
  - [x] storyline에서 document purpose, overall thesis, sections, section role/core message/source summary/suggested count를 생성한다.
  - [x] improvement suggestions가 enabled일 때 같은 call에서 생성된다.
  - [x] suggestions disabled일 때 suggestions panel data가 생성되지 않는다.
  - [x] target slide count와 다른 결과가 나오면 rationale을 저장하거나 표시할 수 있다.
  - [x] 실패 시 project status가 `storyboard_generation_failed`가 된다.
  - [x] `.ai/status/active/T014-story-structure-analysis.md`에 검증 결과가 기록되어 있다.
- Notes:
  - slide breakdown 저장은 T015에서 처리한다.

#### Task T015. Slide breakdown 생성과 slide persistence 구현
- Priority: High
- Status: Done
- Issue: None
- PR: None
- Depends on: T014
- Branch: `feature/T015-slide-breakdown`
- Expected PR Unit: `PR-T015`
- Acceptance Criteria:
  - [x] story structure 결과를 기반으로 slide breakdown을 생성한다.
  - [x] 각 slide에 `sectionId`, `sectionTitle`, `title`, `coreMessage`, `contentPoints`, `visualDirection`, `imagePrompt`, `slideRole`이 저장된다.
  - [x] `imagePrompt`는 storyboard confirmation 전에 생성된다.
  - [x] 생성된 slide의 field edit state 기본값은 `aiGenerated`다.
  - [x] 생성 완료 후 project status가 `storyboard_review`가 된다.
  - [x] `.ai/status/active/T015-slide-breakdown.md`에 검증 결과가 기록되어 있다.
- Notes:
  - UI 표시와 confirmation은 T016에서 처리한다.
  - 2026-06-03 user-directed Korean UI pass updated deterministic fallback storyboard output to Korean for future generated sample data.

#### Task T015A. Storyline-to-slide sample fixture contract 정리
- Priority: High
- Status: Done
- Issue: None
- PR: None
- Depends on: T013, T014, T015
- Branch: `feature/T015A-storyboard-sample-contract`
- Expected PR Unit: `PR-T015A`
- Acceptance Criteria:
  - [x] 하나의 대표 consulting/storyline sample text fixture가 있다.
  - [x] sample storyline에 대응하는 expected storyboard JSON fixture가 있다.
  - [x] expected JSON fixture가 `storyboardResponseSchema`와 `slideBreakdownSchema`를 통과한다.
  - [x] 각 slide fixture가 `sectionId`, `sectionTitle`, `title`, `coreMessage`, `contentPoints`, `visualDirection`, `imagePrompt`, `slideRole`을 포함한다.
  - [x] fixture를 `createSlideBreakdown` persistence flow에 넣으면 slide rows가 기대 필드와 순서로 저장된다.
  - [x] LLM prompt가 요구할 최종 출력 객체 형태와 필수/선택 필드가 문서 또는 테스트 설명에 명확히 기록되어 있다.
  - [x] `.ai/status/active/T015A-storyboard-sample-contract.md`에 샘플, 검증 명령, 확인 결과가 기록되어 있다.
- Notes:
  - 실제 LLM/API 호출은 포함하지 않는다.
  - 이 Task의 목적은 실제 LLM 연결 전에 "스토리라인을 슬라이드 객체 배열로 쪼갠 결과"의 정답 형태를 먼저 고정하는 것이다.
  - 샘플 출력은 Markdown 설명, plain text source, JSON fixture 중 테스트에 가장 적합한 조합을 사용하되, 검증 기준은 JSON structured output으로 둔다.
  - Done by merged PR #1. Local ignored sample files are documented in the task status file, and `npm run test:storyboard-sample` verified 12 persisted slides and `storyboard_review` status.
  - 개발 참고: README는 제품 목적과 사용 흐름 중심 문서로 유지하고, 샘플 fixture 전략은 이 planning task와 task status file에서만 관리한다.
  - 개발 참고: 로컬 ignored fixture는 `tmp/rca-ax-readiness-storyline-sample.md`와 `tmp/rca-ax-readiness-storyboard-sample.json`을 사용한다.
  - 개발 참고: non-production mode에서 `tmp/rca-ax-readiness-storyboard-sample.json`이 있으면 storyboard generation route가 이를 dummy LLM `story_structure` 응답으로 사용해 live OpenRouter/image call 없이 review flow를 확인할 수 있다.
  - 개발 참고: fixture 검증은 `npm run test:storyboard-sample`로 수행하고, login 없는 visual preview는 `/dev/storyboard-sample` development-only route에서 확인한다.

#### Task T015B. Real OpenRouter storyboard generation 연결
- Priority: High
- Status: Done
- Issue: None
- PR: None
- Depends on: T015A, T008, T009A
- Branch: `feature/T015B-openrouter-storyboard-call`
- Expected PR Unit: `PR-T015B`
- Acceptance Criteria:
  - [x] `story_structure` task가 자유 양식 사용자 입력을 정규화해 `documentPurpose`, `overallThesis`, `sections`, optional `improvementSuggestions`, optional `slides`를 생성한다.
  - [x] `story_structure` 결과에 schema-valid `slides`가 없거나 품질 게이트를 통과하지 못하면 `slide_breakdown` task가 실제 OpenRouter HTTP request로 호출된다.
  - [x] `story_structure` 결과에 schema-valid `slides`가 있고 품질 게이트를 통과하면 `slide_breakdown` task를 생략하고 해당 slide objects를 저장한다.
  - [x] request prompt가 T015A에서 고정한 sample output object contract를 따른다.
  - [x] response가 `storyboardResponseSchema`로 validation되고 invalid output은 accepted storyboard data로 저장되지 않는다.
  - [x] validation failure는 한 번 retry 후 stage-specific error로 surfaced 된다.
  - [x] 관리자에게 할당된 OpenRouter account-level user/provider API key가 없으면 server fallback 없이 provider-key error를 반환한다.
  - [x] mocked HTTP test가 실제 request payload, schema validation, retry, error normalization을 검증한다.
  - [x] 실제 외부 API 테스트가 불가능하면 mocked provider test와 수동 검증 한계를 status에 기록한다.
  - [x] `.ai/status/active/T015B-openrouter-storyboard-call.md`에 검증 결과가 기록되어 있다.
- Notes:
  - 기존 deterministic storyboard fallback은 T015A fixture 계약 검증용 또는 테스트용 helper로만 남기고 production generation path에서는 사용하지 않는다.
  - 실제 LLM 연결은 샘플 텍스트와 기대 JSON 객체 기반 테스트가 먼저 통과한 뒤 진행한다.
  - 실사용 입력은 샘플처럼 잘 구조화되어 있지 않을 가능성이 높으므로 기본 설계는 2단계 품질 우선 흐름으로 둔다.
  - 단, 비용과 지연을 줄이기 위해 1차 `story_structure` 결과에 충분한 `slides`가 포함되면 2차 호출을 생략하는 hybrid path를 지원한다.
  - MVP에서는 OpenRouter를 기본 storyboard LLM provider로 사용하고, 사용자 model 선택 UI는 제공하지 않는다.
  - Done by merged PR #2. Live retry for project `209e9e8a-fa26-407c-9e1d-2d78e6c5c900` generated 12 slides and persisted image prompts.

#### Task T015C. Slide count range policy generation integration
- Priority: High
- Status: Done
- Issue: #14
- PR: #39
- Depends on: T011A, T015B
- Branch: `feature/T015C-slide-count-range-policy`
- Expected PR Unit: `PR-T015C`
- Acceptance Criteria:
  - [x] OpenRouter storyboard generation input이 single `targetSlideCount` 대신 slide count policy를 전달한다: `auto`, `brief(5-8)`, `standard(9-14)`, `detailed(15-25)`, `custom_range(min-max)`.
  - [x] `story_structure`와 `slide_breakdown` 요청 payload 모두 user-selected range, optional preferred count, heuristic page/slide marker count, marker confidence를 받는다.
  - [x] 명시적 page/slide marker가 high confidence이면 입력 구조를 존중하되, 선택한 range와 크게 다르면 압축/확장 rationale을 반환하도록 LLM request contract에 반영한다.
  - [x] `자동` 모드에서는 LLM이 storyline complexity, section count, page-like marker, content density를 기준으로 적정 slide count를 정하고 rationale을 반환할 수 있다.
  - [x] `직접 범위` 모드에서는 가능한 한 min/max 범위 안에서 slide breakdown을 생성하고, 범위를 벗어나는 경우 `targetSlideCountRationale` 또는 renamed rationale field에 이유를 저장한다.
  - [x] exact-count fixture, range fixture, auto fixture, marker-count-conflict fixture가 provider request payload와 persisted rationale behavior를 검증한다.
  - [x] 기존 `targetSlideCount` project/test data가 compatibility path를 통해 range policy로 해석된다.
  - [x] `.ai/status/active/T015C-slide-count-range-policy.md`에 range policy mapping, compatibility decision, 검증 결과가 기록되어 있다.
- Notes:
  - 2026-06-03 user direction: 정확한 slide count보다 `자동`, `간단히`, `표준`, `상세`, `직접 범위` 기반 range preference를 우선한다.
  - 이 task는 slide count range policy의 data flow, provider input contract, rationale persistence만 다룬다.
  - 프롬프트 구조/내용 품질 보강은 Post-MVP prompt quality/cache epic의 T015D에서 별도로 처리하며, T015C 구현을 막지 않는다.
  - Done by merged PR #39, which closed Issue #14. Live OpenRouter smoke was intentionally not run; provider request contract and persistence are covered by unit/sample verification.

#### Task T015E. Korean storyboard output prompt contract bugfix
- Priority: High
- Status: Ready
- Issue: #48
- PR: None
- Depends on: T015B, T015C
- Branch: `fix/T015E-korean-storyboard-output`
- Expected PR Unit: `PR-T015E`
- Acceptance Criteria:
  - [ ] Storyboard generation prompt explicitly requires Korean output for user-visible slide fields: `sectionTitle`, `title`, `coreMessage`, `contentPoints`, `visualDirection`, and `imagePrompt`.
  - [ ] `documentPurpose`, `overallThesis`, `sections[].title`, `sections[].role`, `sections[].coreMessage`, `sections[].sourceSummary`, `improvementSuggestions`, and `targetSlideCountRationale` use Korean unless the user-provided source text explicitly requires preserving a quoted English term.
  - [ ] Stable machine identifiers such as `sectionId`/`sections[].id` may remain ASCII/slug-like, and controlled internal values may remain English where required by schema or code.
  - [ ] Prompt guidance tells the model to preserve product names, company names, formulas, quoted source phrases, and official English terminology when translating would be misleading.
  - [ ] Prompt payload/unit tests verify the Korean-output instruction is present for both `story_structure` and `slide_breakdown` requests.
  - [ ] Sample or mocked generation verification confirms slide card-visible text is Korean after generation.
  - [ ] `.ai/status/active/T015E-korean-storyboard-output.md` records before/after prompt wording and verification results.
- Notes:
  - 2026-06-04 real-use bug: generated slide card content is currently written in English, even though the product UI and expected storyboard review workflow are Korean-first.
  - This is a prompt contract bugfix, not a broad prompt-quality rewrite; T015D still owns deeper prompt baseline/cache work.
  - Image generation should follow the same Korean-first language policy in T023A/T023 image prompt assembly so future generated mockups do not default to English visible text.

#### Task T015F. Slide count range enforcement and retry bugfix
- Priority: High
- Status: Ready
- Issue: #49
- PR: None
- Depends on: T015B, T015C
- Branch: `fix/T015F-slide-count-range-enforcement`
- Expected PR Unit: `PR-T015F`
- Acceptance Criteria:
  - [ ] Non-auto slide count modes(`brief`, `standard`, `detailed`, `custom_range`) validate the actual persisted slide count against the selected min/max range after `story_structure` and `slide_breakdown`.
  - [ ] If provider output is outside the selected range, generation retries with an explicit corrective prompt before accepting the result.
  - [ ] If retry still returns an out-of-range result, the app does not silently persist it as a valid storyboard; it surfaces a clear generation failure or user-visible range mismatch state.
  - [ ] Provider-provided `targetSlideCountRationale` is not treated as authoritative when the actual slide count contradicts the selected range.
  - [ ] `자동` mode remains flexible and is not forced into a preset range.
  - [ ] Unit or mocked provider tests cover `detailed(15-25)` returning 11 slides, retry behavior, and final failure/acceptance boundaries.
  - [ ] Browser or equivalent workflow check confirms a `상세` project cannot silently end with fewer than 15 slides.
  - [ ] `.ai/status/active/T015F-slide-count-range-enforcement.md` records the observed bug, chosen enforcement policy, and verification results.
- Notes:
  - 2026-06-04 real-use bug: project `ed37c8d9-778e-4d30-91c4-b8db23a66c7a` stored `slide_count_mode=detailed` with range 15-25/preferred 20, but generation persisted only 11 slides.
  - The selected range was stored correctly, so this is not a project creation UI/storage bug. It is provider output non-compliance plus missing post-generation enforcement in the app.
  - This task should keep T015C's range-policy data flow intact and add the missing validation/retry boundary around accepted storyboard output.

### Feature F07. Storyboard Review UI

#### Task T016. Vertical storyboard review UI와 confirmation 구현
- Priority: High
- Status: Done
- Issue: None
- PR: None
- Depends on: T015
- Branch: `feature/T016-storyboard-review-ui`
- Expected PR Unit: `PR-T016`
- Acceptance Criteria:
  - [x] `/projects/{projectId}`에서 vertical slide card list를 표시한다.
  - [x] section header/grouping label이 표시된다.
  - [x] compact/expanded toggle이 동작한다.
  - [x] improvement suggestions가 있을 때 collapsible panel로 표시된다.
  - [x] empty/generating/failed/review/confirmed/no-selected-slide 상태를 처리한다.
  - [x] Confirm storyboard action이 project status를 `storyboard_confirmed`로 변경한다.
  - [x] confirmation 전 image generation button은 disabled 상태다.
  - [x] 브라우저 또는 equivalent visual check로 핵심 상태를 확인했다.
  - [x] `.ai/status/active/T016-storyboard-review-ui.md`에 확인 결과가 기록되어 있다.
- Notes:
  - slide side panel editing은 T017에서 처리한다.
  - 2026-06-03 user-directed Product Design pass refreshed the review workspace as a Korean consultant workbench and verified it in the in-app browser at `/projects/5f105c90-fd07-4d08-abc3-1ebf53c9fecf`.

---

## Epic E05. Manual Storyboard Editing

### Feature F08. Slide Detail Panel and Field Editing

#### Task T017. Side panel field editing 구현
- Priority: High
- Status: Done
- Issue: None
- PR: None
- Depends on: T016
- Branch: `feature/T017-slide-field-editing`
- Expected PR Unit: `PR-T017`
- Acceptance Criteria:
  - [x] slide 선택 시 right-side detail panel이 열린다.
  - [x] Content, Prompt, Images tab 구조가 있다.
  - [x] title, core message, content points, visual direction, image prompt, slide role을 수정할 수 있다.
  - [x] 수정된 field는 `userModified`로 표시/저장된다.
  - [x] confirmed project에서 편집해도 project가 unconfirm되지 않는다.
  - [x] 기존 generated image가 있는 slide를 편집하면 `regeneration_recommended`가 된다.
  - [x] `.ai/status/active/T017-slide-field-editing.md`에 검증 결과가 기록되어 있다.
- Notes:
  - Images tab의 history 기능은 T023에서 채운다.
  - 2026-06-03 user-directed Korean UI pass localized the side detail panel, tabs, editable field labels, field-state labels, and image status labels.

#### Task T017A. Slide card selection detail panel sync bug 수정
- Priority: High
- Status: Done
- Issue: None
- PR: None
- Depends on: T017
- Branch: `fix/T017A-slide-selection-detail-sync`
- Expected PR Unit: `PR-T017A`
- Acceptance Criteria:
  - [x] left storyboard slide card를 클릭하면 right-side detail panel의 title, core message, content points, visual direction, image prompt, slide role이 선택한 slide의 값으로 즉시 갱신된다.
  - [x] 선택된 card의 visual selected state와 detail panel 대상 slide가 항상 일치한다.
  - [x] dev sample preview(`/dev/storyboard-sample`)와 실제 project detail(`/projects/{projectId}`) 양쪽에서 동일하게 동작한다.
  - [x] textareas가 이전 slide의 stale default value를 유지하지 않는다.
  - [x] 선택 변경 후 field edit/save/delete action이 현재 선택된 slide id에만 적용된다.
  - [x] 브라우저 또는 equivalent visual check로 여러 slide 선택 전환을 확인했다.
  - [x] `.ai/status/active/T017A-slide-selection-detail-sync.md`에 재현, 원인, 검증 결과가 기록되어 있다.
- Notes:
  - 2026-06-03 `/dev/storyboard-sample`에서 slide card 클릭 시 오른쪽 textbox 내용이 선택 card와 동기화되지 않는 현상이 관찰되었다.
  - 구현 시 uncontrolled textarea `defaultValue` 재사용, selected slide state, component keying, client hydration state를 함께 점검한다.
  - Done by merged PR #1. Browser click-through was blocked by `ERR_BLOCKED_BY_CLIENT`, so jsdom regression and DOM/server-render checks were used as equivalent verification.

#### Task T017B. Storyboard detail input floating panel UX 수정
- Priority: Medium
- Status: Done
- Issue: #8
- PR: #11
- Depends on: T017A
- Branch: `fix/T017B-floating-detail-panel`
- Expected PR Unit: `PR-T017B`
- Acceptance Criteria:
  - [x] desktop storyboard workspace에서 오른쪽 프롬프트/내용 입력 panel이 floating 또는 sticky 형태로 유지되어, 왼쪽 storyboard list를 아래로 스크롤해도 선택 slide의 입력란이 계속 보인다.
  - [x] Content tab과 Prompt tab의 주요 textarea, 저장/삭제 action, selected slide summary가 panel 내부에서 접근 가능하다.
  - [x] 긴 입력 내용이 있을 때 panel 내부 스크롤과 페이지 스크롤이 서로 충돌하지 않고, 저장 버튼이 화면 밖으로 사라지지 않는다.
  - [x] panel이 header, storyboard card, footer, mobile layout과 겹치지 않는다.
  - [x] mobile/narrow viewport에서는 floating 때문에 입력란이 좁아지지 않도록 drawer, below-list layout, 또는 non-floating fallback을 사용한다.
  - [x] dev sample preview(`/dev/storyboard-sample`)와 실제 project detail(`/projects/{projectId}`) 양쪽에서 동일한 layout behavior를 확인한다.
  - [x] 브라우저 또는 equivalent visual check로 긴 storyboard list 스크롤 중 오른쪽 입력 panel visibility를 확인했다.
  - [x] `.ai/status/active/T017B-floating-detail-panel.md`에 before/after 스크롤 재현과 검증 결과가 기록되어 있다.
- Notes:
  - 2026-06-03 user feedback: 현재 편집 화면은 오른쪽 프롬프트/내용 입력란이 고정 레이아웃이라, 아래쪽으로 스크롤하면 입력란들이 보이지 않는다.
  - 구현 시 `position: sticky`, panel max-height, internal overflow, tab state, selected slide state를 함께 점검한다.
  - Done by merged PR #11, which closed Issue #8 and verified sticky editor behavior on desktop plus mobile fallback.

#### Task T017C. Slide detail unchanged blur edit-state bugfix
- Priority: High
- Status: Ready
- Issue: #50
- PR: None
- Depends on: T017
- Branch: `fix/T017C-unchanged-field-blur-state`
- Expected PR Unit: `PR-T017C`
- Acceptance Criteria:
  - [ ] 슬라이드 상세 패널의 textarea/input을 클릭한 뒤 값을 바꾸지 않고 focus를 해제해도 field label이 `AI 생성`에서 `사용자 수정`으로 바뀌지 않는다.
  - [ ] 서버 PATCH route 또는 repository update boundary에서 기존 field value와 submitted value를 비교하고, 값이 동일하면 slide field, `fieldEditState`, `imageGenerationStatus`, operation history를 변경하지 않는다.
  - [ ] 클라이언트 `onBlur` handler는 값이 변경되지 않은 경우 불필요한 PATCH 요청과 `window.location.reload()`를 피하거나, 서버 no-op 응답을 받아 UI를 그대로 유지한다.
  - [ ] `contentPoints`처럼 textarea 문자열과 DB 배열 표현이 다른 field는 줄바꿈/trim 정책을 명확히 적용해 의미 없는 포맷 차이로 userModified가 되지 않게 한다.
  - [ ] 이미 `userModified`인 field는 동일 값 blur 후에도 그대로 `userModified`를 유지하고, 값이 실제로 달라졌을 때만 저장 timestamp/state가 갱신된다.
  - [ ] 기존 generated image가 있는 slide에서 값이 바뀌지 않은 blur만으로 `regeneration_recommended`가 되지 않는다.
  - [ ] Unit/component tests cover unchanged blur for content fields and prompt field, changed value save, contentPoints normalization, and generated-image regeneration recommendation boundaries.
  - [ ] Browser or equivalent workflow check confirms `AI 생성` label remains unchanged after focus/blur with no edit.
  - [ ] `.ai/status/active/T017C-unchanged-field-blur-state.md` records the observed bug, no-op comparison policy, and verification results.
- Notes:
  - 2026-06-04 real-use bug: clicking into a slide detail input and blurring without edits changes the label from `AI 생성` to `사용자 수정`.
  - Current client calls `saveField` on every textarea `onBlur`, and the repository marks the field as `userModified` without first checking whether the value actually changed.
  - This bug can also create false regeneration recommendations for slides with generated images, so the fix should cover both edit-state and image-regeneration state boundaries.

### Feature F09. Manual Slide Operations

#### Task T018. Reorder, add blank, delete slide 구현
- Priority: High
- Status: Done
- Issue: None
- PR: None
- Depends on: T017
- Branch: `feature/T018-manual-slide-operations`
- Expected PR Unit: `PR-T018`
- Acceptance Criteria:
  - [x] dnd-kit 기반 drag and drop reorder가 동작한다.
  - [x] reorder 후 slide order가 안정적으로 재계산되어 저장된다.
  - [x] blank slide를 삽입할 수 있다.
  - [x] slide 삭제는 soft delete로 처리된다.
  - [x] confirmed project에서 새 slide는 `not_generated` image status로 시작한다.
  - [x] reorder 후 AI reflow suggestion은 제공하지 않는다.
  - [x] `.ai/status/active/T018-manual-slide-operations.md`에 검증 결과가 기록되어 있다.
- Notes:
  - operation history 기록은 T019에서 통합한다.
  - 2026-06-03 user-directed Korean UI pass kept dnd-kit reorder behavior while avoiding SSR hydration mismatch from generated drag-handle accessibility IDs.

#### Task T019. Manual split과 operation history 구현
- Priority: High
- Status: Done
- Issue: None
- PR: None
- Depends on: T018
- Branch: `feature/T019-operation-history`
- Expected PR Unit: `PR-T019`
- Acceptance Criteria:
  - [x] 사용자가 slide를 수동으로 split하기 위해 새 slide를 만들고 field를 편집할 수 있다.
  - [x] reorder, insert blank, delete slide, edit field, confirm storyboard operation이 기록된다.
  - [x] operation history에 before/after snapshot 또는 진단 가능한 metadata가 포함된다.
  - [x] soft-deleted slide는 ordering, generation, export 대상에서 제외된다.
  - [x] `.ai/status/active/T019-operation-history.md`에 검증 결과가 기록되어 있다.
- Notes:
  - undo/redo UI는 MVP 범위가 아니다.

### Feature F09A. MVP AI-Assisted Slide Structure Editing

이 feature는 AI 기반 구조 편집 작업을 같은 MVP 맥락에서 다룬다. T029/T030/T031은 직접 구조 편집 action이고, T032는 해당 구조 편집 이후 deck flow를 점검하고 선택적으로 정리하는 후속 consistency 작업이다.

#### Task T029. AI merge for selected slides 구현
- Priority: High
- Status: Ready
- Issue: #17
- PR: None
- Depends on: T019, T015B
- Branch: `feature/T029-ai-merge-selected-slides`
- Expected PR Unit: `PR-T029`
- Acceptance Criteria:
  - [ ] 사용자가 2개 이상의 slide를 선택해 하나의 slide로 merge할 수 있다.
  - [ ] MVP 범위에서는 우선 인접한 selected slides 병합을 지원하고, 비인접 slides 병합 지원 여부는 구현 전 확정한다.
  - [ ] merged slide는 title, core message, content points, visual direction, image prompt, slide role을 포함한다.
  - [ ] source slides의 순서, 선택 범위, merged result의 before/after snapshot이 operation history에 저장된다.
  - [ ] merge 적용 후 retained slide와 soft-deleted source slides의 ordering이 안정적으로 재계산된다.
  - [ ] retained slide의 user-modified field는 overwrite되지 않는다.
  - [ ] invalid AI output은 저장되지 않고 surfaced 된다.
  - [ ] MVP merge prompt는 T015B의 structured output/provider contract를 따르고, 상세 prompt 품질/캐싱 최적화는 Post-MVP prompt quality/cache epic에서 후속 보강한다.
  - [ ] `.ai/status/active/T029-ai-merge-slides.md`에 검증 결과가 기록되어 있다.
- Notes:
  - 2026-06-04 user direction: 여러 slide를 하나로 합치는 병합 기능은 MVP 범위 안에서 E05로 이동한다.
  - 2026-06-03 user feedback: 여러 slide를 하나로 합치는 병합 기능이 필요하다.
  - Prompt hardening/cache work는 별도 Post-MVP prompt quality/cache epic으로 분리하며, T029의 MVP 구현을 막는 의존성으로 두지 않는다.

#### Task T030. AI split slide 구현
- Priority: High
- Status: Ready
- Issue: #18
- PR: None
- Depends on: T019, T015B
- Branch: `feature/T030-ai-split-slide`
- Expected PR Unit: `PR-T030`
- Acceptance Criteria:
  - [ ] 한 slide를 AI로 2개 이상 slide로 split할 수 있다.
  - [ ] 생성된 각 slide가 모든 required slide field를 포함한다.
  - [ ] source slide와 generated child slides의 before/after snapshot이 operation history에 저장된다.
  - [ ] retained slide의 user-modified field는 overwrite되지 않는다.
  - [ ] invalid AI output은 저장되지 않고 surfaced 된다.
  - [ ] MVP split prompt는 T015B의 structured output/provider contract를 따르고, 상세 prompt 품질/캐싱 최적화는 Post-MVP prompt quality/cache epic에서 후속 보강한다.
  - [ ] `.ai/status/active/T030-ai-split-slide.md`에 검증 결과가 기록되어 있다.
- Notes:
  - 2026-06-04 user direction: AI merge/split/insert/reflow 계열 구조 편집 작업은 같은 MVP E05 맥락에서 계획한다.
  - Prompt hardening/cache work는 별도 Post-MVP prompt quality/cache epic으로 분리하며, T030의 MVP 구현을 막는 의존성으로 두지 않는다.

#### Task T031. AI insert slide from natural language 구현
- Priority: High
- Status: Ready
- Issue: #19
- PR: None
- Depends on: T019, T015B
- Branch: `feature/T031-ai-insert-slide`
- Expected PR Unit: `PR-T031`
- Acceptance Criteria:
  - [ ] 사용자가 선택 위치에 natural language instruction으로 slide를 삽입할 수 있다.
  - [ ] inserted slide가 모든 required slide field를 포함한다.
  - [ ] operation history에 instruction, insertion position, generated slide snapshot이 저장된다.
  - [ ] invalid AI output은 저장되지 않고 surfaced 된다.
  - [ ] MVP insert prompt는 T015B의 structured output/provider contract를 따르고, 상세 prompt 품질/캐싱 최적화는 Post-MVP prompt quality/cache epic에서 후속 보강한다.
  - [ ] AI reflow suggestion과 preview/diff UI는 T032에서 처리한다.
  - [ ] `.ai/status/active/T031-ai-insert-slide.md`에 검증 결과가 기록되어 있다.
- Notes:
  - 2026-06-04 user direction: AI merge/split/insert/reflow 계열 구조 편집 작업은 같은 MVP E05 맥락에서 계획한다.
  - Prompt hardening/cache work는 별도 Post-MVP prompt quality/cache epic으로 분리하며, T031의 MVP 구현을 막는 의존성으로 두지 않는다.

#### Task T032. AI deck flow reflow after structural slide edits 구현
- Priority: High
- Status: Backlog
- Issue: #21
- PR: None
- Depends on: T029, T030, T031
- Branch: `feature/T032-ai-deck-flow-reflow`
- Expected PR Unit: `PR-T032`
- Acceptance Criteria:
  - [ ] 슬라이드 순서 변경, 삭제, 추가, 병합, 분할 이후 사용자가 deck flow reflow 또는 consistency check를 실행할 수 있다.
  - [ ] MVP reflow prompt는 T015B의 structured output/provider contract를 따르고, deck narrative flow, section continuity, duplicated message, missing transition, weak slide role을 점검한다.
  - [ ] reflow 결과는 기존 slides를 즉시 덮어쓰지 않고 preview/diff 형태로 title/core message/contentPoints/visualDirection/imagePrompt/slideRole 변경 제안을 보여준다.
  - [ ] userModified field는 기본적으로 보호되며, 변경 제안이 필요한 경우 이유와 함께 표시된다.
  - [ ] 사용자가 선택적으로 적용한 변경만 저장되고, before/after snapshot이 operation history에 기록된다.
  - [ ] invalid AI output은 저장되지 않고 surfaced 된다.
  - [ ] `.ai/status/active/T032-ai-deck-flow-reflow.md`에 prompt 품질 검토, preview/diff 검증, 적용/취소 검증 결과가 기록되어 있다.
- Notes:
  - 2026-06-04 user direction: T029/T030/T031/T032는 같은 MVP E05 구조 편집 맥락에서 작업하도록 계획한다.
  - 2026-06-03 user direction: 슬라이드 순서 수정, 삭제/추가/병합 등 구조 변경 이후에 들어갈 LLM prompt도 추후 prompt quality baseline을 따라야 한다.
  - T032는 T029/T030/T031 구조 편집 action이 구현된 뒤 같은 UX/operation-history 맥락에서 deck flow consistency를 점검하는 후속 MVP task다.
  - Prompt hardening/cache work는 별도 Post-MVP prompt quality/cache epic으로 분리하며, T032의 MVP 구현을 막는 의존성으로 두지 않는다.

---

## Epic E06. Image Generation

MVP scope:

- Image generation uses provider account keys assigned by an administrator, not separate image-only keys entered by the user.
- OpenAI image generation uses the OpenAI account key.
- Gemini/Nano Banana image generation uses the Gemini account key.
- User-selectable LLM model/provider choices are not part of MVP.

### Feature F10. Image Provider and Storage Foundation

#### Task T020. Image provider interface와 local storage provider 구현
- Priority: High
- Status: Done
- Issue: None
- PR: None
- Depends on: T016
- Branch: `feature/T020-image-provider-storage`
- Expected PR Unit: `PR-T020`
- Acceptance Criteria:
  - [x] `ImageGenerationProvider` interface가 `prompt`, `aspectRatio`, `model`, `apiKey` input을 받는다.
  - [x] `ImageStorageProvider` interface와 local filesystem 구현이 있다.
  - [x] 저장 경로가 `/app/data/storage/projects/{projectId}/images/` 구조를 따른다.
  - [x] 저장된 image URL 조회가 project ownership guard를 통과해야 한다.
  - [x] storage unit test가 있다.
  - [x] `.ai/status/active/T020-image-provider-storage.md`에 검증 결과가 기록되어 있다.
- Notes:
  - 실제 provider API 호출은 T021, T022에서 구현한다.

#### Task T021. GPT Image / OpenAI Images provider 구현
- Priority: High
- Status: Done
- Issue: #9
- PR: #12
- Depends on: T020, T008, T009A
- Branch: `feature/T021-openai-images-provider`
- Expected PR Unit: `PR-T021`
- Acceptance Criteria:
  - [x] `gpt-image-2`가 `openai` account-level user/provider API key를 사용한다.
  - [x] user key가 없으면 provider-key error를 반환하고 server fallback을 사용하지 않는다.
  - [x] `16:9`, `4:3` aspect ratio input을 provider request에 반영한다.
  - [x] provider response의 bytes 또는 URL이 local storage로 저장된다.
  - [x] 실패 응답이 표준 error message로 정규화된다.
  - [x] `.ai/status/active/T021-openai-images-provider.md`에 검증 결과가 기록되어 있다.
- Notes:
  - 실제 외부 API 테스트가 불가능하면 mocked provider test와 수동 검증 한계를 status에 기록한다.
  - 별도 `openai_images` key가 아니라 OpenAI account key를 LLM과 이미지 생성에 함께 쓰는 방향으로 구현한다.
  - Done by merged PR #12, which closed Issue #9, added OpenRouter-first image routing with direct OpenAI fallback, and verified a one-slide OpenRouter smoke.

#### Task T022. Gemini/Nano Banana image provider 구현
- Priority: High
- Status: Done
- Issue: #10
- PR: #12
- Depends on: T020, T008, T009A
- Branch: `feature/T022-gemini-image-provider`
- Expected PR Unit: `PR-T022`
- Acceptance Criteria:
  - [x] Gemini image generation path가 `gemini` account-level user/provider API key를 사용한다.
  - [x] project default image model의 `nano-banana` 선택은 Gemini provider key로 해석된다.
  - [x] user key가 없으면 provider-key error를 반환하고 server fallback을 사용하지 않는다.
  - [x] `16:9`, `4:3` aspect ratio input을 provider request에 반영한다.
  - [x] provider response의 bytes 또는 URL이 local storage로 저장된다.
  - [x] 실패 응답이 표준 error message로 정규화된다.
  - [x] `.ai/status/active/T022-nano-banana-provider.md`에 검증 결과가 기록되어 있다.
- Notes:
  - 실제 외부 API 테스트가 불가능하면 mocked provider test와 수동 검증 한계를 status에 기록한다.
  - 별도 `nano_banana` key가 아니라 Gemini account key를 LLM과 이미지 생성에 함께 쓰는 방향으로 구현한다.
  - Done by merged PR #12, which closed Issue #10, added OpenRouter-first image routing with direct Gemini fallback, and documented that direct Gemini live smoke remains pending user-supplied keys.

### Feature F11. Individual and Batch Image Generation

#### Task T023. Single slide image generation, regeneration, history 구현
- Priority: High
- Status: Done
- Issue: #15
- PR: #40
- Depends on: T017, T021, T022
- Branch: `feature/T023-single-image-generation`
- Expected PR Unit: `PR-T023`
- Acceptance Criteria:
  - [x] confirmed storyboard에서 single slide image generation을 실행할 수 있다.
  - [x] resolved prompt snapshot, common prompt snapshot, slide prompt snapshot이 저장된다.
  - [x] generation history에 model, aspect ratio, status, error, timestamps, selected flag가 저장된다.
  - [x] regeneration 성공 시 새 image는 history에 추가되지만 자동 selected가 되지 않는다.
  - [x] 사용자가 completed previous image를 selected image로 선택할 수 있다.
  - [x] Images tab에서 history와 selected thumbnail을 볼 수 있다.
  - [x] `.ai/status/active/T023-single-image-generation.md`에 검증 결과가 기록되어 있다.
- Notes:
  - Batch generation은 T024에서 처리한다.
  - PR #12 already added per-slide mockup generation triggers and latest mockup display; this task should finish regeneration history, selected image behavior, and Images tab history UX.
  - Done by merged PR #40, which closed Issue #15 and added single-slide generation history, prompt snapshots, selected-image selection/deselection, and Images tab history UX.
  - Actual provider smoke remains environment-dependent on assigned account-level provider keys.

#### Task T023B. Slide mockup result review and final selection UX 구현
- Priority: Medium
- Status: Ready
- Issue: #20
- PR: None
- Depends on: T023
- Branch: `feature/T023B-mockup-review-selection`
- Expected PR Unit: `PR-T023B`
- Acceptance Criteria:
  - [ ] 생성된 slide mockup thumbnail 또는 preview를 클릭하면 큰 preview modal 또는 dedicated viewer가 열린다.
  - [ ] 한 slide에 여러 mockup 후보가 있으면 carousel-style viewer로 후보를 순차 확인할 수 있다.
  - [ ] viewer에서 provider, model, createdAt, generation status, error summary, prompt snapshot presence를 확인할 수 있다.
  - [ ] 사용자는 한 slide의 최종 mockup을 선택할 수 있고, 선택 상태가 Images tab, export 대상, history record에 일관되게 반영된다.
  - [ ] workflow상 여러 accepted variant가 필요하면 한 slide에 둘 이상의 final mockup을 선택할 수 있는 옵션을 제공한다.
  - [ ] 선택 변경은 soft-deleted slide, failed image, 다른 사용자의 image record에 적용되지 않는다.
  - [ ] 브라우저 또는 equivalent visual check로 large preview, carousel navigation, single/multiple final selection UX를 확인했다.
  - [ ] `.ai/status/active/T023B-mockup-review-selection.md`에 preview/selection 정책과 검증 결과가 기록되어 있다.
- Notes:
  - 2026-06-04 planning handoff from merged PR #12: generated mockups should open in a larger preview, multi-result review should use a carousel-style viewer, and final-selection UX should support one or more accepted mockups per slide.
  - 2026-06-04 user direction: T023B는 Backlog 이슈로 올리되, T023 구현 직후 같은 PR에서 바로 처리할 수 있게 계획한다.
  - T023 was completed by merged PR #40, so T023B is now a Ready follow-up task rather than part of the already-merged T023 PR.
  - T023B는 T023의 image generation history/selected image behavior 위에서 이어지는 UX 작업이므로 별도 선행 prompt quality/cache work에 의존하지 않는다.

#### Task T023C. Single image generation immediate status refresh bugfix
- Priority: High
- Status: Ready
- Issue: #51
- PR: None
- Depends on: T023
- Branch: `fix/T023C-image-generation-status-refresh`
- Expected PR Unit: `PR-T023C`
- Acceptance Criteria:
  - [ ] 슬라이드 카드의 `목업 생성` 버튼을 누르면 해당 slide의 UI 상태가 즉시 `생성 중`으로 바뀌고 중복 클릭이 방지된다.
  - [ ] 이미지 생성 API가 성공하면 페이지 새로고침 없이 해당 slide의 thumbnail, selected image, Images tab history, card status가 즉시 갱신된다.
  - [ ] 이미지 생성 API가 실패하면 페이지 새로고침 없이 해당 slide의 card status가 `실패`로 바뀌고, 실패 메시지와 failed generation history가 같은 화면에서 확인된다.
  - [ ] 실패 응답에서 DB에 저장된 failed image generation record를 클라이언트가 갱신할 수 있도록 API response가 failed image record를 반환하거나, 클라이언트가 안전하게 최신 slide/image state를 refetch한다.
  - [ ] 성공 image가 없는데도 클라이언트가 slide status를 `generated`로 표시하지 않는다.
  - [ ] pending state가 오래 지속되거나 요청이 중단된 경우에도 `generating` 상태가 화면과 DB에 고아 상태로 남지 않도록 복구/재시도 UX를 제공한다.
  - [ ] Unit/component tests or mocked route tests cover success, failure, partial failure, and no-image response state transitions.
  - [ ] Browser or equivalent workflow check confirms status changes from `목업 없음` -> `생성 중` -> `완료/실패` without manual refresh.
  - [ ] `.ai/status/active/T023C-image-generation-status-refresh.md` records the observed bug, state transition policy, and verification results.
- Notes:
  - 2026-06-04 real-use bug: after clicking slide-card `목업 생성`, the UI changed to generating, then appeared to return to the initial state with no mockup; only after refresh did the title-side state change from `목업 없음` to `실패`.
  - Current code returns only `{ error, generated, failed }` on all-failed image generation, while the failed generation record is written to DB. The client therefore cannot update failed history/status immediately from the response.
  - Current client success-state logic can mark a requested slide as `generated` when there are no returned images; this should be corrected while fixing the refresh behavior.

#### Task T023D. OpenRouter-first image fallback error masking bugfix
- Priority: High
- Status: Ready
- Issue: #52
- PR: None
- Depends on: T021, T022, T023
- Branch: `fix/T023D-openrouter-image-fallback-error`
- Expected PR Unit: `PR-T023D`
- Acceptance Criteria:
  - [ ] If a user has an OpenRouter key and no direct OpenAI/Gemini key, image generation first attempts OpenRouter and does not fail solely because the direct provider key is missing.
  - [ ] If OpenRouter succeeds, no direct OpenAI/Gemini key is required for `gpt-image-2` or `nano-banana` image generation.
  - [ ] If OpenRouter is attempted and fails, a later missing direct-provider key does not mask the actual OpenRouter provider failure in the final user-facing error or stored failed history.
  - [ ] If OpenRouter key is missing and the direct provider key exists, the existing direct OpenAI/Gemini fallback path still works.
  - [ ] If both OpenRouter and the required direct provider key are missing, the missing-key message clearly lists the usable key options instead of implying only one provider can satisfy the request.
  - [ ] Failed image generation records store the provider/error that best explains the attempted route, including OpenRouter provider errors when OpenRouter was actually called.
  - [ ] Mocked provider tests cover OpenRouter success with no OpenAI key, OpenRouter provider failure with no OpenAI key, OpenRouter missing with OpenAI success, and both keys missing.
  - [ ] Browser or equivalent real-use check verifies an OpenRouter-only member can start image generation and receives an OpenRouter-specific result/error rather than an OpenAI-key-missing message.
  - [ ] `.ai/status/active/T023D-openrouter-image-fallback-error.md` records provider selection order, error precedence, and verification results.
- Notes:
  - 2026-06-04 real-use bug: an OpenRouter-only account saw an `OpenAI API key가 없습니다` failure after image generation, even though T021/T022 documented OpenRouter-first image routing with direct provider fallback.
  - Current image generation code tries OpenRouter first, then the direct provider for the selected model. If OpenRouter fails and the direct provider key is missing, the final normalized error can be the missing direct-provider key, hiding the OpenRouter attempt/failure.
  - This task should keep direct-provider fallback available, but make fallback/error precedence match the product intent and debugging needs.

#### Task T024. Batch image generation과 concurrency/progress 구현
- Priority: High
- Status: Ready
- Issue: #22
- PR: None
- Depends on: T023
- Branch: `feature/T024-batch-image-generation`
- Expected PR Unit: `PR-T024`
- Acceptance Criteria:
  - [ ] batch target으로 `not_generated_only`, `all_slides`, `regeneration_recommended_only`를 선택할 수 있다.
  - [ ] 기본 target은 `not_generated_only`다.
  - [ ] batch는 project default image model을 사용한다.
  - [ ] `IMAGE_GENERATION_CONCURRENCY=3` 기본 concurrency를 따른다.
  - [ ] 실패 시 한 번 retry하고, 재실패 시 `failed` status와 error message를 저장한다.
  - [ ] batch status가 `running`, `completed`, `partially_failed`, `failed`로 표시된다.
  - [ ] progress에 total, completed, failed, remaining count가 표시된다.
  - [ ] `.ai/status/active/T024-batch-image-generation.md`에 검증 결과가 기록되어 있다.
- Notes:
  - provider rate limit에 따른 실패는 retry/failure state로 남긴다.
  - T023 was completed by merged PR #40, so this task is now unblocked.

---

## Epic E07. Export and MVP Hardening

### Feature F12. Storyboard and Image Export

#### Task T025. Markdown export 구현
- Priority: High
- Status: Ready
- Issue: #23
- PR: None
- Depends on: T016, T019, T023
- Branch: `feature/T025-markdown-export`
- Expected PR Unit: `PR-T025`
- Acceptance Criteria:
  - [ ] export markdown에 project name, style settings, story structure summary가 포함된다.
  - [ ] improvement suggestions가 있으면 포함된다.
  - [ ] sections와 slides가 순서대로 포함된다.
  - [ ] 각 slide에 title, core message, content points, visual direction, image prompt, selected image path가 포함된다.
  - [ ] selected image가 없는 slide는 blank 또는 `Not selected`로 표시된다.
  - [ ] soft-deleted slide는 export에서 제외된다.
  - [ ] `.ai/status/active/T025-markdown-export.md`에 검증 결과가 기록되어 있다.
- Notes:
  - ZIP export는 T026에서 처리한다.
  - T023 was completed by merged PR #40, so this task is now unblocked.

#### Task T026. Selected image ZIP export 구현
- Priority: High
- Status: Backlog
- Issue: #24
- PR: None
- Depends on: T025
- Branch: `feature/T026-selected-image-zip-export`
- Expected PR Unit: `PR-T026`
- Acceptance Criteria:
  - [ ] ZIP에 `storyboard.md`와 `images/slide-001.png` 형식의 selected images가 포함된다.
  - [ ] selected image만 ZIP에 포함된다.
  - [ ] failed image generation과 unselected image는 제외된다.
  - [ ] duplicate 또는 missing selected image path가 있으면 misleading ZIP을 만들지 않고 export error를 표시한다.
  - [ ] export는 실행 시점의 point-in-time snapshot이다.
  - [ ] `.ai/status/active/T026-selected-image-zip-export.md`에 검증 결과가 기록되어 있다.
- Notes:
  - full image history export는 MVP 범위가 아니다.

### Feature F13. MVP Security, Reliability, and UX Hardening

#### Task T027. 보안/소유권/삭제 데이터 hardening
- Priority: High
- Status: Backlog
- Issue: #25
- PR: None
- Depends on: T020, T026
- Branch: `feature/T027-security-hardening`
- Expected PR Unit: `PR-T027`
- Acceptance Criteria:
  - [ ] local image URL이 project ownership을 검증한다.
  - [ ] deleted project와 deleted slide의 image가 default UI/export flow에 노출되지 않는다.
  - [ ] API key full value가 storage 이후 UI/API response에 노출되지 않는다.
  - [ ] provider key 누락 시 모든 AI/image generation path에서 server fallback이 없다.
  - [ ] 관련 negative test가 있다.
  - [ ] `.ai/status/active/T027-security-hardening.md`에 검증 결과가 기록되어 있다.
- Notes:
  - 외부 provider key는 user-scoped key만 사용한다.

#### Task T027A. Provider call progress and loading visualization umbrella
- Priority: High
- Status: Backlog
- Issue: #26
- PR: None
- Depends on: T015B, T023, T024
- Branch: `feature/T027A-provider-call-progress-ui`
- Expected PR Unit: Parent issue only; implementation should use T027A1/T027A2/T027A3 sub-issues.
- Acceptance Criteria:
  - [ ] T027A1, T027A2, and T027A3 are implemented or explicitly deferred with user approval.
  - [ ] GitHub issue tracking keeps T027A1/T027A2/T027A3 as sub-issues under parent Issue #26 when those sub-issues are created.
  - [ ] The parent issue summarizes cross-flow progress state consistency for storyboard LLM, single image, and batch image generation.
- Notes:
  - 2026-06-04 user direction: T027A1/T027A2 should be tracked as sub-issues of T027A, including when GitHub Issues are created later.
  - T027A3 belongs to the same provider-progress umbrella and should also be created as a sub-issue of T027A unless the user decides to keep batch progress separate.
  - Use child task status for actual implementation readiness; do not block T027A1 on T024 just because the umbrella includes batch image progress.

#### Task T027A1. Storyboard LLM generation loading/progress UX 구현
- Priority: High
- Status: Ready
- Issue: #53
- PR: None
- Depends on: T015B
- Branch: `feature/T027A1-storyboard-generation-progress`
- Expected PR Unit: `PR-T027A1`
- Acceptance Criteria:
  - [ ] 사용자가 `스토리보드 생성` 버튼을 누르면 즉시 pending/loading 상태가 표시되고 버튼이 중복 제출되지 않는다.
  - [ ] loading UI는 버튼 disable만으로 끝나지 않고, 현재 단계 label, elapsed time 또는 spinner/progress indicator를 보여준다.
  - [ ] Storyboard LLM flow 단계가 사용자에게 구분되어 보인다: request started, `story_structure` 호출 대기, schema validation, `slide_breakdown` 호출 대기, slide persistence, review-ready transition.
  - [ ] provider response가 오래 걸려도 사용자는 앱이 멈춘 것으로 느끼지 않으며, 현재 OpenRouter 응답 대기 중인지 실패했는지 구분할 수 있다.
  - [ ] provider-key missing, schema validation failure, provider/network failure는 기존 `storyboard_generation_failed` 상태와 충돌하지 않고 명확한 실패 메시지로 돌아온다.
  - [ ] 새로고침 후에도 가능한 범위에서 `storyboard_generating` 또는 마지막 실패 상태를 복구하거나 안내한다.
  - [ ] 브라우저 또는 equivalent visual check로 storyboard generation pending, success redirect, failure state를 확인했다.
  - [ ] `.ai/status/active/T027A1-storyboard-generation-progress.md`에 단계 정의, 구현 방식, 검증 결과가 기록되어 있다.
- Notes:
  - 2026-06-03 user direction: LLM 및 이미지 provider 호출부터 답변까지 로딩을 시각적으로 보여줄 수 있어야 한다.
  - 2026-06-04 user finding: 실제 사용 중 `스토리보드 생성` 클릭 후 OpenRouter 응답 대기 시간 동안 아무 피드백이 없어, 버튼이 동작하지 않는지 provider 응답을 기다리는지 구분하기 어렵다.
  - 기존 T027A의 broad provider progress scope에서 즉시 구현 가능한 storyboard LLM generation progress를 분리했다.
  - GitHub Issue 생성 시 parent T027A Issue #26의 sub-issue로 등록한다.
  - 스트리밍이 없어도 polling, persisted status, optimistic step indicator 중 구현 가능한 방식을 선택한다.

#### Task T027A2. Single image generation loading/progress UX 구현
- Priority: High
- Status: Backlog
- Issue: #54
- PR: None
- Depends on: T023
- Branch: `feature/T027A2-single-image-progress`
- Expected PR Unit: `PR-T027A2`
- Acceptance Criteria:
  - [ ] single slide image generation과 regeneration에서 provider 호출 시작, retry, storage 저장, 완료/실패까지 시각적 진행 상태가 표시된다.
  - [ ] loading UI는 버튼 disable만으로 끝나지 않고, 현재 단계 label, elapsed time 또는 spinner/progress indicator를 보여준다.
  - [ ] retry가 발생하면 retry 중임을 사용자에게 명확히 보여주고, 최종 성공/실패 상태로 전환한다.
  - [ ] loading state가 slide image generation status, selected image state, image history UI와 일관된다.
  - [ ] 브라우저 또는 equivalent visual check로 single image generation pending, success, failure UX를 확인했다.
  - [ ] `.ai/status/active/T027A2-single-image-progress.md`에 각 provider call flow의 loading 단계와 검증 결과가 기록되어 있다.
- Notes:
  - 기존 T027A에서 single image progress scope를 분리했다.
  - GitHub Issue 생성 시 parent T027A Issue #26의 sub-issue로 등록한다.
  - T023 is complete, so this task can be promoted once a dedicated Issue is created or the user prioritizes it.

#### Task T027A3. Batch image generation progress UX 구현
- Priority: High
- Status: Backlog
- Issue: #55
- PR: None
- Depends on: T024
- Branch: `feature/T027A3-batch-image-progress`
- Expected PR Unit: `PR-T027A3`
- Acceptance Criteria:
  - [ ] batch generation은 total/completed/failed/remaining count와 현재 처리 중인 slide title 또는 position을 표시한다.
  - [ ] batch image generation에서 provider 호출 시작, retry, storage 저장, 완료/부분 실패/실패까지 시각적 진행 상태가 표시된다.
  - [ ] retry가 발생하면 retry 중임을 사용자에게 명확히 보여주고, 최종 성공/부분 실패/실패 상태로 전환한다.
  - [ ] loading state가 image generation batch status와 slide image generation status와 일관된다.
  - [ ] 브라우저 또는 equivalent visual check로 batch image generation loading/progress UX를 확인했다.
  - [ ] `.ai/status/active/T027A3-batch-image-progress.md`에 batch progress contract와 검증 결과가 기록되어 있다.
- Notes:
  - 기존 T027A에서 batch image progress scope를 분리했다.
  - GitHub Issue 생성 시 parent T027A Issue #26의 sub-issue로 등록한다.
  - This task remains blocked by T024 because batch orchestration/progress state does not exist yet.

#### Task T027B. Actual provider usage ledger and admin cost dashboard 구현
- Priority: High
- Status: Backlog
- Issue: #27
- PR: None
- Depends on: T009B, T015B, T021, T022, T024
- Branch: `feature/T027B-provider-usage-ledger`
- Expected PR Unit: `PR-T027B`
- Acceptance Criteria:
  - [ ] 모든 live LLM provider 호출 후 provider response의 실제 usage metadata를 저장한다.
  - [ ] 모든 live image provider 호출 후 provider response 또는 provider request/result metadata에서 비용 산정에 필요한 실제 사용량 단위를 저장한다.
  - [ ] 사용량 ledger는 최소 `userId`, `projectId`, optional `slideId`, `operationType`, `provider`, `model`, `requestId`, `inputTokens`, `outputTokens`, `reasoningTokens`, `cachedInputTokens`, `totalTokens`, `imageCount`, `imageSize`, `imageQuality`, `estimatedCost`, `currency`, `priceSnapshot`, `createdAt` 또는 동등한 필드를 기록한다.
  - [ ] `operationType`은 최소 `story_structure`, `slide_breakdown`, `single_image_generation`, `batch_image_generation` 또는 동등한 project stage를 구분한다.
  - [ ] usage 기록은 사전 token 추정이 아니라 provider 응답의 실제 usage/cost metadata를 우선 사용한다.
  - [ ] provider가 usage 또는 cost metadata를 반환하지 않는 경우에는 `unknown`/`unsupported` 상태와 raw secret 없는 provider/model/request metadata를 기록하고, 임의 token 추정값으로 실제 사용량을 대체하지 않는다.
  - [ ] 관리자 전용 usage/cost 페이지가 있다.
  - [ ] 관리자 usage 페이지에서 전체 기간의 project별 사용량과 추정 비용을 합산해서 볼 수 있다.
  - [ ] 관리자 usage 페이지에서 특정 project의 단계별 사용량과 추정 비용을 볼 수 있다. 단계는 최소 슬라이드 구조 생성과 이미지 생성을 구분한다.
  - [ ] 관리자 usage 페이지는 MVP 범위에서 정산/청구 기능 없이 비용 추정용으로만 동작한다.
  - [ ] 비용 계산은 호출 당시의 model/provider price snapshot을 기준으로 하며, 가격표 변경 이후에도 과거 추정값이 흔들리지 않는다.
  - [ ] usage ledger에는 provider API key, prompt 전문, 민감한 response body를 저장하지 않는다.
  - [ ] usage ledger 저장 실패가 provider generation 성공 자체를 되돌리지 않으며, 저장 실패는 관측 가능한 error/log/status로 남긴다.
  - [ ] mocked provider tests가 LLM usage 저장, image usage 저장, usage metadata missing/unsupported case, project/stage aggregation을 검증한다.
  - [ ] 브라우저 또는 equivalent visual check로 관리자 usage 페이지의 project별/단계별 합산 표시를 확인했다.
  - [ ] `.ai/status/active/T027B-provider-usage-ledger.md`에 usage field contract, cost calculation policy, 검증 결과가 기록되어 있다.
- Notes:
  - 2026-06-03 user direction: 비용 책정을 위해 사전 token 추정은 MVP에서 필요 없고, 실제 provider 사용량을 바탕으로 기록/집계한다.
  - MVP usage page는 순수 비용 추정용이다. 결제, 청구, 사용자별 과금 확정, quota enforcement는 범위 밖이다.
  - Text LLM usage와 image generation usage는 단위가 다를 수 있으므로 ledger schema는 token fields와 image unit fields를 함께 표현할 수 있어야 한다.

#### Task T027C. Provider call debug log storage and viewer 구현
- Priority: Critical
- Status: Ready
- Issue: #56
- PR: None
- Depends on: T015B, T021, T022, T023
- Branch: `feature/T027C-provider-debug-logs`
- Expected PR Unit: `PR-T027C`
- Acceptance Criteria:
  - [ ] LLM provider calls record a debug log entry for each `story_structure` and `slide_breakdown` attempt, including projectId, userId, operationType, provider, model, attempt number, startedAt, completedAt, durationMs, status, HTTP status when available, requestId when available, and normalized error when failed.
  - [ ] Image provider calls record a debug log entry for each single-image generation attempt, including projectId, slideId, userId, operationType, provider, model, aspectRatio, attempt/fallback order, startedAt, completedAt, durationMs, status, HTTP status when available, requestId when available, storage result summary, and normalized error when failed.
  - [ ] Debug logs store request/response previews or structured snapshots needed for diagnosis, but never store provider API keys, Authorization headers, decrypted secrets, raw binary image bytes, or full sensitive payloads.
  - [ ] Request/response snapshots are redacted and size-limited, with explicit truncation metadata so large prompts/responses do not bloat SQLite or expose private data unnecessarily.
  - [ ] LLM logs capture enough structured response metadata to diagnose schema validation failures, language mismatch, slide count mismatch, missing usage metadata, and provider JSON parse failures.
  - [ ] Image logs capture enough structured response metadata to diagnose provider fallback, missing image URL/bytes, storage save failures, model/aspect-ratio mapping, and provider error bodies.
  - [ ] A project-scoped debug log viewer or admin-only provider debug page can filter by project, slide, operationType, provider, status, and createdAt.
  - [ ] Normal members can only see logs for their own projects if project-scoped viewing is exposed; admin views can inspect all logs. Sensitive snapshots remain redacted in both cases.
  - [ ] Debug log persistence failure does not fail the successful provider operation, but the failure is surfaced to server logs or a fallback diagnostic path.
  - [ ] Retention/deletion policy is documented: deleted projects/slides should not expose logs in default UI, and long-term retention can be capped or cleanup-ready.
  - [ ] Tests cover successful LLM log, failed LLM validation log, successful image log, provider fallback/missing-key log, redaction, ownership/admin access, and log persistence failure behavior.
  - [ ] Browser or equivalent visual check confirms recent LLM and image provider logs can be queried after a real or mocked generation workflow.
  - [ ] `.ai/status/active/T027C-provider-debug-logs.md` records the schema, redaction policy, viewer route, and verification results.
- Notes:
  - 2026-06-04 user direction: debugging needs separate logs for LLM/image provider calls and response results that can be queried later.
  - 2026-06-04 priority update: this is the highest-priority implementation item because LLM correctness and provider behavior cannot be verified well without queryable request/response logs.
  - Current state: image generation history stores provider/model/status/error and prompt snapshots in `slide_image_generations`, and the Images tab shows a limited history. It does not store raw provider response bodies, HTTP status, request id, latency, or structured debug snapshots.
  - Current state: LLM storyboard generation stores only project-level `storyStructure`, `targetSlideCountRationale`, and `generationError`; there is no dedicated LLM request/response debug log table or viewer.
  - This task is separate from T027B because T027B is a cost/usage ledger and intentionally avoids prompt 전문 or sensitive response bodies.

#### Task T028. MVP end-to-end smoke와 Docker persistence 검증
- Priority: High
- Status: Backlog
- Issue: #28
- PR: None
- Depends on: T002, T009C, T023C, T023D, T024, T026, T027, T027A1, T027A2, T027A3, T027B, T027C
- Branch: `feature/T028-mvp-e2e-smoke`
- Expected PR Unit: `PR-T028`
- Acceptance Criteria:
  - [ ] Docker Compose로 앱을 실행할 수 있다.
  - [ ] `/app/data` volume에 SQLite DB와 generated images가 persistence 된다.
  - [ ] signup/login -> admin user key assignment -> project create -> storyboard generate -> confirm -> image generate -> export 흐름을 검증했다.
  - [ ] frontend/UI 변경 결과를 브라우저 또는 equivalent visual check로 확인했다.
  - [ ] 실패/재시도/partial batch failure state를 최소 한 번 검증했다.
  - [ ] `.ai/status/active/T028-mvp-e2e-smoke.md`에 전체 검증 명령, URL, 결과, 한계가 기록되어 있다.
- Notes:
  - 이 Task가 merge된 뒤 초기 MVP를 실사용 후보로 판단한다.

## Epic E07B. Multi-LLM Providers and Model Selection

Most model selection and admin-configurable routing work is after MVP. However, direct-provider fallback from assigned account-level keys is a real-use bugfix once members can be assigned OpenAI/Anthropic/Gemini keys without an OpenRouter key.

### Feature F13B. Multi-Provider LLM Generation

#### Task T035A. Storyboard LLM direct-provider fallback bugfix
- Priority: High
- Status: Ready
- Issue: #57
- PR: None
- Depends on: T015B, T009B
- Branch: `fix/T035A-storyboard-llm-provider-fallback`
- Expected PR Unit: `PR-T035A`
- Acceptance Criteria:
  - [ ] Storyboard generation does not fail solely because the member has no OpenRouter key when another supported account-level LLM key is assigned.
  - [ ] If an OpenRouter key is present, storyboard generation continues to prefer the existing OpenRouter path.
  - [ ] If no OpenRouter key is present but an OpenAI account-level key is assigned, storyboard generation falls back to a direct OpenAI LLM adapter for `story_structure` and `slide_breakdown`.
  - [ ] Direct provider fallback uses the same `storyboardResponseSchema` / `slideBreakdownSchema` validation before accepting generated storyboard data.
  - [ ] Missing-key errors list the supported account-level keys that can satisfy storyboard generation instead of saying only OpenRouter is required.
  - [ ] Fallback selection is deterministic and recorded in status/test evidence: initial default order is OpenRouter -> OpenAI, with Anthropic/Gemini direct fallback left to T035 unless implemented in this bugfix.
  - [ ] Mocked provider tests cover OpenRouter present, OpenRouter missing with OpenAI present, all supported keys missing, and invalid direct-provider schema output.
  - [ ] Browser or equivalent real-use check verifies a member with only an OpenAI key can start storyboard generation without the current missing-OpenRouter failure.
  - [ ] `.ai/status/active/T035A-storyboard-llm-provider-fallback.md` records provider selection rules, verified key combinations, and any direct-provider API limitations.
- Notes:
  - 2026-06-04 real-use bug: a member assigned only an OpenAI API key gets a storyboard generation error because `app/api/projects/[projectId]/storyboard/generate/route.ts` checks only the `openrouter` key and fails before looking for other assigned account-level keys.
  - This task is Ready because PR #38 already provides the account-level key storage/admin assignment surface needed for the immediate bugfix; this bugfix resolves one of the remaining T009C key-reuse gaps.
  - Admin-configurable routing, fallback toggles, and full provider priority UI remain T039 scope.

#### Task T035. OpenRouter, OpenAI, Claude, Gemini LLM provider adapters 구현
- Priority: Medium
- Status: Backlog
- Issue: #29
- PR: None
- Depends on: T035A, T009C
- Branch: `feature/T035-multi-llm-providers`
- Expected PR Unit: `PR-T035`
- Acceptance Criteria:
  - [ ] OpenRouter LLM provider path remains supported.
  - [ ] OpenAI LLM provider adapter supports `story_structure` and `slide_breakdown`.
  - [ ] Anthropic Claude LLM provider adapter supports `story_structure` and `slide_breakdown`.
  - [ ] Google Gemini LLM provider adapter supports `story_structure` and `slide_breakdown`.
  - [ ] 모든 provider output은 동일한 `storyboardResponseSchema` / `slideBreakdownSchema` validation을 통과해야 accepted storyboard data로 저장된다.
  - [ ] provider별 API key는 T009C의 account-level provider key store에서 가져온다.
  - [ ] provider별 failure, rate limit, invalid JSON/schema error가 표준 generation error로 surfaced 된다.
  - [ ] mocked provider tests가 request mapping, schema validation, retry/error behavior를 검증한다.
  - [ ] `.ai/status/active/T035-multi-llm-providers.md`에 provider별 검증 결과와 미검증 외부 API 한계가 기록되어 있다.
- Notes:
  - "Claude"는 provider implementation에서 Anthropic account/API key로 취급한다.
  - 실제 provider별 최신 API shape와 model id는 구현 시점에 공식 문서로 확인한다.
  - T035A handles the immediate OpenRouter-missing/OpenAI-assigned storyboard generation bugfix; this task completes the broader direct OpenAI/Anthropic/Gemini LLM provider surface.

#### Task T036. User-selectable LLM model selection 구현
- Priority: Medium
- Status: Backlog
- Issue: #30
- PR: None
- Depends on: T035
- Branch: `feature/T036-llm-model-selection`
- Expected PR Unit: `PR-T036`
- Acceptance Criteria:
  - [ ] 사용자는 storyboard generation에 사용할 provider를 직접 선택하지 않고, 사용 가능한 주요 LLM model만 선택한다.
  - [ ] 모델 catalog는 display name, canonical provider, required account key source, provider route preference, official model id, capability tags, status를 포함한다.
  - [ ] 모델 display name 예시는 `GPT 5.5`, `GPT 5.5 thinking high`, `Claude Opus 4.8`, `Claude Sonnet 4.6`, `Gemini 3.1 Flash`, `Gemini 3.5 Pro` 같은 형태를 따르되, 정확한 model id와 표시명은 구현 시점 공식 문서/Provider 문서 기준으로 결정한다.
  - [ ] OpenRouter account key가 등록된 사용자는 OpenRouter가 지원하는 OpenAI/Anthropic/Gemini 계열 catalog model을 모두 선택할 수 있다.
  - [ ] OpenAI account key만 등록된 사용자는 OpenAI 계열 model만 활성화되고 Claude/Anthropic, Gemini 계열 model은 disabled 상태와 이유가 표시된다.
  - [ ] Anthropic account key만 등록된 사용자는 Claude 계열 model만 활성화되고 OpenAI, Gemini 계열 model은 disabled 상태와 이유가 표시된다.
  - [ ] Gemini account key만 등록된 사용자는 Gemini 계열 model만 활성화되고 OpenAI, Claude 계열 model은 disabled 상태와 이유가 표시된다.
  - [ ] 여러 account key가 등록되어 있으면 각 key로 직접 호출 가능한 model과 OpenRouter 경유 model의 routing priority가 명확히 정해진다.
  - [ ] project creation 또는 project settings에서 선택한 model key가 project에 저장되고, generation history 또는 project metadata에 resolved provider route, official model id, display name snapshot이 저장된다.
  - [ ] 선택한 model에 필요한 account key가 generation 시점에 삭제되었거나 비활성화된 경우 generation 전에 명확한 provider-key error를 표시한다.
  - [ ] model 선택이 없으면 app-level default model policy를 사용한다.
  - [ ] default model policy는 구현 시점에 확정된 catalog에서 `default_storyboard_model_key`로 저장되며, OpenRouter key가 있으면 기본적으로 최고 품질 balanced storyboard model을 우선 사용하고, OpenRouter key가 없으면 등록된 direct provider key 중 우선순위에 따라 OpenAI -> Anthropic -> Gemini default model로 fallback한다.
  - [ ] default model이 현재 사용자의 등록 key로 실행 불가능하면 가장 높은 우선순위의 실행 가능한 model을 자동 선택하거나, 실행 가능한 model이 없으면 generation 전에 key assignment 안내를 표시한다.
  - [ ] disabled model은 선택 불가하지만, 필요한 API key와 관리자 설정 경로를 사용자에게 설명한다.
  - [ ] 브라우저 또는 equivalent visual check로 model-only 선택 UX, disabled model state, default model fallback UX를 확인했다.
  - [ ] `.ai/status/active/T036-llm-model-selection.md`에 검증 결과가 기록되어 있다.
- Notes:
  - 이 기능은 MVP 이후로 미룬다.
  - MVP에서는 사용자에게 LLM model 선택 UI를 노출하지 않는다.
  - Provider는 내부 routing concern으로 취급하고, 사용자-facing 선택지는 model 중심으로 유지한다.
  - 모델명 예시는 planning placeholder다. 구현 시점에는 OpenAI, Anthropic, Google/Gemini, OpenRouter 공식 문서에서 최신 model id, availability, routing support를 확인한다.

#### Task T037. Unified provider key migration cleanup 구현
- Priority: Medium
- Status: Backlog
- Issue: #31
- PR: None
- Depends on: T009C, T035, T036
- Branch: `chore/T037-unified-provider-key-cleanup`
- Expected PR Unit: `PR-T037`
- Acceptance Criteria:
  - [ ] 기존 `openai_images`, `nano_banana` 등 image-only provider key naming이 code/docs/tests에서 제거되거나 compatibility layer로 격리된다.
  - [ ] account-level provider key names(`openrouter`, `openai`, `anthropic`, `gemini`)가 API, DB, admin UI, tests에서 일관된다.
  - [ ] image generation provider와 LLM provider가 같은 account-level key source를 공유한다.
  - [ ] image model catalog가 display name, canonical provider, required account key source, provider route preference, official model id, status를 포함한다.
  - [ ] 현재 사용자에게 OpenAI account key가 있으면 GPT Image/OpenAI Images 계열 image model이 활성화되고, key가 없으면 disabled state와 이유가 표시된다.
  - [ ] 현재 사용자에게 Gemini account key가 있으면 Nano Banana/Gemini image 계열 image model이 활성화되고, key가 없으면 disabled state와 이유가 표시된다.
  - [ ] OpenRouter가 구현 시점에 특정 image model routing을 공식 지원하면 OpenRouter key 기반 활성화 여부를 확인하고, 지원하지 않으면 image model catalog에서 OpenRouter route를 disabled 또는 unsupported로 표시한다.
  - [ ] project default image model 선택 UI는 현재 등록된 account key 상태를 기준으로 GPT Image/OpenAI Images, Nano Banana/Gemini image options를 활성화/비활성화한다.
  - [ ] 기존 project의 default image model이 현재 key 상태로 실행 불가능하면 image generation 전에 명확한 key assignment 안내 또는 다른 사용 가능 image model 선택 UX를 제공한다.
  - [ ] default image model policy를 결정한다: OpenAI key가 있으면 기본값은 OpenAI Images 계열, OpenAI key가 없고 Gemini key가 있으면 Gemini/Nano Banana 계열, 둘 다 없으면 image generation 전에 key assignment 안내를 표시한다.
  - [ ] LLM model catalog(T036)와 image model catalog는 같은 account-level key assignment 상태를 읽고, provider key 삭제/추가 후 활성화 상태가 즉시 반영된다.
  - [ ] migration 또는 compatibility decision이 status file에 기록되어 있다.
  - [ ] `.ai/status/active/T037-unified-provider-key-cleanup.md`에 검증 결과가 기록되어 있다.
- Notes:
  - 신규 설치/신규 DB 기준으로는 account-level provider key model을 우선한다.
  - 기존 개발 데이터 호환이 필요하면 temporary compatibility mapping을 명시적으로 둔다.
  - 이미지 모델명과 공식 model id는 구현 시점의 OpenAI, Google/Gemini, OpenRouter 공식 문서를 확인해 확정한다.

#### Task T038. Post-MVP provider error and recovery UX 구현
- Priority: Medium
- Status: Backlog
- Issue: #32
- PR: None
- Depends on: T027A1, T027A2, T027A3, T035, T036, T037
- Branch: `feature/T038-provider-error-recovery-ux`
- Expected PR Unit: `PR-T038`
- Acceptance Criteria:
  - [ ] LLM generation, image generation, batch generation 실패 시 사용자에게 provider/key/model/rate-limit/schema-validation/storage failure를 구분한 error 화면 또는 error panel을 보여준다.
  - [ ] 에러 화면은 raw provider secret, API key, 민감한 response body를 노출하지 않는다.
  - [ ] key 누락/삭제/비활성화 에러는 필요한 account key와 관리자 설정 경로를 안내한다.
  - [ ] model unavailable 또는 disabled 에러는 현재 사용 가능한 model/image model 선택으로 이동할 수 있게 한다.
  - [ ] rate limit/timeout/transient failure는 재시도 가능 여부, 마지막 시도 시간, retry action을 보여준다.
  - [ ] structured output/schema validation failure는 사용자가 이해할 수 있는 설명과 재생성 action을 제공하되, 내부 schema dump를 그대로 노출하지 않는다.
  - [ ] partial batch failure는 실패한 slide 목록, 성공한 slide 목록, failed-only retry action을 제공한다.
  - [ ] error state는 project detail, storyboard workspace, image history, batch progress UI에서 일관되게 표시된다.
  - [ ] 브라우저 또는 equivalent visual check로 주요 error states를 확인했다.
  - [ ] `.ai/status/active/T038-provider-error-recovery-ux.md`에 error taxonomy, 화면 상태, 검증 결과가 기록되어 있다.
- Notes:
  - 2026-06-03 user direction: 에러 발생 시 사용자에게 보여줄 화면은 필요하지만 MVP 이후로 처리한다.
  - MVP 전에는 기존 generation failure text와 loading/progress state를 유지하고, 세분화된 recovery UX는 이 task에서 구현한다.

#### Task T039. Admin-configurable provider routing and fallback policy 구현
- Priority: Medium
- Status: Backlog
- Issue: #33
- PR: None
- Depends on: T035, T036, T037
- Branch: `feature/T039-provider-routing-policy`
- Expected PR Unit: `PR-T039`
- Acceptance Criteria:
  - [ ] LLM calls use the same routing principle as image generation: OpenRouter first when available, then direct provider fallback for the selected model when OpenRouter is unavailable or fails.
  - [ ] Image generation keeps OpenRouter-first routing and direct OpenAI/Gemini fallback behavior for supported image models.
  - [ ] 관리자는 admin settings surface에서 provider priority order를 설정할 수 있다.
  - [ ] 관리자는 provider fallback 허용/차단 정책을 LLM과 image generation에 각각 또는 공통 정책으로 설정할 수 있다.
  - [ ] routing policy는 account-level provider key assignment 상태와 model/image model catalog availability를 함께 고려한다.
  - [ ] 선택한 provider route가 disabled, missing key, unsupported model, rate-limited, unavailable 상태이면 다음 route로 fallback하거나 사용자에게 명확한 error를 표시한다.
  - [ ] fallback 발생 시 generation history 또는 provider usage ledger에 attempted route, final route, failure reason을 secret 없이 기록한다.
  - [ ] mocked provider tests가 OpenRouter success, OpenRouter failure direct fallback, fallback disabled, missing key, unsupported model case를 검증한다.
  - [ ] 브라우저 또는 equivalent visual check로 admin routing 설정과 generation-time routing 결과 표시를 확인했다.
  - [ ] `.ai/status/active/T039-provider-routing-policy.md`에 routing policy, fallback matrix, 검증 결과가 기록되어 있다.
- Notes:
  - 2026-06-04 planning handoff from merged PR #12: LLM calls should follow the image generation provider priority policy, and admins should be able to configure priority/fallback behavior for both LLM and image generation.
  - T035A provides the fixed default storyboard fallback needed before admin-configurable routing exists; T039 should build on that behavior rather than reintroducing an OpenRouter-only hard requirement.

---

## Epic E08. Post-MVP Prompt Quality and Prompt Caching Improvements

This epic is explicitly after MVP. Prompt hardening and prompt caching should improve quality, cost, and observability after the core storyboard, structural editing, image generation, export, and MVP smoke flows work. These tasks must not block MVP feature delivery such as T023B or the E05 AI-assisted structure editing tasks.

### Feature F14. Reusable Prompt Quality and Cache Readiness

#### Task T015D. Reusable LLM prompt quality baseline and prompt-engineer review
- Priority: Medium
- Status: Backlog
- Issue: #34
- PR: None
- Depends on: T028
- Branch: `feature/T015D-storyboard-prompt-hardening`
- Expected PR Unit: `PR-T015D`
- Acceptance Criteria:
  - [ ] Storyboard generation, slide count regeneration, slide content regeneration, AI merge/split/insert/reflow, and image prompt generation에서 재사용할 prompt quality baseline을 정의한다.
  - [ ] 이 task 구현 시 prompt-engineering focused subagent 또는 prompt-engineer review pass를 사용해 prompt wording, field guidance, examples, cache-friendly structure를 검토한다.
  - [ ] 프롬프트는 static developer/system instruction과 variable user input을 분리하고, Markdown section headings 또는 XML-style delimiters로 storyline, count policy, previous structure JSON의 경계를 명확히 구분한다.
  - [ ] 반복되는 static instruction과 examples는 prompt 앞쪽에 두고, 사용자 storyline 같은 request-specific content는 뒤쪽에 둔다.
  - [ ] Structured Outputs schema와 app-side Zod type이 divergence되지 않도록 prompt/schema 관련 테스트 또는 review guard를 둔다.
  - [ ] 사용자 입력이 storyboard task에 부적합하거나 너무 모호한 경우 hallucinated slides를 억지로 만들지 않고, sections/improvement suggestions/rationale/error로 처리하는 지침이 prompt에 포함된다.
  - [ ] slide `title` 작성 지침이 포함된다: 4-10단어 내외, executive deck headline처럼 구체적이고 action-oriented이며, 서로 중복되지 않고 해당 slide의 핵심 메시지를 예고해야 한다.
  - [ ] slide `coreMessage` 작성 지침이 포함된다: 한 문장으로 consultant-style takeaway를 제시하고, 단순 주제명이나 제목 반복이 아니라 의사결정자가 기억해야 할 결론을 담아야 한다.
  - [ ] slide `contentPoints` 작성 지침이 포함된다: 3-5개 bullet을 기본으로 하고, 각 bullet은 evidence, implication, action 중 하나를 담당하며, storyline에 없는 수치/사실은 지어내지 않는다.
  - [ ] slide `visualDirection` 작성 지침이 포함된다: chart/table/diagram/timeline/process map/comparison matrix 등 구체적 시각 형식, 주요 구성요소, 강조해야 할 관계를 설명하고, "clean modern slide" 같은 일반 표현만 쓰지 않는다.
  - [ ] slide `imagePrompt` 작성 지침이 포함된다: 이미지 생성용 visual prompt로 쓰일 수 있게 layout, composition, subject, style, color/contrast, aspect ratio intent를 포함하되, 작은 본문 텍스트나 읽기 어려운 세부 라벨 생성을 요구하지 않는다.
  - [ ] storyboard와 slide card에 노출되는 모든 user-visible textual fields는 기본적으로 한국어로 작성하도록 language policy를 포함하고, 영문 고유명사/공식 용어/인용문만 필요한 경우 보존한다.
  - [ ] slide `slideRole` 작성 지침이 포함된다: `Context`, `Problem`, `Insight`, `Evidence`, `Recommendation`, `Roadmap`, `Risk`, `Appendix` 같은 consultant workflow role을 일관되게 사용하거나 동등한 controlled vocabulary를 정의한다.
  - [ ] section field 작성 지침이 포함된다: `sectionTitle`은 deck chapter label, `sectionId`는 stable machine id, `sourceSummary`는 storyline 근거 요약, `suggestedSlideCount`는 해당 section의 권장 분량으로 작성한다.
  - [ ] slide 수정/재생성 prompt 지침이 포함된다: 기존 userModified field를 보호하고, 변경 instruction이 요구한 field만 바꾸며, 바뀐 field와 유지된 field를 구분할 수 있어야 한다.
  - [ ] 구조 변경 prompt 지침이 포함된다: reorder/delete/add/merge/split 이후 deck flow, section continuity, duplicated message 제거, transition slide 필요 여부를 점검하도록 한다.
  - [ ] image generation prompt 지침이 포함된다: storyboard field를 이미지 prompt로 변환할 때 text-heavy slide rendering을 피하고, reference image가 아닌 consultant slide visual composition을 우선한다.
  - [ ] prompt examples 또는 fixture 설명이 최소 1개 이상 포함되어, 좋은 slide object와 나쁜 generic slide object의 차이를 검증할 수 있다.
  - [ ] story_structure, slide_breakdown, regenerate-with-instruction, slide-count-change regeneration 요청이 static prompt prefix를 최대한 공유하도록 prompt builder를 구성한다.
  - [ ] provider/API가 지원하는 경우 prompt cache key 또는 동등한 routing hint를 안정적으로 설정하고, 지원하지 않는 provider path에서는 cache hint를 명시적으로 no-op 처리한다.
  - [ ] prompt cache effectiveness를 확인할 수 있도록 provider response usage의 cached token metadata 또는 provider별 equivalent metric을 logging/status에 남길 수 있는 contract를 정의한다.
  - [ ] prompt payload unit test가 field-level guidance text, delimiters, incompatible-input instruction, structured-output schema request를 검증한다.
  - [ ] `.ai/status/active/T015D-storyboard-prompt-hardening.md`에 참조한 공식 프롬프트 문서, prompt before/after, 검증 결과가 기록되어 있다.
- Notes:
  - 2026-06-03 user direction: prompt quality enhancing work should happen after all MVP functionality works correctly.
  - 2026-06-03 user direction: 프롬프트 구조뿐 아니라 각 JSON output field가 어떤 품질 기준으로 작성되어야 하는지 명시한다.
  - 2026-06-03 user direction: prompt 품질 기준은 초기 슬라이드별 프롬프트 생성 호출에만 한정하지 않고, 이후 페이지 수정, 슬라이드 순서 수정, 슬라이드 삭제/추가/병합, 내용 재생성, 이미지 생성 프롬프트에도 적용한다.
  - OpenAI Prompt Engineering guidance to account for during implementation: use message roles/instructions for higher-priority developer rules, use Markdown/XML delimiters for prompt boundaries, include relevant context, and keep GPT-style models explicit about desired output.
  - OpenAI Structured Outputs guidance to account for during implementation: keep schema adherence via structured output, explicitly handle user-generated input that cannot produce a valid response, and avoid schema/type divergence.
  - OpenAI Prompt Caching guidance to account for during implementation: put static/repeated instructions and examples before variable storyline/context, preserve exact shared prefixes where practical, use provider-supported cache keys consistently, and observe cached token metrics when available.
  - 현재 OpenRouter Chat Completions route는 `system`/`user` messages와 `response_format.json_schema.strict=true`를 유지하되, prompt body와 field-level guidance를 output quality 기준에 맞춰 보강한다.
  - OpenRouter 경유 OpenAI model의 prompt caching 지원/usage metadata 노출 여부는 구현 시점에 OpenRouter와 OpenAI 공식 문서 기준으로 확인한다.

#### Task T023A. Image prompt cache readiness와 regeneration prompt assembly 정리
- Priority: Low
- Status: Backlog
- Issue: #35
- PR: None
- Depends on: T023, T015D
- Branch: `feature/T023A-image-prompt-cache-readiness`
- Expected PR Unit: `PR-T023A`
- Acceptance Criteria:
  - [ ] image generation prompt builder가 static common style/instruction prefix와 slide-specific variable content를 분리한다.
  - [ ] image generation prompt builder가 T015D의 reusable prompt quality baseline을 따라 slide field guidance, image prompt guidance, cache-friendly structure를 반영한다.
  - [ ] image generation prompt builder가 T015E의 Korean-first storyboard language policy를 반영해, generated mockup에 visible text가 포함될 경우 기본적으로 한국어가 되도록 지시한다.
  - [ ] single generation, regeneration, batch generation이 동일한 static prompt prefix를 최대한 공유하고 slide title/core message/content points/visual direction/imagePrompt만 뒤쪽 variable block으로 배치한다.
  - [ ] provider/API가 prompt caching 또는 prompt cache key를 지원하는 경우 stable cache key 또는 equivalent routing hint를 사용할 수 있는 provider input field를 정의한다.
  - [ ] OpenAI Images, Gemini/Nano Banana provider별 prompt caching 지원 여부와 usage metadata 노출 여부를 구현 시점 공식 문서로 확인하고 status file에 기록한다.
  - [ ] provider가 prompt caching을 지원하지 않는 경우에도 prompt snapshots는 동일한 조합 규칙을 유지하고 cache hint는 no-op으로 처리한다.
  - [ ] image generation history에 prompt snapshot과 함께 provider usage/cached-token metadata 또는 unsupported reason을 저장할지 결정하고 status file에 기록한다.
  - [ ] mocked provider tests가 common prefix reuse, slide-specific suffix placement, provider cache hint pass-through/no-op behavior를 검증한다.
  - [ ] `.ai/status/active/T023A-image-prompt-cache-readiness.md`에 provider별 캐싱 지원 확인 결과와 검증 결과가 기록되어 있다.
- Notes:
  - 2026-06-03 user direction: prompt quality/cache readiness work should not block core MVP image generation and should happen after MVP functionality works correctly.
  - 2026-06-03 user direction: 내용 재생성, 페이지수 변경 재생성, 이미지 생성 단계에서도 prompt caching 활용 여지를 고려한다.
  - 2026-06-04 user direction: prompt caching/quality work should be grouped after MVP so it does not push down feature work such as T023B.
  - 2026-06-04 real-use finding: image generation calls should not default to English visible text; use Korean for any generated slide/mockup text unless source terms must remain in English.
  - OpenAI Prompt Caching guidance to account for during implementation: exact shared prefixes improve cache hits, variable request-specific content should come later, and cached token metrics should be observed where available.
  - 이 task는 provider support가 있는 경우의 cache-friendly prompt assembly와 observability contract를 정리한다. 실제 batch orchestration은 T024에서 처리한다.

---

## Epic E99. Planning and Documentation Maintenance

These tasks should be handled in dedicated planning/docs sessions, not ordinary feature implementation sessions.

### Feature F99. Global Planning Document Updates

#### Task D001. IMPLEMENTATION_PLAN.md 상태 갱신
- Priority: High
- Status: In Progress
- Issue: #58
- PR: None
- Depends on: Merged PR evidence
- Branch: `docs/fix-global-dev-docs-and-bugs`
- Expected PR Unit: `PR-D001`
- Acceptance Criteria:
  - [x] merged PR 기준으로 task status를 갱신한다.
  - [x] merged되지 않은 task는 `Done`으로 표시하지 않는다.
  - [x] PR notes와 `.ai/status/active/` 기록에서 follow-up을 수집한다.
  - [x] 근거가 불명확한 항목은 `Needs Review`로 표시한다.
- Notes:
  - 이 Task는 코드 파일을 수정하지 않는다.
  - 2026-06-04 sync checked remote PRs through #40 and Issues #6-#35. No open PRs were present at sync time.
  - Issue #36 does not exist in the remote repository as of the 2026-06-04 sync, so this planning task is tracked without a GitHub Issue until one is explicitly created.
