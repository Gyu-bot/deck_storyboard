# Deck Storyboard Implementation Plan

> This plan is the source of truth for task IDs. Feature sessions should work by task ID, create/update a task-specific status file under `.ai/status/active/`, and avoid editing this global plan unless the user explicitly starts a planning/docs update session.

## Tracking Policy

- **Status values:** `Backlog`, `In Progress`, `Needs Review`, `Done`, `Blocked`
- **Done 기준:** A task is `Done` only after its PR has been merged into `main`.
- **Default PR 단위:** One task per PR unless this plan explicitly groups tasks or the user approves a different split.
- **Task status file:** Each implementation branch should create or update `.ai/status/active/<task-id>-<short-name>.md`.
- **PR body:** Each PR should mention the task ID, acceptance criteria covered, status-file path, and any follow-up work.
- **Plan updates:** Update this document from merged PRs, PR notes, task status files, or direct user instruction in a dedicated planning/docs session.

---

## Epic E00. Project Foundation

### Feature F00. App Scaffold and Development Baseline

#### Task T001. Next.js 앱 스캐폴드와 기본 런타임 구성
- Priority: High
- Status: Done
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

---

## Epic E01. Persistence and Domain Model

### Feature F01. SQLite and Drizzle Data Model

#### Task T004. SQLite + Drizzle 초기 스키마 구현
- Priority: High
- Status: Done
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
- Depends on: T006
- Branch: `feature/T007-auth-ui`
- Expected PR Unit: `PR-T007`
- Acceptance Criteria:
  - [x] `/signup` 화면에 이메일, 비밀번호, 비밀번호 확인, OpenRouter API key, optional image provider key 입력이 있다.
  - [x] `/login` 화면에 이메일/비밀번호 입력과 로그인 버튼이 있다.
  - [x] 로그아웃 action 또는 `/logout` route가 동작한다.
  - [x] 로그인 후 `/projects`로 이동한다.
  - [x] 실패 시 사용자에게 에러 메시지를 표시한다.
  - [x] 브라우저 또는 equivalent visual check로 주요 화면을 확인했다.
  - [x] `.ai/status/active/T007-auth-ui.md`에 확인 결과가 기록되어 있다.
- Notes:
  - Settings의 key 교체/삭제는 T009에서 처리한다.
  - 2026-06-03 user-directed Korean UI pass localized signup/login copy and verified the updated smoke CTA.
  - 가입 시 API key를 받는 현재 UI는 T009A 이후 제거하고, provider key 할당은 관리자 화면에서 처리하는 방향으로 전환한다.

#### Task T007A. Login layout vertical spacing UX 수정
- Priority: High
- Status: Backlog
- Depends on: T007
- Branch: `fix/T007A-login-layout-spacing`
- Expected PR Unit: `PR-T007A`
- Acceptance Criteria:
  - [ ] `/login` 화면의 세로 여백이 과도하지 않고 첫 viewport 안에서 자연스럽게 보인다.
  - [ ] desktop과 mobile viewport에서 로그인 form, heading, 보조 링크가 과하게 분리되지 않는다.
  - [ ] signup 화면과 login 화면의 spacing rhythm이 일관된다.
  - [ ] 로그인 실패 메시지 표시 시 레이아웃이 크게 밀리지 않는다.
  - [ ] 브라우저 또는 equivalent visual check로 `/login` 주요 viewport를 확인했다.
  - [ ] `.ai/status/active/T007A-login-layout-spacing.md`에 before/after 확인 결과가 기록되어 있다.
- Notes:
  - 2026-06-03 user feedback: 현재 `/login` 화면은 세로 방향 여백이 너무 크다.

### Feature F03. User API Key Management

#### Task T008. API key AES-GCM 암호화 저장 구현
- Priority: High
- Status: Done
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
  - T009A 이후 일반 사용자의 self-service provider key 관리는 제거하거나 관리자 할당 상태 확인 전용으로 축소한다.
  - T009C 이후 이미지 provider 전용 key 관리는 account-level provider key 관리로 대체한다.

---

