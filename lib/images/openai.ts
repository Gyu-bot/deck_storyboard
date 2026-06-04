import {
  normalizeImageProviderError,
  type ImageGenerationInput,
  type ImageGenerationOutput,
  type ImageGenerationProvider,
} from "@/lib/images/provider";

export { normalizeImageProviderError } from "@/lib/images/provider";

type FetchImpl = typeof fetch;

const OPENAI_IMAGES_ENDPOINT = "https://api.openai.com/v1/images/generations";

function openAIImageSize(aspectRatio: ImageGenerationInput["aspectRatio"]) {
  return aspectRatio === "16:9" ? "1536x1024" : "auto";
}

function promptWithAspectRatio(input: ImageGenerationInput) {
  return [
    `Aspect ratio: ${input.aspectRatio}.`,
    "Create a presentation slide mockup image suitable for direct use in a deck.",
    input.prompt,
  ].join("\n");
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

export function createOpenAIImagesProvider(options: { fetchImpl?: FetchImpl } = {}): ImageGenerationProvider {
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    async generateImage(input): Promise<ImageGenerationOutput> {
      const response = await fetchImpl(OPENAI_IMAGES_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${input.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: input.model,
          prompt: promptWithAspectRatio(input),
          size: openAIImageSize(input.aspectRatio),
          n: 1,
        }),
      });
      const payload = await parseJson(response);
      if (!response.ok) {
        throw normalizeImageProviderError("openai", readErrorMessage(payload));
      }

      const firstImage = Array.isArray(payload?.data) ? payload.data[0] : null;
      if (firstImage?.b64_json && typeof firstImage.b64_json === "string") {
        return {
          bytes: Buffer.from(firstImage.b64_json, "base64"),
          contentType: "image/png",
        };
      }

      if (firstImage?.url && typeof firstImage.url === "string") {
        const imageResponse = await fetchImpl(firstImage.url);
        if (!imageResponse.ok) {
          throw normalizeImageProviderError("openai", "Generated image URL could not be downloaded.");
        }
        const bytes = Buffer.from(await imageResponse.arrayBuffer());
        const contentType = imageResponse.headers.get("content-type") === "image/jpeg"
          ? "image/jpeg"
          : "image/png";
        return { bytes, contentType };
      }

      throw normalizeImageProviderError("openai", "Provider response did not include image bytes or URL.");
    },
  };
}
