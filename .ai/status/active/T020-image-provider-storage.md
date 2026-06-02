# T020 Image Provider Storage

- Status: Done
- Branch: feature/T002-T020-mvp
- Implemented: `ImageGenerationProvider`, `ImageStorageProvider`, local filesystem storage under `/app/data/storage/projects/{projectId}/images/`, and guarded image lookup route.
- Verification: `tests/unit/contracts.test.ts`.
- Scope note: real OpenAI/Nano Banana provider API calls remain for T021/T022.
