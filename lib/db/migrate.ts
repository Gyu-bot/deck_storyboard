import type Database from "better-sqlite3";

export function migrateDatabase(sqlite: Database.Database) {
  sqlite.pragma("foreign_keys = ON");
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS user_api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      provider TEXT NOT NULL,
      ciphertext TEXT NOT NULL,
      iv TEXT NOT NULL,
      auth_tag TEXT NOT NULL,
      masked_key TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      UNIQUE(user_id, provider)
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      storyline TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft_input',
      target_slide_count INTEGER NOT NULL DEFAULT 8,
      slide_count_mode TEXT NOT NULL DEFAULT 'standard',
      min_slide_count INTEGER DEFAULT 9,
      max_slide_count INTEGER DEFAULT 14,
      preferred_slide_count INTEGER DEFAULT 12,
      storyline_slide_marker_count INTEGER,
      storyline_slide_marker_confidence TEXT NOT NULL DEFAULT 'none',
      improvement_suggestions_enabled INTEGER NOT NULL DEFAULT 1,
      aspect_ratio TEXT NOT NULL DEFAULT '16:9',
      default_image_model TEXT NOT NULL DEFAULT 'gpt-image-2',
      style_template TEXT NOT NULL DEFAULT 'Executive Consulting',
      custom_common_style_prompt TEXT NOT NULL DEFAULT '',
      resolved_common_prompt TEXT NOT NULL DEFAULT '',
      story_structure TEXT,
      improvement_suggestions TEXT,
      target_slide_count_rationale TEXT,
      generation_error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS slides (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      section_id TEXT NOT NULL,
      section_title TEXT NOT NULL,
      position INTEGER NOT NULL,
      title TEXT NOT NULL,
      core_message TEXT NOT NULL,
      content_points TEXT NOT NULL,
      visual_direction TEXT NOT NULL,
      image_prompt TEXT NOT NULL,
      slide_role TEXT NOT NULL,
      field_edit_state TEXT NOT NULL,
      image_generation_status TEXT NOT NULL DEFAULT 'not_generated',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS slide_image_generations (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      slide_id TEXT REFERENCES slides(id),
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      prompt_snapshot TEXT NOT NULL,
      common_prompt_snapshot TEXT NOT NULL DEFAULT '',
      slide_prompt_snapshot TEXT NOT NULL DEFAULT '',
      storage_key TEXT NOT NULL,
      image_url TEXT NOT NULL,
      status TEXT NOT NULL,
      error_message TEXT,
      created_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS image_generation_batches (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      status TEXT NOT NULL,
      total_slides INTEGER NOT NULL,
      completed_slides INTEGER NOT NULL DEFAULT 0,
      failed_slides INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS slide_edit_operations (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      slide_id TEXT REFERENCES slides(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      operation_type TEXT NOT NULL,
      metadata TEXT NOT NULL,
      before_snapshot TEXT,
      after_snapshot TEXT,
      created_at TEXT NOT NULL
    );
  `);

  const userColumns = sqlite
    .prepare("PRAGMA table_info(users)")
    .all() as Array<{ name: string }>;
  if (!userColumns.some((column) => column.name === "role")) {
    sqlite.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'member'");
  }

  const projectColumns = sqlite
    .prepare("PRAGMA table_info(projects)")
    .all() as Array<{ name: string }>;
  const hasProjectColumn = (name: string) =>
    projectColumns.some((column) => column.name === name);

  const backfillLegacySlideCounts = !hasProjectColumn("slide_count_mode");

  if (backfillLegacySlideCounts) {
    sqlite.exec("ALTER TABLE projects ADD COLUMN slide_count_mode TEXT NOT NULL DEFAULT 'standard'");
  }
  if (!hasProjectColumn("min_slide_count")) {
    sqlite.exec("ALTER TABLE projects ADD COLUMN min_slide_count INTEGER DEFAULT 9");
  }
  if (!hasProjectColumn("max_slide_count")) {
    sqlite.exec("ALTER TABLE projects ADD COLUMN max_slide_count INTEGER DEFAULT 14");
  }
  if (!hasProjectColumn("preferred_slide_count")) {
    sqlite.exec("ALTER TABLE projects ADD COLUMN preferred_slide_count INTEGER DEFAULT 12");
  }
  if (!hasProjectColumn("storyline_slide_marker_count")) {
    sqlite.exec("ALTER TABLE projects ADD COLUMN storyline_slide_marker_count INTEGER");
  }
  if (!hasProjectColumn("storyline_slide_marker_confidence")) {
    sqlite.exec(
      "ALTER TABLE projects ADD COLUMN storyline_slide_marker_confidence TEXT NOT NULL DEFAULT 'none'",
    );
  }
  if (backfillLegacySlideCounts) {
    sqlite.exec(`
      UPDATE projects
      SET
        slide_count_mode = 'custom',
        min_slide_count = target_slide_count,
        max_slide_count = target_slide_count,
        preferred_slide_count = target_slide_count
    `);
  }
}
