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

export const storyboardResponseSchema = z.object({
  documentPurpose: z.string().min(1),
  overallThesis: z.string().min(1),
  sections: z.array(storySectionSchema).min(1),
  improvementSuggestions: z.array(storyImprovementSuggestionSchema).optional(),
  targetSlideCountRationale: z.string().optional(),
  slides: z.array(slideBreakdownSchema).optional(),
});

export type StoryboardResponse = z.infer<typeof storyboardResponseSchema>;
export type SlideBreakdown = z.infer<typeof slideBreakdownSchema>;

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

type Fetcher = (input: Record<string, unknown>) => Promise<unknown>;

export function createOpenRouterProvider({
  apiKey,
  fetcher,
}: {
  apiKey?: string | null;
  fetcher: Fetcher;
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
