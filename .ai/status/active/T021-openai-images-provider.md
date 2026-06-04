# T021 OpenAI Images Provider

- Status: Needs Review
- Branch: feature/T021-T022-image-providers
- Implemented: OpenAI image provider adapter, OpenRouter-first image routing for `gpt-image-2`, direct OpenAI fallback when OpenRouter fails or is unavailable, account-level provider key resolution, standard provider error normalization, local storage orchestration, slide image generation record creation, and per-slide mockup UI wiring.
- Acceptance coverage:
  - `gpt-image-2` resolves to the `openai` account-level user/provider API key.
  - Missing user key returns `provider_key_missing` and does not use a server fallback.
  - `16:9` maps to OpenAI landscape image size and the requested ratio is included in the prompt sent to the provider.
  - Provider `b64_json` or generated image URL output can be converted to bytes for local storage.
  - Failed provider responses are normalized through `ImageProviderError`.
  - OpenRouter is attempted first and direct OpenAI is used as the fallback provider for `gpt-image-2`.
  - The storyboard workspace exposes both full-deck mockup generation and single-slide mockup generation controls.
- Verification:
  - `npm run test:unit -- tests/unit/image-providers.test.ts`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test:unit`
  - `npm run build`
  - `npm run test:storyboard-sample`
  - Browser verification on `http://localhost:3002/projects/ea8468c7-6640-44ea-8b39-0ce4133e45ef`: full-deck button text, per-slide mockup buttons, generated status, and rendered mockup image in the detail panel.
  - OpenRouter real API smoke on copied DB: generated and persisted exactly one slide for the `test` account with provider `openrouter`.
- Notes:
  - The implementation keeps SDK dependencies out of the repo and uses injected `fetchImpl` for deterministic provider tests.
  - OpenAI docs currently document GPT Image generation through `/v1/images/generations` with size controls; `gpt-image-2` is passed through as the configured project model.

## Planning Handoff

- Reflect in the final implementation plan during the next planning/docs cleanup session: improve the slide mockup result review screen so generated mockups can be clicked to open a larger preview.
- Add multi-result review to the implementation plan: when multiple mockups are generated for a slide, show them in a carousel-style viewer so users can inspect each candidate and choose the final version.
- Add final-selection flexibility to the implementation plan: support selecting more than one final mockup for a single slide when the workflow requires multiple accepted variants.