## Epic E02A. MVP Admin User and API Key Management

MVP scope:

- Users sign up and log in without entering provider API keys.
- Admins assign account-level provider keys to users before live LLM/image generation is connected.
- Account-level provider keys are shared across LLM and image generation paths where the provider supports both.
- Admin/member management is an MVP prerequisite, not a post-MVP feature.

### Feature F03A. Admin-Managed Membership and Provider Keys

#### Task T009A. User signup/login simplification and admin role foundation 구현
- Priority: High
- Status: Backlog
- Depends on: T006, T007, T008
- Branch: `feature/T009A-admin-role-auth-simplification`
- Expected PR Unit: `PR-T009A`
- Acceptance Criteria:
  - [ ] `/signup`은 이메일, 비밀번호, 비밀번호 확인만 받는다.
  - [ ] 일반 회원 가입 시 OpenRouter, OpenAI, Claude/Anthropic, Gemini 등 provider API key 입력은 요구하지 않는다.
  - [ ] 일반 사용자는 자신의 API key full value를 입력, 교체, 조회할 수 없다.
  - [ ] 관리자 권한을 식별할 수 있는 user role 또는 equivalent admin flag가 DB와 session에 반영된다.
  - [ ] 관리자 권한이 없는 사용자는 admin routes/pages/API에 접근할 수 없다.
  - [ ] 기존 key encryption/storage contract는 관리자 할당 flow에서도 재사용된다.
  - [ ] signup/login/auth regression test가 있다.
  - [ ] `.ai/status/active/T009A-admin-role-auth-simplification.md`에 검증 결과가 기록되어 있다.
- Notes:
  - 2026-06-03 user direction: 회원은 가입 시 API key 입력 없이 회원 가입과 로그인만 수행한다.
  - API key 할당 책임은 일반 사용자 self-service에서 관리자 관리 방식으로 이동한다.

#### Task T009B. Admin member and API key management page 구현
- Priority: High
- Status: Backlog
- Depends on: T009A
- Branch: `feature/T009B-admin-member-key-management-page`
- Expected PR Unit: `PR-T009B`
- Acceptance Criteria:
  - [ ] 관리자 전용 `/admin` 또는 `/admin/users` 회원관리 화면이 있다.
  - [ ] 관리자 화면에서 회원 목록, 이메일, 가입일, 최근 수정일, 계정 상태, provider key 할당 상태를 한 화면에서 볼 수 있다.
  - [ ] 회원 검색 또는 최소한 이메일 기준 filtering이 가능하다.
  - [ ] 회원 상세 또는 expandable row에서 회원별 OpenRouter, OpenAI, Anthropic/Claude, Gemini API key 할당 상태를 확인할 수 있다.
  - [ ] 회원별 API key 추가/교체/삭제 action으로 이동하거나 같은 화면에서 inline으로 실행할 수 있다.
  - [ ] 저장된 API key 값은 masked form 또는 assigned/unassigned 상태로만 표시되고 full value는 노출되지 않는다.
  - [ ] 회원별 generation 가능 여부를 provider key assignment 상태 기준으로 판단할 수 있다.
  - [ ] 관리자 화면은 일반 프로젝트 작업 화면과 명확히 분리된다.
  - [ ] 관리자 권한이 없는 접근은 login 또는 forbidden 상태로 차단된다.
  - [ ] 브라우저 또는 equivalent visual check로 admin access control, 회원 목록, 회원별 API key 관리 UI를 확인했다.
  - [ ] `.ai/status/active/T009B-admin-member-key-management-page.md`에 검증 결과가 기록되어 있다.
- Notes:
  - 초기 범위는 회원 삭제보다 회원 조회, 계정 상태 확인, 회원별 key 할당/교체/삭제에 초점을 둔다.
  - 회원관리와 회원별 API key 관리는 별도 흩어진 화면보다 같은 admin workflow 안에서 처리한다.

