import { randomUUID } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import type { createTestDatabase } from "@/lib/db/test-utils";
import { providerKeyValues, userApiKeys, type ProviderKey } from "@/lib/db/schema";
import {
  decryptApiKey,
  encryptApiKey,
  requireApiKeyEncryptionSecret,
} from "@/lib/security/api-key-crypto";

type Db = ReturnType<typeof createTestDatabase>;

function now() {
  return new Date().toISOString();
}

export function saveUserApiKey(
  db: Db,
  userId: string,
  provider: ProviderKey,
  apiKey: string,
  options: { encryptionSecret?: string } = {},
) {
  const secret = options.encryptionSecret ?? requireApiKeyEncryptionSecret();
  const encrypted = encryptApiKey(apiKey, secret);
  const timestamp = now();
  const existing = db
    .select()
    .from(userApiKeys)
    .where(and(eq(userApiKeys.userId, userId), eq(userApiKeys.provider, provider)))
    .get();

  if (existing) {
    db.update(userApiKeys)
      .set({ ...encrypted, updatedAt: timestamp, deletedAt: null })
      .where(eq(userApiKeys.id, existing.id))
      .run();
    return { ...existing, ...encrypted, updatedAt: timestamp, deletedAt: null };
  }

  const row = {
    id: randomUUID(),
    userId,
    provider,
    ...encrypted,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  };
  db.insert(userApiKeys).values(row).run();
  return row;
}

export function deleteUserApiKey(db: Db, userId: string, provider: ProviderKey) {
  db.update(userApiKeys)
    .set({ deletedAt: now(), updatedAt: now() })
    .where(and(eq(userApiKeys.userId, userId), eq(userApiKeys.provider, provider)))
    .run();
}

export function getUserApiKeyPresence(db: Db, userId: string) {
  const rows = db
    .select()
    .from(userApiKeys)
    .where(and(eq(userApiKeys.userId, userId), isNull(userApiKeys.deletedAt)))
    .all();
  return Object.fromEntries(
    providerKeyValues.map((provider) => [
      provider,
      rows.find((row) => row.provider === provider)?.maskedKey ?? null,
    ]),
  ) as Record<ProviderKey, string | null>;
}

export function getDecryptedUserApiKey(
  db: Db,
  userId: string,
  provider: ProviderKey,
  options: { encryptionSecret?: string } = {},
) {
  const row = db
    .select()
    .from(userApiKeys)
    .where(
      and(
        eq(userApiKeys.userId, userId),
        eq(userApiKeys.provider, provider),
        isNull(userApiKeys.deletedAt),
      ),
    )
    .get();
  if (!row) return null;
  return decryptApiKey(
    {
      ciphertext: row.ciphertext,
      iv: row.iv,
      authTag: row.authTag,
      maskedKey: row.maskedKey,
    },
    options.encryptionSecret ?? requireApiKeyEncryptionSecret(),
  );
}
