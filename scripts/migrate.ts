import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { getDatabasePath } from "@/lib/db/client";
import { migrateDatabase } from "@/lib/db/migrate";

const dbPath = getDatabasePath();
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const sqlite = new Database(dbPath);
migrateDatabase(sqlite);
sqlite.close();
console.log(`Migrated SQLite database at ${dbPath}`);
