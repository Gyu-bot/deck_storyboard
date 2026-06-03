import { z } from "zod";

export const storySectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  role: z.string().min(1),
  coreMessage: z.string().min(1),
  sourceSummary: z.string().min(1),
  suggestedSlideCount: z.number().int().positive(),
});

export const storyImprovementSuggestionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  rationale: z.string().min(1),
});

export const slideBreakdownSchema = z.object({
  sectionId: z.string().min(1),
  sectionTitle: z.string().min(1),
  title: z.string().min(1),
  coreMessage: z.string().min(1),
  contentPoints: z.array(z.string().min(1)).min(1),
  visualDirection: z.string().min(1),
  imagePrompt: z.string().min(1),
  slideRole: z.string().min(1),
});

export type StorySection = z.infer<typeof storySectionSchema>;
export type StoryImprovementSuggestion = z.infer<
  typeof storyImprovementSuggestionSchema
>;
export type SlideBreakdown = z.infer<typeof slideBreakdownSchema>;

export type StoryboardResponse = {
  documentPurpose: string;
  overallThesis: string;
  sections: StorySection[];
  improvementSuggestions?: StoryImprovementSuggestion[];
  targetSlideCountRationale?: string;
  slides?: SlideBreakdown[];
};

export const storyboardResponseSchema = z.object({
  documentPurpose: z.string().min(1),
  overallThesis: z.string().min(1),
  sections: z.array(storySectionSchema).min(1),
  improvementSuggestions: z.array(storyImprovementSuggestionSchema).nullable().optional(),
  targetSlideCountRationale: z.string().nullable().optional(),
  slides: z.array(slideBreakdownSchema).nullable().optional(),
}).transform((response): StoryboardResponse => {
  const normalized: StoryboardResponse = {
    documentPurpose: response.documentPurpose,
    overallThesis: response.overallThesis,
    sections: response.sections,
  };

  if (response.improvementSuggestions) {
    normalized.improvementSuggestions = response.improvementSuggestions;
  }
  if (response.targetSlideCountRationale) {
    normalized.targetSlideCountRationale = response.targetSlideCountRationale;
  }
  if (response.slides) {
    normalized.slides = response.slides;
  }

  return normalized;
});

export type OpenRouterTask = "story_structure" | "slide_breakdown";

export type OpenRouterProvider = {
  generateStoryboard(input: {
    task: OpenRouterTask;
    storyline: string;
    targetSlideCount: number;
    includeSuggestions: boolean;
    previousStructure?: StoryboardResponse;
  }): Promise<StoryboardResponse>;
};

export type OpenRouterFetcherInput = {
  provider: "openrouter";
  apiKey: string;
  task: OpenRouterTask;
  storyline: string;
  targetSlideCount: number;
  includeSuggestions: boolean;
  previousStructure?: StoryboardResponse;
};

type Fetcher = (input: OpenRouterFetcherInput) => Promise<unknown>;

type FetchImpl = (url: string, init?: RequestInit) => Promise<Response>;

const OPENROUTER_CHAT_COMPLETIONS_URL =
  "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_OPENROUTER_STORYBOARD_MODEL = "openai/gpt-4o";

const storySectionJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "title",
    "role",
    "coreMessage",
    "sourceSummary",
    "suggestedSlideCount",
  ],
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    role: { type: "string" },
    coreMessage: { type: "string" },
    sourceSummary: { type: "string" },
    suggestedSlideCount: { type: "integer", minimum: 1 },
  },
} as const;

const improvementSuggestionJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "title", "rationale"],
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    rationale: { type: "string" },
  },
} as const;

const slideBreakdownJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "sectionId",
    "sectionTitle",
    "title",
    "coreMessage",
    "contentPoints",
    "visualDirection",
    "imagePrompt",
    "slideRole",
  ],
  properties: {
    sectionId: { type: "string" },
    sectionTitle: { type: "string" },
    title: { type: "string" },
    coreMessage: { type: "string" },
    contentPoints: {
      type: "array",
      minItems: 1,
      items: { type: "string" },
    },
    visualDirection: { type: "string" },
    imagePrompt: { type: "string" },
    slideRole: { type: "string" },
  },
} as const;

export const storyboardResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "documentPurpose",
    "overallThesis",
    "sections",
    "improvementSuggestions",
    "targetSlideCountRationale",
    "slides",
  ],
  properties: {
    documentPurpose: { type: "string" },
    overallThesis: { type: "string" },
    sections: {
      type: "array",
      minItems: 1,
      items: storySectionJsonSchema,
    },
    improvementSuggestions: {
      anyOf: [
        {
          type: "array",
          items: improvementSuggestionJsonSchema,
        },
        { type: "null" },
      ],
    },
    targetSlideCountRationale: {
      anyOf: [{ type: "string" }, { type: "null" }],
    },
    slides: {
      anyOf: [
        {
          type: "array",
          items: slideBreakdownJsonSchema,
        },
        { type: "null" },
      ],
    },
  },
} as const;

const openRouterResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.union([z.string(), z.record(z.string(), z.unknown())]),
        }),
      }),
    )
    .min(1),
});

function buildStoryboardPrompt(input: OpenRouterFetcherInput) {
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
    `targetSlideCount: ${input.targetSlideCount}`,
    `includeSuggestions: ${input.includeSuggestions}`,
    "",
    ...taskGuidance,
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

function parseOpenRouterContent(raw: unknown) {
  const parsedResponse = openRouterResponseSchema.safeParse(raw);
  if (!parsedResponse.success) {
    throw new Error("OpenRouter response missing choices[0].message.content");
  }

  const content = parsedResponse.data.choices[0]!.message.content;
  if (typeof content !== "string") return content;

  try {
    return JSON.parse(content) as unknown;
  } catch (error) {
    throw new Error(
      `OpenRouter response content was not valid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

export function createOpenRouterChatCompletionFetcher({
  model = process.env.OPENROUTER_STORYBOARD_MODEL ??
    DEFAULT_OPENROUTER_STORYBOARD_MODEL,
  fetchImpl = fetch,
}: {
  model?: string;
  fetchImpl?: FetchImpl;
} = {}): Fetcher {
  return async (input) => {
    const response = await fetchImpl(OPENROUTER_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
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
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "deck_storyboard_response",
            strict: true,
            schema: storyboardResponseJsonSchema,
          },
        },
        provider: {
          require_parameters: true,
        },
        temperature: 0.2,
        stream: false,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `OpenRouter ${input.task} request failed (${response.status} ${
          response.statusText
        }): ${body.slice(0, 500)}`,
      );
    }

    return parseOpenRouterContent(await response.json());
  };
}

export function createOpenRouterProvider({
  apiKey,
  fetcher = createOpenRouterChatCompletionFetcher(),
}: {
  apiKey?: string | null;
  fetcher?: Fetcher;
}): OpenRouterProvider {
  async function request(input: Parameters<OpenRouterProvider["generateStoryboard"]>[0]) {
    if (!apiKey) {
      throw new Error("OpenRouter provider key is required");
    }
    return fetcher({
      provider: "openrouter",
      apiKey,
      task: input.task,
      storyline: input.storyline,
      targetSlideCount: input.targetSlideCount,
      includeSuggestions: input.includeSuggestions,
      previousStructure: input.previousStructure,
    });
  }

  return {
    async generateStoryboard(input) {
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
        `OpenRouter ${input.task} validation failed after retry: ${String(
          lastError,
        )}`,
      );
    },
  };
}
