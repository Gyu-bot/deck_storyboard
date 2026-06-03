import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LoginPage from "@/app/login/page";
import { AdminMemberKeySettings } from "@/app/settings/admin-member-key-settings";
import { ProjectsHeaderActions } from "@/app/projects/projects-header-actions";
import { StoryboardWorkspace } from "@/app/projects/[projectId]/storyboard-workspace";
import { StoryboardTestModeToggle } from "@/app/projects/[projectId]/storyboard-test-mode-toggle";

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
    const imagePrompt = () => screen.getByRole("textbox", { name: /슬라이드 목업 프롬프트AI 생성/ });

    fireEvent.click(showPromptTab());
    expect(imagePrompt()).toHaveValue("Prompt A");

    fireEvent.click(screen.getByRole("button", { name: /Slide B/ }));

    expect(imagePrompt()).toHaveValue("Prompt B");
  });
});

describe("T017B storyboard detail floating panel", () => {
  it("keeps the detail editor sticky on desktop with an internal scroll area", () => {
    const project = {
      id: "project-1",
      name: "Sample",
      status: "storyboard_review" as const,
      improvementSuggestions: null,
      targetSlideCountRationale: null,
      generationError: null,
    };
    const initialSlides = Array.from({ length: 16 }, (_, index) => ({
      id: `slide-${index + 1}`,
      sectionTitle: "Section",
      position: index + 1,
      title: `Slide ${index + 1}`,
      coreMessage: `Core message ${index + 1}`,
      contentPoints: ["Point A", "Point B", "Point C"],
      visualDirection: "A dense chart with annotations",
      imagePrompt: "Executive slide image prompt",
      slideRole: "Evidence",
      fieldEditState: {
        title: "aiGenerated",
        coreMessage: "aiGenerated",
        contentPoints: "aiGenerated",
        visualDirection: "aiGenerated",
        imagePrompt: "aiGenerated",
        slideRole: "aiGenerated",
      },
      imageGenerationStatus: "not_generated",
    }));

    render(<StoryboardWorkspace project={project} initialSlides={initialSlides} />);

    const workspace = screen.getByTestId("storyboard-workspace-layout");
    expect(workspace).toHaveClass("items-start");
    expect(workspace).toHaveClass("lg:grid-cols-[minmax(0,1fr)_minmax(480px,520px)]");

    const panel = screen.getByLabelText("선택 슬라이드 상세 편집 패널");
    expect(panel).toHaveClass("lg:sticky");
    expect(panel).toHaveClass("lg:top-6");
    expect(panel).toHaveClass("lg:max-h-[calc(100vh-3rem)]");
    expect(panel).toHaveClass("overflow-hidden");

    expect(screen.getByTestId("storyboard-detail-scroll-area")).toHaveClass("overflow-y-auto");
    expect(screen.getByRole("button", { name: /삭제/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "목업" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "목업 생성" })).toBeInTheDocument();
    expect(screen.getAllByText("목업 없음").length).toBeGreaterThan(0);
  });
});

describe("T015B storyboard test mode toggle", () => {
  it("switches between sample fixture mode and live OpenRouter mode", () => {
    const { rerender } = render(<StoryboardTestModeToggle enabled={false} />);

    expect(
      screen.getByRole("button", { name: "테스트 모드 켜기" }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("true")).toHaveAttribute(
      "name",
      "enabled",
    );

    rerender(<StoryboardTestModeToggle enabled />);

    expect(
      screen.getByRole("button", { name: "테스트 모드 끄기" }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("false")).toHaveAttribute(
      "name",
      "enabled",
    );
  });
});

describe("T009B admin settings navigation", () => {
  it("shows the settings entry only for administrators", () => {
    const { rerender } = render(<ProjectsHeaderActions isAdmin={false} />);

    expect(screen.queryByRole("link", { name: "설정" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "새 프로젝트" })).toHaveAttribute(
      "href",
      "/projects/new",
    );

    rerender(<ProjectsHeaderActions isAdmin />);

    expect(screen.getByRole("link", { name: "설정" })).toHaveAttribute(
      "href",
      "/settings",
    );
  });

  it("lists members first and opens provider key management after selecting a member", () => {
    const users = [
      {
        id: "member-1",
        email: "test@example.local",
        role: "member" as const,
        createdAt: "2026-06-03T00:00:00.000Z",
        updatedAt: "2026-06-03T00:00:00.000Z",
        deletedAt: null,
      },
      {
        id: "member-2",
        email: "owner@example.local",
        role: "member" as const,
        createdAt: "2026-06-03T00:00:00.000Z",
        updatedAt: "2026-06-03T00:00:00.000Z",
        deletedAt: null,
      },
    ];

    const { rerender } = render(
      <AdminMemberKeySettings
        users={users}
        selectedUser={null}
        selectedPresence={null}
        query=""
      />,
    );

    expect(screen.getByRole("heading", { name: "회원 리스트" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "test@example.local" })).toHaveAttribute(
      "href",
      "/settings?userId=member-1",
    );
    expect(screen.queryByPlaceholderText("key 추가 또는 교체")).not.toBeInTheDocument();
    expect(screen.getByText("회원을 선택하면 provider key를 관리할 수 있습니다.")).toBeInTheDocument();

    rerender(
      <AdminMemberKeySettings
        users={users}
        selectedUser={users[0]!}
        selectedPresence={{
          openrouter: "sk-o...1234",
          openai: null,
          anthropic: null,
          gemini: null,
        }}
        query=""
      />,
    );

    expect(screen.getByRole("heading", { name: "test@example.local" })).toBeInTheDocument();
    expect(screen.getByText("할당됨: sk-o...1234")).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText("key 추가 또는 교체")).toHaveLength(4);
    expect(screen.getAllByDisplayValue("/settings?userId=member-1")).toHaveLength(4);
    for (const returnTo of screen.getAllByDisplayValue("/settings?userId=member-1")) {
      expect(returnTo).toHaveAttribute("name", "returnTo");
    }
  });
});
