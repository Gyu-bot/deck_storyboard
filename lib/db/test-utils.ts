import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrateDatabase } from "@/lib/db/migrate";
import { schema } from "@/lib/db/schema";

export type AppDatabase = ReturnType<typeof createTestDatabase>;

export function createTestDatabase() {
  const sqlite = new Database(":memory:");
  migrateDatabase(sqlite);
  return drizzle(sqlite, { schema });
}