#### Task T009C. Admin-managed user API key assignment 구현
- Priority: High
- Status: Backlog
- Depends on: T009B, T008
- Branch: `feature/T009C-admin-api-key-assignment`
- Expected PR Unit: `PR-T009C`
- Acceptance Criteria:
  - [ ] 관리자는 회원별 OpenRouter, OpenAI, Anthropic/Claude, Gemini account-level provider key를 추가/교체/삭제할 수 있다.
  - [ ] 저장된 key는 모든 UI/API response에서 masked form 또는 presence status로만 노출된다.
  - [ ] 일반 사용자 generation flow는 관리자에게 할당된 user-scoped account-level provider key만 사용한다.
  - [ ] OpenAI key는 OpenAI LLM과 OpenAI image generation에 함께 사용할 수 있다.
  - [ ] Gemini key는 Gemini LLM과 Gemini/Nano Banana image generation에 함께 사용할 수 있다.
  - [ ] OpenRouter key는 MVP storyboard generation 기본 LLM provider key로 사용할 수 있다.
  - [ ] Claude는 Anthropic account key로 저장/관리하되 LLM 호출 연결은 MVP 이후 T035에서 처리한다.
  - [ ] key 미할당 회원이 storyboard/image generation을 실행하면 provider-key error가 명확히 표시된다.
  - [ ] 관리자 key 변경/삭제 후 해당 회원의 신규 provider 호출 정책이 즉시 반영된다.
  - [ ] key assignment audit metadata 또는 operation history를 남길지 구현 전 결정하고, 결정 내용을 status에 기록한다.
  - [ ] admin API negative test와 encryption round-trip regression test가 있다.
  - [ ] `.ai/status/active/T009C-admin-api-key-assignment.md`에 검증 결과가 기록되어 있다.
- Notes:
  - 서버 fallback provider key는 계속 사용하지 않는다.
  - 일반 사용자 `/settings`는 T009C 이후 제거하거나 key 할당 상태 확인 전용으로 축소한다.
  - MVP key policy: 이미지 전용 API key를 별도로 받지 않고 provider account key를 LLM과 이미지 생성에 공통 사용한다.

---

## Epic E03. Project Workspace

### Feature F04. Project List and CRUD

#### Task T010. 프로젝트 목록과 soft delete 구현
- Priority: High
- Status: Done
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

### Feature F05. New Project Creation

#### Task T011. 새 프로젝트 one-page 생성 form 구현
- Priority: High
- Status: Done
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

#### Task T012. 스타일 템플릿과 이미지 설정 구현
- Priority: High
- Status: Done
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
- Status: Backlog
- Depends on: T013, T014, T015
- Branch: `feature/T015A-storyboard-sample-contract`
- Expected PR Unit: `PR-T015A`
- Acceptance Criteria:
  - [ ] 하나의 대표 consulting/storyline sample text fixture가 있다.
  - [ ] sample storyline에 대응하는 expected storyboard JSON fixture가 있다.
  - [ ] expected JSON fixture가 `storyboardResponseSchema`와 `slideBreakdownSchema`를 통과한다.
  - [ ] 각 slide fixture가 `sectionId`, `sectionTitle`, `title`, `coreMessage`, `contentPoints`, `visualDirection`, `imagePrompt`, `slideRole`을 포함한다.
  - [ ] fixture를 `createSlideBreakdown` persistence flow에 넣으면 slide rows가 기대 필드와 순서로 저장된다.
  - [ ] LLM prompt가 요구할 최종 출력 객체 형태와 필수/선택 필드가 문서 또는 테스트 설명에 명확히 기록되어 있다.
  - [ ] `.ai/status/active/T015A-storyboard-sample-contract.md`에 샘플, 검증 명령, 확인 결과가 기록되어 있다.
- Notes:
  - 실제 LLM/API 호출은 포함하지 않는다.
  - 이 Task의 목적은 실제 LLM 연결 전에 "스토리라인을 슬라이드 객체 배열로 쪼갠 결과"의 정답 형태를 먼저 고정하는 것이다.
  - 샘플 출력은 Markdown 설명, plain text source, JSON fixture 중 테스트에 가장 적합한 조합을 사용하되, 검증 기준은 JSON structured output으로 둔다.

