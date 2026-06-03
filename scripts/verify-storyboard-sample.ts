import fs from "node:fs";
import path from "node:path";
import { imageGenerationBatches, slideImageGenerations } from "@/lib/db/schema";
import { createTestDatabase } from "@/lib/db/test-utils";
import { createOpenRouterProvider, storyboardResponseSchema } from "@/lib/ai/openrouter";
import {
  createProjectForUser,
  getProjectForUser,
  getSlidesForProject,
} from "@/lib/repositories/projects";
import { analyzeStoryStructure, createSlideBreakdown } from "@/lib/storyboard/generation";

const root = process.cwd();
const storylinePath = path.join(root, "tmp/rca-ax-readiness-storyline-sample.md");
const storyboardPath = path.join(root, "tmp/rca-ax-readiness-storyboard-sample.json");

function readRequiredFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Missing sample file: ${filePath}. Create the ignored tmp sample before running this check.`,
    );
  }
  return fs.readFileSync(filePath, "utf8");
}

const storyline = readRequiredFile(storylinePath);
const rawStoryboard = JSON.parse(readRequiredFile(storyboardPath)) as unknown;
const parsed = storyboardResponseSchema.safeParse(rawStoryboard);

if (!parsed.success) {
  console.error(parsed.error);
  process.exit(1);
}

const sampleStoryboard = parsed.data;
const expectedSlideCount = sampleStoryboard.slides?.length ?? 0;

if (expectedSlideCount === 0) {
  throw new Error("Sample storyboard must contain at least one slide.");
}

const db = createTestDatabase();
const project = createProjectForUser(db, "sample-user", {
  name: "RCA AX Readiness Proposal",
  storyline,
  targetSlideCount: expectedSlideCount,
  improvementSuggestionsEnabled: true,
  resolvedCommonPrompt:
    "Clean executive consulting deck style. White background, strong hierarchy, diagram-oriented composition.",
});

const providerCalls: string[] = [];
const provider = createOpenRouterProvider({
  apiKey: "dummy-openrouter-key",
  fetcher: async (input) => {
    providerCalls.push(String(input.task));
    return sampleStoryboard;
  },
});

async function main() {
  const structure = await analyzeStoryStructure(db, project.id, "sample-user", provider);
  const generatedSlides = await createSlideBreakdown(
    db,
    project.id,
    "sample-user",
    provider,
    structure,
  );
  const storedProject = getProjectForUser(db, project.id, "sample-user");
  const storedSlides = getSlidesForProject(db, project.id, "sample-user");
  const imageGenerationRows = db.select().from(slideImageGenerations).all();
  const imageBatchRows = db.select().from(imageGenerationBatches).all();

  if (providerCalls.length !== 1 || providerCalls[0] !== "story_structure") {
    throw new Error(
      `Expected only the dummy story_structure response to be used, got: ${providerCalls.join(", ")}`,
    );
  }

  if (generatedSlides.length !== expectedSlideCount || storedSlides.length !== expectedSlideCount) {
    throw new Error(
      `Expected ${expectedSlideCount} persisted slides, got generated=${generatedSlides.length}, stored=${storedSlides.length}.`,
    );
  }

  if (storedProject?.status !== "storyboard_review") {
    throw new Error(`Expected project status storyboard_review, got ${storedProject?.status}.`);
  }

  for (const [index, slide] of storedSlides.entries()) {
    const expected = sampleStoryboard.slides?.[index];
    if (!expected) throw new Error(`Missing expected slide at index ${index}.`);
    if (slide.position !== index + 1) {
      throw new Error(`Slide ${index + 1} has wrong position: ${slide.position}.`);
    }
    if (slide.title !== expected.title || slide.coreMessage !== expected.coreMessage) {
      throw new Error(`Slide ${index + 1} content did not persist from sample JSON.`);
    }
    if (slide.contentPoints.length === 0 || slide.visualDirection.length === 0) {
      throw new Error(`Slide ${index + 1} is missing required storyboard fields.`);
    }
    if (
      slide.fieldEditState.title !== "aiGenerated" ||
      slide.fieldEditState.imagePrompt !== "aiGenerated"
    ) {
      throw new Error(`Slide ${index + 1} field edit state should start as aiGenerated.`);
    }
  }

  if (imageGenerationRows.length !== 0 || imageBatchRows.length !== 0) {
    throw new Error("Storyboard sample check must stop before image generation records are created.");
  }

  console.log(
    [
      "storyboard sample ok",
      `slides=${storedSlides.length}`,
      `llm_dummy_calls=${providerCalls.join(",")}`,
      `status=${storedProject.status}`,
      "image_generation=not_started",
    ].join(" | "),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
