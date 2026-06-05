const DEFAULT_MAX_STRING_LENGTH = 1_000;
const DEFAULT_MAX_SERIALIZED_LENGTH = 8_000;

const SECRET_KEY_PATTERNS = [
  "authorization",
  "apiKey",
  "api_key",
  "x-goog-api-key",
  "ciphertext",
  "authTag",
  "auth_tag",
  "password",
];

const EXACT_SECRET_KEYS = ["secret", "token", "accessToken", "refreshToken"];

const BINARY_KEY_PATTERNS = [
  "bytes",
  "b64_json",
  "data",
  "inlineData",
  "imageBytes",
];

const SENSITIVE_PREVIEW_KEYS = [
  "storyline",
  "prompt",
  "previousStructure",
  "imagePrompt",
  "slidePrompt",
];

type RedactionMetadata = {
  truncated: boolean;
  truncatedFields: string[];
  redactedFields: string[];
  omittedBinaryFields: string[];
  maxStringLength: number;
  maxSerializedLength: number;
  serializedLength: number;
};

export type RedactedSnapshot = {
  value: unknown;
  metadata: RedactionMetadata;
};

function matchesPattern(key: string, patterns: string[]) {
  const normalized = key.toLowerCase();
  return patterns.some((pattern) => normalized.includes(pattern.toLowerCase()));
}

function matchesExactPattern(key: string, patterns: string[]) {
  const normalized = key.toLowerCase();
  return patterns.some((pattern) => normalized === pattern.toLowerCase());
}

function isSecretKey(key: string) {
  return (
    matchesPattern(key, SECRET_KEY_PATTERNS) ||
    matchesExactPattern(key, EXACT_SECRET_KEYS)
  );
}

function isBinaryValue(value: unknown) {
  return Buffer.isBuffer(value) || value instanceof Uint8Array || value instanceof ArrayBuffer;
}

function previewSensitiveString(value: string, maxStringLength: number) {
  return {
    preview:
      value.length > maxStringLength
        ? `${value.slice(0, maxStringLength)}...[truncated ${value.length - maxStringLength} chars]`
        : value,
    length: value.length,
    truncated: value.length > maxStringLength,
  };
}

function omitStructuredPayload() {
  return {
    summary: "[structured payload preview omitted]",
  };
}

function redactValue(
  value: unknown,
  path: string,
  metadata: RedactionMetadata,
  maxStringLength: number,
): unknown {
  if (isBinaryValue(value)) {
    metadata.omittedBinaryFields.push(path);
    return "[binary omitted]";
  }

  if (typeof value === "string") {
    if (value.startsWith("data:image/") || value.length > maxStringLength) {
      metadata.truncated = true;
      metadata.truncatedFields.push(path);
      return `${value.slice(0, maxStringLength)}...[truncated ${value.length - maxStringLength} chars]`;
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) =>
      redactValue(item, `${path}[${index}]`, metadata, maxStringLength),
    );
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return Object.fromEntries(
      entries.map(([key, child]) => {
        const childPath = path ? `${path}.${key}` : key;
        if (isSecretKey(key)) {
          metadata.redactedFields.push(childPath);
          return [key, "[redacted]"];
        }
        if (matchesExactPattern(key, BINARY_KEY_PATTERNS)) {
          metadata.omittedBinaryFields.push(childPath);
          return [key, "[binary omitted]"];
        }
        if (matchesExactPattern(key, SENSITIVE_PREVIEW_KEYS)) {
          if (typeof child === "string") {
            const preview = previewSensitiveString(child, maxStringLength);
            if (preview.truncated) {
              metadata.truncated = true;
              metadata.truncatedFields.push(childPath);
            }
            return [key, preview];
          }
          metadata.truncated = true;
          metadata.truncatedFields.push(childPath);
          return [key, omitStructuredPayload()];
        }
        return [key, redactValue(child, childPath, metadata, maxStringLength)];
      }),
    );
  }

  return value;
}

function limitSerializedSnapshot(
  value: unknown,
  metadata: RedactionMetadata,
  maxSerializedLength: number,
) {
  const serialized = JSON.stringify(value);
  metadata.serializedLength = serialized.length;
  if (serialized.length <= maxSerializedLength) return value;

  metadata.truncated = true;
  metadata.truncatedFields.push("$");
  metadata.serializedLength = maxSerializedLength;
  return {
    preview: serialized.slice(0, maxSerializedLength),
    truncated: true,
    originalLength: serialized.length,
  };
}

export function buildRedactedSnapshot(
  value: unknown,
  options: {
    maxStringLength?: number;
    maxSerializedLength?: number;
  } = {},
): RedactedSnapshot {
  const maxStringLength = options.maxStringLength ?? DEFAULT_MAX_STRING_LENGTH;
  const maxSerializedLength =
    options.maxSerializedLength ?? DEFAULT_MAX_SERIALIZED_LENGTH;
  const metadata: RedactionMetadata = {
    truncated: false,
    truncatedFields: [],
    redactedFields: [],
    omittedBinaryFields: [],
    maxStringLength,
    maxSerializedLength,
    serializedLength: 0,
  };
  const redacted = redactValue(value, "", metadata, maxStringLength);
  const limited = limitSerializedSnapshot(redacted, metadata, maxSerializedLength);
  return { value: limited, metadata };
}
