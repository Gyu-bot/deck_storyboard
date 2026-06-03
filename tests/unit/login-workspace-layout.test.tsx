import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LoginPage from "@/app/login/page";
import { StoryboardWorkspace } from "@/app/projects/[projectId]/storyboard-workspace";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("T007A login layout", () => {
  it("keeps the login layout inside a balanced viewport spacing set", () => {
    render(<LoginPage />);
    const main = screen.getByRole("main");

    expect(main).toHaveClass("min-h-svh");
    expect(main).toHaveClass("items-center");
    expect(main).toHaveClass("py-6");
    expect(main).toHaveClass("gap-6");
  });
});

describe("T017A slide selection sync", () => {
  it("refreshes detail panel values when another slide is selected", () => {
    const project = {
      id: "project-1",
      name: "Sample",
      status: "storyboard_review" as const,
      improvementSuggestions: null,
      targetSlideCountRationale: null,
      generationError: null,
    };

    const initialSlides = [
      {
        id: "slide-a",
        sectionTitle: "Section",
        position: 1,
        title: "Slide A",
        coreMessage: "Core message A",
        contentPoints: ["Point A-1", "Point A-2"],
        visualDirection: "Visual A",
        imagePrompt: "Prompt A",
        slideRole: "Role A",
        fieldEditState: {
          title: "aiGenerated",
          coreMessage: "aiGenerated",
          contentPoints: "aiGenerated",
          visualDirection: "aiGenerated",
          imagePrompt: "aiGenerated",
          slideRole: "aiGenerated",
        },
        imageGenerationStatus: "generated",
      },
      {
        id: "slide-b",
        sectionTitle: "Section",
        position: 2,
        title: "Slide B",
        coreMessage: "Core message B",
        contentPoints: ["Point B-1", "Point B-2"],
        visualDirection: "Visual B",
        imagePrompt: "Prompt B",
        slideRole: "Role B",
        fieldEditState: {
          title: "aiGenerated",
          coreMessage: "userModified",
          contentPoints: "aiGenerated",
          visualDirection: "userModified",
          imagePrompt: "aiGenerated",
          slideRole: "aiGenerated",
        },
        imageGenerationStatus: "generated",
      },
    ];

    const { container } = render(
      <StoryboardWorkspace project={project} initialSlides={initialSlides} />,
    );

    expect(container.firstElementChild).toHaveClass(
      "lg:grid-cols-[minmax(0,1fr)_minmax(480px,520px)]",
    );
    expect(container.firstElementChild).toHaveClass(
      "xl:grid-cols-[minmax(0,1fr)_minmax(520px,560px)]",
    );

    const showPromptTab = () => screen.getByRole("button", { name: /프롬프트/ });
    const imagePrompt = () => screen.getByRole("textbox", { name: /이미지 프롬프트AI 생성/ });

    fireEvent.click(showPromptTab());
    expect(imagePrompt()).toHaveValue("Prompt A");

    fireEvent.click(screen.getByRole("button", { name: /Slide B/ }));

    expect(imagePrompt()).toHaveValue("Prompt B");
  });
});