#### Task T015B. Real OpenRouter storyboard generation 연결
- Priority: High
- Status: Backlog
- Depends on: T015A, T009C
- Branch: `feature/T015B-openrouter-storyboard-call`
- Expected PR Unit: `PR-T015B`
- Acceptance Criteria:
  - [ ] `story_structure` task가 자유 양식 사용자 입력을 정규화해 `documentPurpose`, `overallThesis`, `sections`, optional `improvementSuggestions`, optional `slides`를 생성한다.
  - [ ] `story_structure` 결과에 schema-valid `slides`가 없거나 품질 게이트를 통과하지 못하면 `slide_breakdown` task가 실제 OpenRouter HTTP request로 호출된다.
  - [ ] `story_structure` 결과에 schema-valid `slides`가 있고 품질 게이트를 통과하면 `slide_breakdown` task를 생략하고 해당 slide objects를 저장한다.
  - [ ] request prompt가 T015A에서 고정한 sample output object contract를 따른다.
  - [ ] response가 `storyboardResponseSchema`로 validation되고 invalid output은 accepted storyboard data로 저장되지 않는다.
  - [ ] validation failure는 한 번 retry 후 stage-specific error로 surfaced 된다.
  - [ ] 관리자에게 할당된 OpenRouter account-level user/provider API key가 없으면 server fallback 없이 provider-key error를 반환한다.
  - [ ] mocked HTTP test가 실제 request payload, schema validation, retry, error normalization을 검증한다.
  - [ ] 실제 외부 API 테스트가 불가능하면 mocked provider test와 수동 검증 한계를 status에 기록한다.
  - [ ] `.ai/status/active/T015B-openrouter-storyboard-call.md`에 검증 결과가 기록되어 있다.
- Notes:
  - 기존 deterministic storyboard fallback은 T015A fixture 계약 검증용 또는 테스트용 helper로만 남기고 production generation path에서는 사용하지 않는다.
  - 실제 LLM 연결은 샘플 텍스트와 기대 JSON 객체 기반 테스트가 먼저 통과한 뒤 진행한다.
  - 실사용 입력은 샘플처럼 잘 구조화되어 있지 않을 가능성이 높으므로 기본 설계는 2단계 품질 우선 흐름으로 둔다.
  - 단, 비용과 지연을 줄이기 위해 1차 `story_structure` 결과에 충분한 `slides`가 포함되면 2차 호출을 생략하는 hybrid path를 지원한다.
  - MVP에서는 OpenRouter를 기본 storyboard LLM provider로 사용하고, 사용자 model 선택 UI는 제공하지 않는다.

### Feature F07. Storyboard Review UI

#### Task T016. Vertical storyboard review UI와 confirmation 구현
- Priority: High
- Status: Done
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
- Status: Backlog
- Depends on: T017
- Branch: `fix/T017A-slide-selection-detail-sync`
- Expected PR Unit: `PR-T017A`
- Acceptance Criteria:
  - [ ] left storyboard slide card를 클릭하면 right-side detail panel의 title, core message, content points, visual direction, image prompt, slide role이 선택한 slide의 값으로 즉시 갱신된다.
  - [ ] 선택된 card의 visual selected state와 detail panel 대상 slide가 항상 일치한다.
  - [ ] dev sample preview(`/dev/storyboard-sample`)와 실제 project detail(`/projects/{projectId}`) 양쪽에서 동일하게 동작한다.
  - [ ] textareas가 이전 slide의 stale default value를 유지하지 않는다.
  - [ ] 선택 변경 후 field edit/save/delete action이 현재 선택된 slide id에만 적용된다.
  - [ ] 브라우저 또는 equivalent visual check로 여러 slide 선택 전환을 확인했다.
  - [ ] `.ai/status/active/T017A-slide-selection-detail-sync.md`에 재현, 원인, 검증 결과가 기록되어 있다.
- Notes:
  - 2026-06-03 `/dev/storyboard-sample`에서 slide card 클릭 시 오른쪽 textbox 내용이 선택 card와 동기화되지 않는 현상이 관찰되었다.
  - 구현 시 uncontrolled textarea `defaultValue` 재사용, selected slide state, component keying, client hydration state를 함께 점검한다.

