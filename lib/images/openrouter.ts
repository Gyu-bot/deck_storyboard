import {
  normalizeImageProviderError,
  type ImageGenerationInput,
  type ImageGenerationOutput,
  type ImageGenerationProvider,
} from "@/lib/images/provider";

type FetchImpl = typeof fetch;

const OPENROUTER_IMAGE_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

const OPENROUTER_IMAGE_MODEL_ALIASES: Record<string, string> = {
  "gpt-image-2": "openai/gpt-5.4-image-2",
  "nano-banana": "google/gemini-2.5-flash-image",
};

function openRouterModel(model: string) {
  return OPENROUTER_IMAGE_MODEL_ALIASES[model] ?? model;
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

function imageUrlFromPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const choices = (payload as Record<string, unknown>).choices;
  if (!Array.isArray(choices)) return null;
  const message = (choices[0] as { message?: Record<string, unknown> } | undefined)?.message;
  const images = message?.images;
  if (!Array.isArray(images)) return null;
  const first = images[0] as Record<string, unknown> | undefined;
  const imageUrl = first?.imageUrl ?? first?.image_url;
  if (typeof imageUrl === "string") return imageUrl;
  if (imageUrl && typeof imageUrl === "object") {
    const url = (imageUrl as Record<string, unknown>).url;
    if (typeof url === "string") return url;
  }
  return null;
}

function decodeDataUrl(dataUrl: string): ImageGenerationOutput | null {
  const match = /^data:(image\/png|image\/jpeg);base64,(.+)$/i.exec(dataUrl);
  if (!match) return null;
  return {
    contentType: match[1].toLowerCase() === "image/jpeg" ? "image/jpeg" : "image/png",
    bytes: Buffer.from(match[2] ?? "", "base64"),
  };
}

export function createOpenRouterImageProvider(options: { fetchImpl?: FetchImpl } = {}): ImageGenerationProvider {
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    async generateImage(input: ImageGenerationInput): Promise<ImageGenerationOutput> {
      const response = await fetchImpl(OPENROUTER_IMAGE_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${input.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: openRouterModel(input.model),
          messages: [
            {
              role: "user",
              content: input.prompt,
            },
          ],
          modalities: ["image", "text"],
          stream: false,
          image_config: {
            aspect_ratio: input.aspectRatio,
          },
        }),
      });
      const payload = await parseJson(response);
      if (!response.ok) {
        throw normalizeImageProviderError("openrouter", readErrorMessage(payload));
      }

      const imageUrl = imageUrlFromPayload(payload);
      if (!imageUrl) {
        throw normalizeImageProviderError("openrouter", "Provider response did not include an image URL.");
      }

      const dataUrlOutput = decodeDataUrl(imageUrl);
      if (dataUrlOutput) return dataUrlOutput;

      const imageResponse = await fetchImpl(imageUrl);
      if (!imageResponse.ok) {
        throw normalizeImageProviderError("openrouter", "Generated image URL could not be downloaded.");
      }
      const contentType = imageResponse.headers.get("content-type") === "image/jpeg"
        ? "image/jpeg"
        : "image/png";
      return {
        contentType,
        bytes: Buffer.from(await imageResponse.arrayBuffer()),
      };
    },
  };
}
