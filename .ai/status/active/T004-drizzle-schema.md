# T004 Drizzle Schema

- Status: Done
- Branch: feature/T002-T020-mvp
- Implemented: SQLite/Drizzle schema for users, API keys, projects, slides, slide image generations, image batches, and edit operations.
- Verification: `tests/unit/contracts.test.ts` covers required tables, `storyboard_generation_failed`, slide section/edit/image fields, and migration-backed test DB.