### Feature F09. Manual Slide Operations

#### Task T018. Reorder, add blank, delete slide 구현
- Priority: High
- Status: Done
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
- Status: Backlog
- Depends on: T020, T009C
- Branch: `feature/T021-openai-images-provider`
- Expected PR Unit: `PR-T021`
- Acceptance Criteria:
  - [ ] `gpt-image-2`가 `openai` account-level user/provider API key를 사용한다.
  - [ ] user key가 없으면 provider-key error를 반환하고 server fallback을 사용하지 않는다.
  - [ ] `16:9`, `4:3` aspect ratio input을 provider request에 반영한다.
  - [ ] provider response의 bytes 또는 URL이 local storage로 저장된다.
  - [ ] 실패 응답이 표준 error message로 정규화된다.
  - [ ] `.ai/status/active/T021-openai-images-provider.md`에 검증 결과가 기록되어 있다.
- Notes:
  - 실제 외부 API 테스트가 불가능하면 mocked provider test와 수동 검증 한계를 status에 기록한다.
  - 별도 `openai_images` key가 아니라 OpenAI account key를 LLM과 이미지 생성에 함께 쓰는 방향으로 구현한다.

#### Task T022. Gemini/Nano Banana image provider 구현
- Priority: High
- Status: Backlog
- Depends on: T020, T009C
- Branch: `feature/T022-gemini-image-provider`
- Expected PR Unit: `PR-T022`
- Acceptance Criteria:
  - [ ] Gemini image generation path가 `gemini` account-level user/provider API key를 사용한다.
  - [ ] project default image model의 `nano-banana` 선택은 Gemini provider key로 해석된다.
  - [ ] user key가 없으면 provider-key error를 반환하고 server fallback을 사용하지 않는다.
  - [ ] `16:9`, `4:3` aspect ratio input을 provider request에 반영한다.
  - [ ] provider response의 bytes 또는 URL이 local storage로 저장된다.
  - [ ] 실패 응답이 표준 error message로 정규화된다.
  - [ ] `.ai/status/active/T022-nano-banana-provider.md`에 검증 결과가 기록되어 있다.
- Notes:
  - 실제 외부 API 테스트가 불가능하면 mocked provider test와 수동 검증 한계를 status에 기록한다.
  - 별도 `nano_banana` key가 아니라 Gemini account key를 LLM과 이미지 생성에 함께 쓰는 방향으로 구현한다.

### Feature F11. Individual and Batch Image Generation

#### Task T023. Single slide image generation, regeneration, history 구현
- Priority: High
- Status: Backlog
- Depends on: T017, T021, T022
- Branch: `feature/T023-single-image-generation`
- Expected PR Unit: `PR-T023`
- Acceptance Criteria:
  - [ ] confirmed storyboard에서 single slide image generation을 실행할 수 있다.
  - [ ] resolved prompt snapshot, common prompt snapshot, slide prompt snapshot이 저장된다.
  - [ ] generation history에 model, aspect ratio, status, error, timestamps, selected flag가 저장된다.
  - [ ] regeneration 성공 시 새 image는 history에 추가되지만 자동 selected가 되지 않는다.
  - [ ] 사용자가 completed previous image를 selected image로 선택할 수 있다.
  - [ ] Images tab에서 history와 selected thumbnail을 볼 수 있다.
  - [ ] `.ai/status/active/T023-single-image-generation.md`에 검증 결과가 기록되어 있다.
- Notes:
  - Batch generation은 T024에서 처리한다.

#### Task T024. Batch image generation과 concurrency/progress 구현
- Priority: High
- Status: Backlog
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

---

## Epic E07. Export and MVP Hardening

### Feature F12. Storyboard and Image Export

#### Task T025. Markdown export 구현
- Priority: High
- Status: Backlog
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

#### Task T026. Selected image ZIP export 구현
- Priority: High
- Status: Backlog
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

