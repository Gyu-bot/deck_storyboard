import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  STORYBOARD_SAMPLE_FIXTURE_PATH,
  isStoryboardTestModeEnabled,
  loadStoryboardSampleFixture,
} from "@/lib/storyboard/sample-fixture";

const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

function createFixtureRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "storyboard-sample-"));
  tempRoots.push(root);
  const fixturePath = path.join(root, STORYBOARD_SAMPLE_FIXTURE_PATH);
  fs.mkdirSync(path.dirname(fixturePath), { recursive: true });
  fs.writeFileSync(
    fixturePath,
    JSON.stringify({
      documentPurpose: "Proposal",
      overallThesis: "Use sample storyboard before live LLM calls",
      sections: [
        {
          id: "s1",
          title: "Sample",
          role: "Fixture",
          coreMessage: "Fixture drives frontend testing",
          sourceSummary: "Temporary sample JSON",
          suggestedSlideCount: 1,
        },
      ],
      slides: [
        {
          sectionId: "s1",
          sectionTitle: "Sample",
          title: "Sample slide",
          coreMessage: "The sample response persists as a slide",
          contentPoints: ["Validate schema", "Persist slide"],
          visualDirection: "Simple two-column layout",
          imagePrompt: "Create a clean sample consulting slide.",
          slideRole: "Fixture slide",
        },
      ],
    }),
  );
  return root;
}

describe("local storyboard sample fixture", () => {
  it("enables sample fixture test mode only from the dev cookie", () => {
    expect(
      isStoryboardTestModeEnabled({
        cookieValue: "sample-fixture",
        nodeEnv: "development",
      }),
    ).toBe(true);
    expect(
      isStoryboardTestModeEnabled({
        cookieValue: null,
        nodeEnv: "development",
      }),
    ).toBe(false);
    expect(
      isStoryboardTestModeEnabled({
        cookieValue: "sample-fixture",
        nodeEnv: "production",
      }),
    ).toBe(false);
  });

  it("loads a schema-valid ignored sample only when development test mode is enabled", () => {
    const root = createFixtureRoot();

    const disabledSample = loadStoryboardSampleFixture({
      root,
      nodeEnv: "development",
      testModeEnabled: false,
    });
    const sample = loadStoryboardSampleFixture({
      root,
      nodeEnv: "development",
      testModeEnabled: true,
    });
    const productionSample = loadStoryboardSampleFixture({
      root,
      nodeEnv: "production",
      testModeEnabled: true,
    });

    expect(disabledSample).toBeNull();
    expect(sample?.slides).toHaveLength(1);
    expect(sample?.slides?.[0]?.title).toBe("Sample slide");
    expect(productionSample).toBeNull();
  });
});
