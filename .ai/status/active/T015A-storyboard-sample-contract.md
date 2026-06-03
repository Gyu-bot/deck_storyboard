# T015A Storyboard Sample Contract

- Status: In Progress
- Branch: main
- Sample input: `tmp/rca-ax-readiness-storyline-sample.md` (ignored by git)
- Sample output: `tmp/rca-ax-readiness-storyboard-sample.json` (ignored by git)
- Implemented: manual sample verification script that treats the JSON as a dummy LLM `story_structure` response and verifies schema validation, slide persistence, `storyboard_review` status, skipped second LLM call, and no image generation records.
- Frontend path: in non-production mode, `POST /api/projects/{projectId}/storyboard/generate` uses `tmp/rca-ax-readiness-storyboard-sample.json` as the dummy LLM response when the file exists.
- Verification command: `npm run test:storyboard-sample`
- Latest result: `storyboard sample ok | slides=12 | llm_dummy_calls=story_structure | status=storyboard_review | image_generation=not_started`
- Frontend dev command: `DATA_ROOT="$PWD/tmp/dev-data" npm run dev -- -p 3000`
- Frontend note: local signup requires a dummy OpenRouter key value in the form, but generation uses the sample fixture instead of a live LLM call when the fixture exists.
- Direct visual preview: `/dev/storyboard-sample` renders the ignored sample JSON in the storyboard review component in non-production mode.
- Dev accounts: non-production DB open seeds `test` / `test` and `admin` / `admin`; internally these map to `test@example.local` and `admin@example.local`.