#### Task T028. MVP end-to-end smoke와 Docker persistence 검증
- Priority: High
- Status: Backlog
- Depends on: T002, T009C, T024, T026, T027
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

## Epic E07B. Post-MVP Multi-LLM Providers and Model Selection

This epic is explicitly after MVP. MVP should keep the primary storyboard generation path simple and use the fixed provider path defined in E04/E02A.

### Feature F13B. Multi-Provider LLM Generation

#### Task T035. OpenRouter, OpenAI, Claude, Gemini LLM provider adapters 구현
- Priority: Medium
- Status: Backlog
- Depends on: T015B, T009C
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

#### Task T036. User-selectable LLM provider/model selection 구현
- Priority: Medium
- Status: Backlog
- Depends on: T035
- Branch: `feature/T036-llm-model-selection`
- Expected PR Unit: `PR-T036`
- Acceptance Criteria:
  - [ ] 사용자가 storyboard generation에 사용할 LLM provider와 주요 model을 선택할 수 있다.
  - [ ] 선택 가능 provider는 OpenRouter, OpenAI, Claude/Anthropic, Gemini를 포함한다.
  - [ ] 모델 목록은 provider별 주요 모델을 표시하되, 구현 시점의 공식 model id를 기준으로 관리한다.
  - [ ] project creation 또는 project settings에서 선택한 provider/model이 project에 저장된다.
  - [ ] model 선택이 없으면 system default provider/model을 사용한다.
  - [ ] 선택한 provider key가 해당 user에게 할당되어 있지 않으면 generation 전에 명확한 provider-key error를 표시한다.
  - [ ] generation history 또는 project metadata에 사용한 provider/model snapshot이 저장된다.
  - [ ] 브라우저 또는 equivalent visual check로 provider/model 선택 UX를 확인했다.
  - [ ] `.ai/status/active/T036-llm-model-selection.md`에 검증 결과가 기록되어 있다.
- Notes:
  - 이 기능은 MVP 이후로 미룬다.
  - MVP에서는 사용자에게 LLM model 선택 UI를 노출하지 않는다.

#### Task T037. Unified provider key migration cleanup 구현
- Priority: Medium
- Status: Backlog
- Depends on: T009C, T035, T036
- Branch: `chore/T037-unified-provider-key-cleanup`
- Expected PR Unit: `PR-T037`
- Acceptance Criteria:
  - [ ] 기존 `openai_images`, `nano_banana` 등 image-only provider key naming이 code/docs/tests에서 제거되거나 compatibility layer로 격리된다.
  - [ ] account-level provider key names(`openrouter`, `openai`, `anthropic`, `gemini`)가 API, DB, admin UI, tests에서 일관된다.
  - [ ] image generation provider와 LLM provider가 같은 account-level key source를 공유한다.
  - [ ] migration 또는 compatibility decision이 status file에 기록되어 있다.
  - [ ] `.ai/status/active/T037-unified-provider-key-cleanup.md`에 검증 결과가 기록되어 있다.
- Notes:
  - 신규 설치/신규 DB 기준으로는 account-level provider key model을 우선한다.
  - 기존 개발 데이터 호환이 필요하면 temporary compatibility mapping을 명시적으로 둔다.

---

## Epic E08. High-Priority Follow-up AI Slide Editing

### Feature F14. AI-Assisted Slide Editing

#### Task T029. AI merge for selected slides 구현
- Priority: Medium
- Status: Backlog
- Depends on: T019, T013
- Branch: `feature/T029-ai-merge-selected-slides`
- Expected PR Unit: `PR-T029`
- Acceptance Criteria:
  - [ ] 사용자가 2개 이상의 slide를 선택해 하나의 slide로 merge할 수 있다.
  - [ ] MVP 후속 범위에서는 우선 인접한 selected slides 병합을 지원하고, 비인접 slides 병합 지원 여부는 구현 전 확정한다.
  - [ ] merged slide는 title, core message, content points, visual direction, image prompt, slide role을 포함한다.
  - [ ] source slides의 순서, 선택 범위, merged result의 before/after snapshot이 operation history에 저장된다.
  - [ ] merge 적용 후 retained slide와 soft-deleted source slides의 ordering이 안정적으로 재계산된다.
  - [ ] retained slide의 user-modified field는 overwrite되지 않는다.
  - [ ] invalid AI output은 저장되지 않고 surfaced 된다.
  - [ ] `.ai/status/active/T029-ai-merge-slides.md`에 검증 결과가 기록되어 있다.
