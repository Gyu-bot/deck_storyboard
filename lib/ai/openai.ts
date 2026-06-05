import { z } from "zod";
import {
  storyboardResponseJsonSchema,
  storyboardResponseSchema,
  type StoryboardProvider,
  type StoryboardResponse,
} from "@/lib/ai/openrouter";

type StoryboardProviderInput = Parameters<StoryboardProvider["generateStoryboard"]>[0];

type FetchImpl = (url: string, init?: RequestInit) => Promise<Response>;

type OpenAIResponsesFetcherInput = StoryboardProviderInput & {
  provider: "openai";
  apiKey: string;
};

type Fetcher = (input: OpenAIResponsesFetcherInput) => Promise<unknown>;

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
export const DEFAULT_OPENAI_STORYBOARD_MODEL = "gpt-4.1";

const openAITextOutputSchema = z.object({
  output_text: z.string().optional(),
  output: z
    .array(
      z
        .object({
          content: z
            .array(
              z
                .object({
                  type: z.string().optional(),
                  text: z.string().optional(),
                })
                .passthrough(),
            )
            .optional(),
        })
        .passthrough(),
    )
    .optional(),
}).passthrough();

function formatSlideCountPolicy(policy: StoryboardProviderInput["slideCountPolicy"]) {
  return JSON.stringify(
    {
      mode: policy.mode === "custom" ? "custom_range" : policy.mode,
      userSelectedRange:
        policy.mode === "auto"
          ? null
          : {
              minSlideCount: policy.minSlideCount,
              maxSlideCount: policy.maxSlideCount,
            },
      preferredSlideCount: policy.preferredSlideCount,
      heuristicMarker: {
        estimatedCount: policy.storylineSlideMarkerCount,
        confidence: policy.storylineSlideMarkerConfidence,
      },
      existingRationale: policy.targetSlideCountRationale,
    },
    null,
    2,
  );
}

function buildStoryboardPrompt(input: OpenAIResponsesFetcherInput) {
  const previousStructure = input.previousStructure
    ? `\nPrevious story structure JSON:\n${JSON.stringify(input.previousStructure, null, 2)}`
    : "";
  const taskGuidance =
    input.task === "story_structure"
      ? [
          "Normalize the user's free-form storyline into a deck storyboard response.",
          "Include slides when you can produce a complete, high-quality slide breakdown from the input.",
          "If the source material is too ambiguous for slide-level work, omit slides and return strong sections instead.",
        ]
      : [
          "Create the final slide breakdown from the previous story structure.",
          "Return slides with concrete titles, executive core messages, content points, visual directions, image prompts, and slide roles.",
          "Keep sectionId and sectionTitle aligned to the previous structure.",
        ];

  return [
    `task: ${input.task}`,
    "slideCountPolicy:",
    formatSlideCountPolicy(input.slideCountPolicy),
    `includeSuggestions: ${input.includeSuggestions}`,
    "",
    ...taskGuidance,
    "",
    "Slide count policy rules:",
    "- For auto mode, choose the appropriate slide count from storyline complexity, section count, page-like markers, and content density.",
    "- For brief, standard, detailed, and custom_range modes, generate within the userSelectedRange whenever the storyline can support it.",
    "- If high-confidence explicit slide/page markers conflict with the selected range, respect the input structure where useful and explain any compression or expansion in targetSlideCountRationale.",
    "- If custom_range output must fall outside min/max, keep the storyboard coherent and store the reason in targetSlideCountRationale.",
    "",
    "Return only a JSON object matching the provided response schema.",
    "Use the same language as the user's storyline unless the storyline asks for a different language.",
    "The deck should read like an executive consulting storyboard.",
    "",
    "User storyline:",
    input.storyline,
    previousStructure,
  ].join("\n");
}

function parseJsonText(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new Error(
      `OpenAI response text was not valid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

function parseOpenAIResponse(raw: unknown) {
  if (raw && typeof raw === "object" && "documentPurpose" in raw) {
    return raw;
  }

  const parsed = openAITextOutputSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("OpenAI response missing structured output text");
  }

  if (parsed.data.output_text) {
    return parseJsonText(parsed.data.output_text);
  }

  const text = parsed.data.output
    ?.flatMap((item) => item.content ?? [])
    .find((content) => content.type === "output_text" && content.text)?.text;
  if (!text) {
    throw new Error("OpenAI response missing output_text");
  }
  return parseJsonText(text);
}

export function createOpenAIResponsesFetcher({
  model = process.env.OPENAI_STORYBOARD_MODEL ?? DEFAULT_OPENAI_STORYBOARD_MODEL,
  fetchImpl = fetch,
}: {
  model?: string;
  fetchImpl?: FetchImpl;
} = {}): Fetcher {
  return async (input) => {
    const response = await fetchImpl(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content:
              "You are a senior presentation strategist. Produce precise structured JSON for storyboard generation.",
          },
          {
            role: "user",
            content: buildStoryboardPrompt(input),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "deck_storyboard_response",
            strict: true,
            schema: storyboardResponseJsonSchema,
          },
        },
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `OpenAI ${input.task} request failed (${response.status} ${
          response.statusText
        }): ${body.slice(0, 500)}`,
      );
    }

    return parseOpenAIResponse(await response.json());
  };
}

export function createOpenAIStoryboardProvider({
  apiKey,
  fetcher = createOpenAIResponsesFetcher(),
  model = process.env.OPENAI_STORYBOARD_MODEL ?? DEFAULT_OPENAI_STORYBOARD_MODEL,
}: {
  apiKey?: string | null;
  fetcher?: Fetcher;
  model?: string;
}): StoryboardProvider {
  async function request(input: StoryboardProviderInput) {
    if (!apiKey) {
      throw new Error("OpenAI provider key is required");
    }
    return fetcher({
      provider: "openai",
      apiKey,
      ...input,
    });
  }

  return {
    debugMetadata: {
      provider: "openai",
      model,
    },
    async generateStoryboard(input): Promise<StoryboardResponse> {
      let lastError: unknown;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const raw = await request(input);
        const parsed = storyboardResponseSchema.safeParse(raw);
        if (parsed.success) {
          if (!input.includeSuggestions) {
            return { ...parsed.data, improvementSuggestions: undefined };
          }
          return parsed.data;
        }
        lastError = parsed.error;
      }
      throw new Error(
        `OpenAI ${input.task} validation failed after retry: ${String(lastError)}`,
      );
    },
  };
}
