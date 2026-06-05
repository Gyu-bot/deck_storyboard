# T035A Storyboard LLM direct-provider fallback bugfix

## Scope

- Task ID: T035A
- Issue: #57
- Branch: `fix/T035A-T023D-provider-fallback`
- Status: In Review

## 구현 요약

- Storyboard generation route의 provider selection을 `OpenRouter -> OpenAI` 순서로 확장했다.
- 기존 OpenRouter key가 있으면 기존 OpenRouter storyboard path를 계속 우선 사용한다.
- OpenRouter key가 없고 OpenAI account-level key가 있으면 direct OpenAI Responses adapter로 `story_structure` / `slide_breakdown` 생성을 진행한다.
- Storyboard provider 타입을 `openrouter`/`openai` 공통 interface로 일반화해서 `lib/storyboard/generation.ts`의 schema validation, project status update, provider debug logging 경계를 재사용한다.
- Direct OpenAI adapter는 기존 `storyboardResponseJsonSchema`와 `storyboardResponseSchema`를 공유해 provider output을 수락하기 전에 같은 schema contract로 검증한다.
- 지원되는 storyboard key가 전혀 없으면 사용자 메시지는 `OpenRouter 또는 OpenAI API key가 없습니다...`로 표시된다.
- Sample storyboard test mode는 기존 fixture-only OpenRouter dummy provider path를 유지한다.

## Provider selection policy

- Initial default order: `openrouter` -> `openai`.
- Anthropic/Gemini direct LLM fallback은 이번 bugfix 범위에 포함하지 않았다.
- Admin-configurable routing, fallback toggle, provider priority UI는 T039 범위로 남긴다.

## Verification

- RED 확인:
  - `npm run test:unit -- tests/unit/storyboard-generation-route.test.ts`
  - 실패 내용: route가 `openrouter` key만 조회하고 OpenAI key를 보지 않아 OpenAI-only member가 `OpenRouter API key가 없습니다...` 실패 상태로 리다이렉트됨.
- GREEN 확인:
  - `npm run test:unit`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npm run test:storyboard-sample`
- Equivalent real-use check:
  - `tests/unit/storyboard-generation-route.test.ts`에서 OpenRouter missing + OpenAI present 조합이 project generation failure로 가지 않고 `analyzeStoryStructure`에 `debugMetadata.provider = "openai"` provider를 전달함을 검증했다.
  - OpenRouter key와 OpenAI key가 모두 있는 경우 OpenRouter provider를 우선 선택하고 OpenAI key를 불필요하게 조회하지 않음을 검증했다.
  - `tests/unit/contracts.test.ts`에서 OpenAI Responses request shape, JSON schema format, `output_text` parsing, invalid direct-provider schema retry를 검증했다.
  - Live OpenAI provider 호출은 실행하지 않았다. 이번 검증은 mocked fetcher와 route-level provider selection에 한정했다.
- Final PR validation:
  - `npm run test:unit`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npm run test:storyboard-sample`

## Known gaps / handoff

- Direct OpenAI live smoke는 사용자가 실제 OpenAI key를 배정한 뒤 한 프로젝트/한 호출로 좁게 실행하는 것이 안전하다.
- OpenAI usage/request-id metadata는 현재 debug log interface가 raw provider HTTP metadata를 받지 않으므로 별도 adapter instrumentation 작업이 필요할 수 있다.