- Notes:
  - 초기 MVP 범위가 아니며 Phase 5 고우선 후속이다.
  - 2026-06-03 user feedback: 여러 slide를 하나로 합치는 병합 기능이 필요하다.

#### Task T030. AI split slide 구현
- Priority: Medium
- Status: Backlog
- Depends on: T019, T013
- Branch: `feature/T030-ai-split-slide`
- Expected PR Unit: `PR-T030`
- Acceptance Criteria:
  - [ ] 한 slide를 AI로 2개 이상 slide로 split할 수 있다.
  - [ ] 생성된 각 slide가 모든 required slide field를 포함한다.
  - [ ] source slide와 generated child slides의 before/after snapshot이 operation history에 저장된다.
  - [ ] retained slide의 user-modified field는 overwrite되지 않는다.
  - [ ] invalid AI output은 저장되지 않고 surfaced 된다.
  - [ ] `.ai/status/active/T030-ai-split-slide.md`에 검증 결과가 기록되어 있다.
- Notes:
  - 초기 MVP 범위가 아니며 Phase 5 고우선 후속이다.

#### Task T031. AI insert slide from natural language 구현
- Priority: Medium
- Status: Backlog
- Depends on: T019, T013
- Branch: `feature/T031-ai-insert-slide`
- Expected PR Unit: `PR-T031`
- Acceptance Criteria:
  - [ ] 사용자가 선택 위치에 natural language instruction으로 slide를 삽입할 수 있다.
  - [ ] inserted slide가 모든 required slide field를 포함한다.
  - [ ] operation history에 instruction, insertion position, generated slide snapshot이 저장된다.
  - [ ] invalid AI output은 저장되지 않고 surfaced 된다.
  - [ ] AI reflow suggestion과 preview/diff UI는 구현하지 않는다.
  - [ ] `.ai/status/active/T031-ai-insert-slide.md`에 검증 결과가 기록되어 있다.
- Notes:
  - 초기 MVP 범위가 아니며 Phase 5 고우선 후속이다.

---

## Epic E99. Planning and Documentation Maintenance

These tasks should be handled in dedicated planning/docs sessions, not ordinary feature implementation sessions.

### Feature F99. Global Planning Document Updates

#### Task D001. IMPLEMENTATION_PLAN.md 상태 갱신
- Priority: High
- Status: Backlog
- Depends on: Merged PR evidence
- Branch: `docs/update-implementation-plan`
- Expected PR Unit: `PR-D001`
- Acceptance Criteria:
  - [ ] merged PR 기준으로 task status를 갱신한다.
  - [ ] merged되지 않은 task는 `Done`으로 표시하지 않는다.
  - [ ] PR notes와 `.ai/status/active/` 기록에서 follow-up을 수집한다.
  - [ ] 근거가 불명확한 항목은 `Needs Review`로 표시한다.
- Notes:
  - 이 Task는 코드 파일을 수정하지 않는다.

#### Task D002. 프로젝트 backlog/status/roadmap 문서 정리
- Priority: Medium
- Status: Backlog
- Depends on: Merged PR evidence or user instruction
- Branch: `docs/update-project-status`
- Expected PR Unit: `PR-D002`
- Acceptance Criteria:
  - [ ] PR notes, task status files, user instruction에 근거한 항목만 정리한다.
  - [ ] 새로운 follow-up task는 근거가 있을 때만 추가한다.
  - [ ] 불확실한 항목은 `Needs Review`로 표시한다.
  - [ ] 코드 파일은 수정하지 않는다.
- Notes:
  - `PROJECT_BACKLOG.md`, `PROJECT_STATUS.md`, `ROADMAP.md`, `DECISIONS.md`가 생긴 뒤 적용한다.
