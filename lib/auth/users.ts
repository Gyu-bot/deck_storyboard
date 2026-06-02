import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq, isNull, and } from "drizzle-orm";
import type { createTestDatabase } from "@/lib/db/test-utils";
import { users } from "@/lib/db/schema";

type Db = ReturnType<typeof createTestDatabase>;

function now() {
  return new Date().toISOString();
}

export async function createUser(
  db: Db,
  input: { email: string; password: string },
) {
  const email = input.email.trim().toLowerCase();
  const existing = db
    .select()
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .get();
  if (existing) throw new Error("user already exists");
  const timestamp = now();
  const row = {
    id: randomUUID(),
    email,
    passwordHash: await bcrypt.hash(input.password, 12),
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  };
  db.insert(users).values(row).run();
  return row;
}

export async function verifyUserPassword(
  db: Db,
  email: string,
  password: string,
) {
  const user = db
    .select()
    .from(users)
    .where(and(eq(users.email, email.trim().toLowerCase()), isNull(users.deletedAt)))
    .get();
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? user : null;
}
