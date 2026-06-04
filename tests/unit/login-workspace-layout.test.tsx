import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LoginPage from "@/app/login/page";
import { AdminMemberKeySettings } from "@/app/settings/admin-member-key-settings";
import { ProjectsHeaderActions } from "@/app/projects/projects-header-actions";
import { StoryboardWorkspace } from "@/app/projects/[projectId]/storyboard-workspace";
import { StoryboardTestModeToggle } from "@/app/projects/[projectId]/storyboard-test-mode-toggle";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

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
    expect(screen.getByRole("button", { name: "전체 슬라이드 목업 생성" })).toBeInTheDocument();
    expect(screen.getAllByText("목업 없음").length).toBeGreaterThan(0);
  });
});

describe("T021-T022 mockup generation trigger", () => {
  it("posts to the project image generation endpoint when the confirmed storyboard mockup button is clicked", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ generated: 1, failed: 0 }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const project = {
      id: "project-1",
      name: "Sample",
      status: "storyboard_confirmed" as const,
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
        contentPoints: ["Point A"],
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
        imageGenerationStatus: "not_generated",
      },
    ];

    render(<StoryboardWorkspace project={project} initialSlides={initialSlides} />);
    fireEvent.click(screen.getByRole("button", { name: "전체 슬라이드 목업 생성" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/projects/project-1/images/generate",
        { method: "POST" },
      );
    });
  });

  it("posts the selected slide id when a slide card mockup button is clicked", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        generated: 1,
        failed: 0,
        images: [
          {
            slideId: "slide-a",
            imageUrl: "/api/projects/project-1/images/slide-a.png",
            provider: "openrouter",
            model: "gpt-image-2",
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const project = {
      id: "project-1",
      name: "Sample",
      status: "storyboard_confirmed" as const,
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
        contentPoints: ["Point A"],
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
        imageGenerationStatus: "not_generated",
      },
    ];

    render(<StoryboardWorkspace project={project} initialSlides={initialSlides} />);
    fireEvent.click(screen.getByRole("button", { name: "슬라이드 1 목업 생성" }));

    await waitFor(() => {
      const requestBody = fetchMock.mock.calls[0]?.[1]?.body as FormData;
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/projects/project-1/images/generate",
        expect.objectContaining({ method: "POST" }),
      );
      expect(requestBody.get("slideId")).toBe("slide-a");
    });

    fireEvent.click(screen.getByRole("button", { name: "목업" }));
    await waitFor(() => {
      expect(screen.getByRole("img", { name: "Slide A 목업" })).toHaveAttribute(
        "src",
        "/api/projects/project-1/images/slide-a.png",
      );
    });
  });
});

describe("T017B storyboard improvement suggestions", () => {
  it("renders suggestions as a readable list instead of raw JSON", () => {
    const project = {
      id: "project-1",
      name: "Sample",
      status: "storyboard_review" as const,
      improvementSuggestions: [
        {
          id: "i1",
          title: "Pilot 후보를 더 구체화",
          rationale: "고객 의사결정을 빠르게 만들려면 대표 품질 이슈 1~2개를 예시로 제시하면 좋다.",
        },
      ],
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
        contentPoints: ["Point A"],
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
        imageGenerationStatus: "not_generated",
      },
    ];

    render(<StoryboardWorkspace project={project} initialSlides={initialSlides} />);

    expect(screen.getByRole("heading", { name: "Pilot 후보를 더 구체화" })).toBeInTheDocument();
    expect(
      screen.getByText("고객 의사결정을 빠르게 만들려면 대표 품질 이슈 1~2개를 예시로 제시하면 좋다."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/"title"/)).not.toBeInTheDocument();
    expect(screen.queryByText(/"rationale"/)).not.toBeInTheDocument();
  });
});

describe("storyboard generation errors", () => {
  it("shows an actionable alert instead of raw API JSON", () => {
    const project = {
      id: "project-1",
      name: "Sample",
      status: "storyboard_generation_failed" as const,
      improvementSuggestions: null,
      targetSlideCountRationale: null,
      generationError:
        "OpenRouter API key가 없습니다. 관리자 화면에서 해당 회원에게 provider key를 할당한 뒤 다시 시도하세요.",
    };

    render(<StoryboardWorkspace project={project} initialSlides={[]} />);

    expect(screen.getByRole("alert")).toHaveTextContent("스토리보드 생성 실패");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "OpenRouter API key가 없습니다.",
    );
    expect(screen.getByRole("link", { name: "프로젝트 목록" })).toHaveAttribute(
      "href",
      "/projects",
    );
    expect(screen.queryByText(/\"error\"/)).not.toBeInTheDocument();
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
        disabledAt: null,
        deletedAt: null,
      },
      {
        id: "member-2",
        email: "owner@example.local",
        role: "member" as const,
        createdAt: "2026-06-03T00:00:00.000Z",
        updatedAt: "2026-06-03T00:00:00.000Z",
        disabledAt: null,
        deletedAt: null,
      },
      {
        id: "member-3",
        email: "inactive@example.local",
        role: "member" as const,
        createdAt: "2026-06-03T00:00:00.000Z",
        updatedAt: "2026-06-04T00:00:00.000Z",
        disabledAt: "2026-06-04T00:00:00.000Z",
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
    expect(screen.getByRole("textbox", { name: "신규 회원 이메일" })).toHaveAttribute(
      "name",
      "email",
    );
    expect(screen.getByLabelText("신규 회원 비밀번호")).toHaveAttribute(
      "name",
      "password",
    );
    expect(screen.getByRole("button", { name: "회원 추가" })).toBeInTheDocument();
    const testMemberLink = screen.getByRole("link", { name: "test@example.local" });
    expect(testMemberLink).toHaveAttribute("href", "/settings?userId=member-1");
    expect(testMemberLink).toHaveClass("block");
    expect(testMemberLink).toHaveClass("w-full");
    expect(testMemberLink).toHaveClass("max-w-full");
    expect(testMemberLink).toHaveClass("box-border");
    expect(screen.getByText("비활성")).toBeInTheDocument();
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
    expect(screen.getByRole("button", { name: "계정 비활성화" })).toHaveAttribute(
      "formAction",
      "/api/admin/users/member-1",
    );
    expect(screen.getByRole("button", { name: "관리자 권한 부여" })).toHaveAttribute(
      "formAction",
      "/api/admin/users/member-1",
    );
    expect(screen.getByRole("button", { name: "계정 삭제" })).toHaveAttribute(
      "formAction",
      "/api/admin/users/member-1",
    );
    expect(screen.getByDisplayValue("grant_admin")).toHaveAttribute("name", "intent");
    expect(screen.getByDisplayValue("delete")).toHaveAttribute("name", "intent");

    fireEvent.change(screen.getByLabelText("OpenAI key"), {
      target: { value: "sk-openai-full-secret" },
    });
    rerender(
      <AdminMemberKeySettings
        users={users}
        selectedUser={users[0]!}
        selectedPresence={{
          openrouter: "sk-o...1234",
          openai: "sk-o...cret",
          anthropic: null,
          gemini: null,
        }}
        query=""
      />,
    );

    expect(screen.getByLabelText("OpenAI key")).toHaveValue("");
    expect(screen.getByText("할당됨: sk-o...cret")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("sk-openai-full-secret")).not.toBeInTheDocument();
  });
});
