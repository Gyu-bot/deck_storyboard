import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq, isNull, and } from "drizzle-orm";
import type { createTestDatabase } from "@/lib/db/test-utils";
import { users, type UserRole } from "@/lib/db/schema";

type Db = ReturnType<typeof createTestDatabase>;

const developmentUsers = [
  { email: "test@example.local", password: "test", role: "member" },
  { email: "admin@example.local", password: "admin", role: "admin" },
] as const;

function now() {
  return new Date().toISOString();
}

function activeUserCondition(userId?: string) {
  return userId
    ? and(
        eq(users.id, userId),
        isNull(users.disabledAt),
        isNull(users.deletedAt),
      )
    : and(isNull(users.disabledAt), isNull(users.deletedAt));
}

function visibleUserCondition(userId?: string) {
  return userId
    ? and(eq(users.id, userId), isNull(users.deletedAt))
    : isNull(users.deletedAt);
}

export function normalizeLoginIdentifier(identifier: string) {
  const value = identifier.trim().toLowerCase();
  if (value === "test") return "test@example.local";
  if (value === "admin") return "admin@example.local";
  return value;
}

export async function createUser(
  db: Db,
  input: { email: string; password: string; role?: UserRole },
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
    role: input.role ?? "member",
    createdAt: timestamp,
    updatedAt: timestamp,
    disabledAt: null,
    deletedAt: null,
  };
  db.insert(users).values(row).run();
  return row;
}

export function getUserById(db: Db, userId: string) {
  return (
    db
      .select()
      .from(users)
      .where(activeUserCondition(userId))
      .get() ?? null
  );
}

export function getUserByIdIncludingInactive(db: Db, userId: string) {
  return (
    db.select().from(users).where(visibleUserCondition(userId)).get() ?? null
  );
}

function getUserByIdIncludingDeleted(db: Db, userId: string) {
  return db.select().from(users).where(eq(users.id, userId)).get() ?? null;
}

export function listUsers(
  db: Db,
  options: { query?: string; includeInactive?: boolean } = {},
) {
  const query = options.query?.trim().toLowerCase() ?? "";
  const rows = db
    .select()
    .from(users)
    .where(
      options.includeInactive ? visibleUserCondition() : activeUserCondition(),
    )
    .all()
    .sort(
      (a, b) =>
        Number(Boolean(a.disabledAt)) - Number(Boolean(b.disabledAt)) ||
        a.email.localeCompare(b.email),
    );
  if (!query) return rows;
  return rows.filter((user) => user.email.toLowerCase().includes(query));
}

export function deactivateUser(db: Db, userId: string) {
  const user = getUserById(db, userId);
  if (!user) return null;
  const timestamp = now();
  db.update(users)
    .set({ disabledAt: timestamp, updatedAt: timestamp })
    .where(eq(users.id, userId))
    .run();
  return getUserByIdIncludingInactive(db, userId);
}

export function grantAdminRole(db: Db, userId: string) {
  const user = getUserById(db, userId);
  if (!user) return null;
  const timestamp = now();
  db.update(users)
    .set({ role: "admin", updatedAt: timestamp })
    .where(eq(users.id, userId))
    .run();
  return getUserById(db, userId);
}

export function deleteUser(db: Db, userId: string) {
  const user = getUserByIdIncludingInactive(db, userId);
  if (!user) return null;
  const timestamp = now();
  db.update(users)
    .set({ deletedAt: timestamp, updatedAt: timestamp })
    .where(eq(users.id, userId))
    .run();
  return getUserByIdIncludingDeleted(db, userId);
}

export async function verifyUserPassword(
  db: Db,
  email: string,
  password: string,
) {
  const normalizedEmail = normalizeLoginIdentifier(email);
  const user = db
    .select()
    .from(users)
    .where(
      and(
        eq(users.email, normalizedEmail),
        isNull(users.disabledAt),
        isNull(users.deletedAt),
      ),
    )
    .get();
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? user : null;
}

export function seedDevelopmentUsers(db: Db) {
  const seeded = [];
  for (const input of developmentUsers) {
    const existing = db
      .select()
      .from(users)
      .where(and(eq(users.email, input.email), isNull(users.deletedAt)))
      .get();
    if (existing) {
      if (existing.role !== input.role) {
        const timestamp = now();
        db.update(users)
          .set({ role: input.role, updatedAt: timestamp })
          .where(eq(users.id, existing.id))
          .run();
        seeded.push({ ...existing, role: input.role, updatedAt: timestamp });
        continue;
      }
      seeded.push(existing);
      continue;
    }
    const timestamp = now();
    const row = {
      id: randomUUID(),
      email: input.email,
      passwordHash: bcrypt.hashSync(input.password, 12),
      role: input.role,
      createdAt: timestamp,
      updatedAt: timestamp,
      disabledAt: null,
      deletedAt: null,
    };
    db.insert(users).values(row).run();
    seeded.push(row);
  }
  return seeded;
}
