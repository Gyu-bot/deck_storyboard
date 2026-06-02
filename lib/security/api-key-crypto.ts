import crypto from "node:crypto";

export type EncryptedApiKey = {
  ciphertext: string;
  iv: string;
  authTag: string;
  maskedKey: string;
};

function deriveKey(secret: string) {
  return crypto.createHash("sha256").update(secret).digest();
}

export function maskApiKey(apiKey: string) {
  if (apiKey.length <= 8) return "****";
  return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
}

export function encryptApiKey(apiKey: string, secret: string): EncryptedApiKey {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", deriveKey(secret), iv);
  const ciphertext = Buffer.concat([
    cipher.update(apiKey, "utf8"),
    cipher.final(),
  ]);

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    maskedKey: maskApiKey(apiKey),
  };
}

export function decryptApiKey(encrypted: EncryptedApiKey, secret: string) {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    deriveKey(secret),
    Buffer.from(encrypted.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(encrypted.authTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export function requireApiKeyEncryptionSecret() {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("API_KEY_ENCRYPTION_SECRET is required in production");
  }
  return secret ?? "development-only-api-key-secret";
}
