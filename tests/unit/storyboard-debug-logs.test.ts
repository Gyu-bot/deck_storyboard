import { describe, expect, it, vi } from "vitest";

import { providerCallDebugLogs } from "@/lib/db/schema";
import { createTestDatabase } from "@/lib/db/test-utils";
import { createProjectForUser } from "@/lib/repositories/projects";
import {
  analyzeStoryStructure,
  createSlideBreakdown,
} from "@/lib/storyboard/generation";
import type { OpenRouterProvider, StoryboardResponse } from "@/lib/ai/openrouter";

const validStoryboard: StoryboardResponse = {
  documentPurpose: "투자 검토",
  overallThesis: "성장성과 리스크를 균형 있게 설명한다.",
  sections: [
    {
      id: "sec-1",
      title: "시장",
      role: "Context",
      coreMessage: "시장이 커지고 있다.",
      sourceSummary: "시장 자료",
      suggestedSlideCount: 1,
    },
  ],
  slides: [
    {
      sectionId: "sec-1",
      sectionTitle: "시장",
      title: "시장 성장",
      coreMessage: "시장은 빠르게 성장 중이다.",
      contentPoints: ["연평균 성장률"],
      visualDirection: "라인 차트",
      imagePrompt: "시장 성장 차트 목업",
      slideRole: "Context",
    },
  ],
};

describe("T027C LLM provider debug logs", () => {
  it("records successful story_structure and slide_breakdown attempts with snapshots", async () => {
    const db = createTestDatabase();
    const project = createProjectForUser(db, "user-a", {
      name: "Deck",
      storyline: "한국어 투자 스토리라인",
    });
    const provider: OpenRouterProvider = {
      debugMetadata: {
        provider: "openrouter",
        model: "openai/gpt-4o",
      },
      generateStoryboard: vi
        .fn()
        .mockResolvedValueOnce({ ...validStoryboard, slides: undefined })
        .mockResolvedValueOnce(validStoryboard),
    };

    const structure = await analyzeStoryStructure(db, project.id, "user-a", provider);
    await createSlideBreakdown(db, project.id, "user-a", provider, structure);

    const logs = db
      .select()
      .from(providerCallDebugLogs)
      .orderBy(providerCallDebugLogs.createdAt)
      .all();
    expect(logs).toHaveLength(2);
    expect(logs[0]).toMatchObject({
      projectId: project.id,
      userId: "user-a",
      operationType: "story_structure",
      provider: "openrouter",
      model: "openai/gpt-4o",
      attemptNumber: 1,
      status: "succeeded",
    });
    expect(logs[1]).toMatchObject({
      operationType: "slide_breakdown",
      status: "succeeded",
    });
    expect(logs[0]?.requestSnapshot).toMatchObject({
      task: "story_structure",
      slideCountPolicy: expect.any(Object),
    });
    expect(logs[1]?.responseSnapshot).toMatchObject({
      slideCount: 1,
      hasSlides: true,
    });
  });

  it("does not record slide_breakdown when the previous structure already includes slides", async () => {
    const db = createTestDatabase();
    const project = createProjectForUser(db, "user-a", {
      name: "Deck",
      storyline: "한국어 투자 스토리라인",
    });
    const provider: OpenRouterProvider = {
      debugMetadata: {
        provider: "openrouter",
        model: "openai/gpt-4o",
      },
      generateStoryboard: vi.fn(),
    };

    await createSlideBreakdown(db, project.id, "user-a", provider, validStoryboard);

    const logs = db.select().from(providerCallDebugLogs).all();
    expect(logs).toEqual([]);
    expect(provider.generateStoryboard).not.toHaveBeenCalled();
  });

  it("records failed LLM validation attempts without leaking full storyline text", async () => {
    const db = createTestDatabase();
    const project = createProjectForUser(db, "user-a", {
      name: "Deck",
      storyline: "민감한 문서 내용 ".repeat(300),
    });
    const provider: OpenRouterProvider = {
      debugMetadata: {
        provider: "openrouter",
        model: "openai/gpt-4o",
      },
      generateStoryboard: vi.fn().mockRejectedValue(new Error("schema validation failed")),
    };

    await expect(
      analyzeStoryStructure(db, project.id, "user-a", provider),
    ).rejects.toThrow("schema validation failed");

    const logs = db.select().from(providerCallDebugLogs).all();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      operationType: "story_structure",
      status: "failed",
      normalizedError: "schema validation failed",
    });
    expect(JSON.stringify(logs[0]?.requestSnapshot).length).toBeLessThan(2_000);
    expect(logs[0]?.redactionMetadata).toMatchObject({
      truncated: true,
    });
  });
});
