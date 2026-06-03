import {
  normalizeImageProviderError,
  type ImageGenerationOutput,
  type ImageGenerationProvider,
} from "@/lib/images/provider";

type FetchImpl = typeof fetch;

const GEMINI_MODEL_ALIASES: Record<string, string> = {
  "nano-banana": "gemini-2.5-flash-image",
};

function geminiEndpoint(model: string) {
  const resolvedModel = GEMINI_MODEL_ALIASES[model] ?? model;
  return `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent`;
}

function readErrorMessage(payload: unknown) {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const error = record.error;
    if (error && typeof error === "object") {
      const message = (error as Record<string, unknown>).message;
      if (typeof message === "string" && message.length > 0) return message;
    }
    const message = record.message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  return "Provider request failed.";
}

async function parseJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function findInlineImage(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const candidates = (payload as Record<string, unknown>).candidates;
  if (!Array.isArray(candidates)) return null;
  for (const candidate of candidates) {
    const parts = (candidate as { content?: { parts?: unknown[] } }).content?.parts;
    if (!Array.isArray(parts)) continue;
    for (const part of parts) {
      const record = part as Record<string, unknown>;
      const inlineData = record.inlineData ?? record.inline_data;
      if (!inlineData || typeof inlineData !== "object") continue;
      const data = (inlineData as Record<string, unknown>).data;
      const mimeType =
        (inlineData as Record<string, unknown>).mimeType ??
        (inlineData as Record<string, unknown>).mime_type;
      if (typeof data === "string") {
        return {
          data,
          contentType: mimeType === "image/jpeg" ? "image/jpeg" : "image/png",
        } as const;
      }
    }
  }
  return null;
}

export function createGeminiImageProvider(options: { fetchImpl?: FetchImpl } = {}): ImageGenerationProvider {
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    async generateImage(input): Promise<ImageGenerationOutput> {
      const response = await fetchImpl(geminiEndpoint(input.model), {
        method: "POST",
        headers: {
          "x-goog-api-key": input.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: input.prompt }],
            },
          ],
          generationConfig: {
            imageConfig: {
              aspectRatio: input.aspectRatio,
            },
          },
        }),
      });
      const payload = await parseJson(response);
      if (!response.ok) {
        throw normalizeImageProviderError("gemini", readErrorMessage(payload));
      }

      const image = findInlineImage(payload);
      if (!image) {
        throw normalizeImageProviderError("gemini", "Provider response did not include inline image data.");
      }

      return {
        bytes: Buffer.from(image.data, "base64"),
        contentType: image.contentType,
      };
    },
  };
}
