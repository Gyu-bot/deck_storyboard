# T023D OpenRouter-first image fallback error masking bugfix

## Scope

- Task ID: T023D
- Issue: #52
- Branch: `fix/T035A-T023D-provider-fallback`
- Status: In Review

## 구현 요약

- Image generation orchestration의 provider order는 기존대로 `openrouter -> direct model provider`를 유지한다.
- 아무 provider key도 없어서 실제 provider call이 한 번도 실행되지 않은 경우, missing-key error가 단일 provider가 아니라 사용 가능한 key option 목록을 표시하도록 변경했다.
  - `gpt-image-2`: `OpenRouter 또는 OpenAI API key가 없습니다...`
  - `nano-banana`: `OpenRouter 또는 Gemini API key가 없습니다...`
- OpenRouter가 실제 호출된 뒤 실패하고 direct provider key가 없는 경우, 최종 failed history와 thrown error는 OpenRouter provider failure를 유지한다.
- Image generation route는 orchestrator가 만든 multi-provider missing-key message를 단일 provider message로 덮어쓰지 않는다.
- Live dev 검증 중 발견된 키 복호화 실패 경로를 추가로 수정했다.
  - 슬라이드를 `generating`으로 표시한 뒤 provider key 복호화가 실패해도 failed `slide_image_generations` record를 남기고 `slides.image_generation_status = failed`로 정리한다.
- Live dev 검증 중 발견된 OpenRouter 이미지 비율 mismatch를 추가로 수정했다.
  - `gpt-image-2`의 OpenRouter alias를 `openai/gpt-5.4-image-2`로 갱신했다.
  - OpenRouter가 요청 비율과 다른 PNG/JPEG를 반환하면 저장 전에 provider failure로 기록하고 다음 provider fallback을 시도한다.

## Error precedence policy

- Provider key lookup만 실패한 skipped attempts는 이전 실제 provider call failure를 덮어쓰지 않는다.
- 실제 provider call이 없었던 경우에는 provider order 전체를 기준으로 missing-key options를 사용자에게 보여준다.
- Failed `slide_image_generations` record는 최종 user-facing 원인을 가장 잘 설명하는 provider/error로 저장한다.
- Provider call 이전의 예외도 provider별 failed debug log와 failed generation history로 남긴다.
- OpenRouter가 이미지 bytes를 반환했더라도 실제 이미지 비율이 요청 비율과 다르면 successful history로 저장하지 않는다.
- Direct OpenAI image provider의 `1536x1024` landscape output은 기존 정상 경로로 유지한다.

## Verification

- RED 확인:
  - `npm run test:unit -- tests/unit/image-providers.test.ts tests/unit/image-generation-route.test.ts`
  - 실패 내용: key가 모두 없을 때 `openrouter API key is required...` 또는 route-level `OpenRouter API key가 없습니다...`만 표시되어 usable key options가 보이지 않음.
- GREEN 확인:
  - `npm run test:unit`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npm run test:storyboard-sample`
- Live follow-up RED/GREEN:
  - `npm run test:unit -- tests/unit/image-providers.test.ts`
  - RED: 잘못된 `API_KEY_ENCRYPTION_SECRET`로 provider key 복호화가 실패하면 raw crypto error가 그대로 throw되고 slide status가 `generating`에 남는 경로를 재현했다.
  - GREEN: 같은 경로가 `provider_error`로 정규화되고, failed history와 slide `failed` 상태가 기록되는 것을 검증했다.
- Live image crop follow-up RED/GREEN:
  - `npm run test:unit -- tests/unit/image-providers.test.ts`
  - RED: `gpt-image-2`가 OpenRouter에서 `openai/gpt-5-image`로 매핑되고, OpenRouter가 1024x1024 이미지를 반환해도 성공 저장되는 경로를 재현했다.
  - GREEN: `gpt-image-2`는 `openai/gpt-5.4-image-2`로 요청되고, 16:9 요청에서 1024x1024 결과는 저장 전 실패 처리되어 direct provider fallback으로 넘어가는 것을 검증했다.
  - Scope correction: direct OpenAI의 1536x1024 landscape output은 OpenRouter 비율 검증에 걸리지 않고 성공 저장되는 것을 검증했다.
- Equivalent real-use check:
  - `tests/unit/image-providers.test.ts`에서 OpenRouter-only member가 direct OpenAI key 없이도 OpenRouter 이미지 생성을 성공시키는 것을 검증했다.
  - OpenRouter key가 없고 direct OpenAI key만 있는 경우 direct OpenAI image provider로 fallback되는 것을 검증했다.
  - `tests/unit/image-providers.test.ts`에서 OpenRouter-only member의 OpenRouter provider failure가 direct OpenAI missing-key로 masking되지 않고 failed history에 `provider = openrouter`, `provider_error`로 남는 것을 검증했다.
  - `tests/unit/image-generation-route.test.ts`에서 multi-provider missing-key message가 API JSON 응답까지 보존되는 것을 검증했다.
  - Live dev smoke 중 `openai@test.com`의 OpenAI image generation 재시도가 200으로 성공했다.
  - Live dev smoke 중 `test@example.local`의 OpenRouter image generation 재시도가 200으로 성공했다.
- Local dev secret follow-up:
  - 기존 로컬 DB를 유지할 때 `API_KEY_ENCRYPTION_SECRET=development-only-api-key-secret`을 고정해야 한다는 규칙을 `AGENTS.md`, `README.md`, `README_KO.md`에 기록했다.
- Final PR validation:
  - `npm run test:unit`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npm run test:storyboard-sample`

## Known gaps / handoff

- OpenRouter-only live image smoke는 실제 key/rate-limit 상황에 맞춰 한 슬라이드로 좁게 수행하는 것이 안전하다.
- Batch image generation의 progress UX와 batch-level error aggregation은 T024/T027A3 범위로 남긴다.
