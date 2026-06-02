import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrateDatabase } from "@/lib/db/migrate";
import { schema } from "@/lib/db/schema";

let singleton: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDataRoot() {
  return process.env.DATA_ROOT ?? "/app/data";
}

export function getDatabasePath() {
  return process.env.DATABASE_PATH ?? path.join(getDataRoot(), "deck-storyboard.db");
}

export function getDatabase() {
  if (singleton) return singleton;
  const dbPath = getDatabasePath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const sqlite = new Database(dbPath);
  migrateDatabase(sqlite);
  singleton = drizzle(sqlite, { schema });
  return singleton;
}
