import fs from "node:fs";
import path from "node:path";
import {
  storyboardResponseSchema,
  type StoryboardResponse,
} from "@/lib/ai/openrouter";

export const STORYBOARD_SAMPLE_FIXTURE_PATH =
  "tmp/rca-ax-readiness-storyboard-sample.json";

export function loadStoryboardSampleFixture({
  root = process.cwd(),
  nodeEnv = process.env.NODE_ENV,
}: {
  root?: string;
  nodeEnv?: string;
} = {}): StoryboardResponse | null {
  if (nodeEnv === "production") return null;

  const fixturePath = path.join(root, STORYBOARD_SAMPLE_FIXTURE_PATH);
  if (!fs.existsSync(fixturePath)) return null;

  const raw = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as unknown;
  return storyboardResponseSchema.parse(raw);
}
