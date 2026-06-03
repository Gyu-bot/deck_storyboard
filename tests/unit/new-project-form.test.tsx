import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NewProjectPage from "@/app/projects/new/page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUserId: vi.fn(async () => "user-a"),
}));

describe("T011A new project slide count range form", () => {
  it("renders auto, preset, and custom range controls with standard selected", async () => {
    render(await NewProjectPage());

    expect(screen.getByRole("radio", { name: /자동/ })).toHaveAttribute(
      "value",
      "auto",
    );
    expect(screen.getByRole("radio", { name: /간단히/ })).toHaveAttribute(
      "value",
      "brief",
    );
    expect(screen.getByRole("radio", { name: /표준/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /상세/ })).toHaveAttribute(
      "value",
      "detailed",
    );
    expect(screen.getByRole("radio", { name: /직접 범위/ })).toHaveAttribute(
      "value",
      "custom",
    );
    expect(screen.queryByRole("spinbutton", { name: "직접 최소 slide" })).not.toBeInTheDocument();
    expect(screen.queryByRole("spinbutton", { name: "직접 최대 slide" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: /직접 범위/ }));

    expect(screen.getByRole("spinbutton", { name: "직접 최소 slide" })).toHaveValue(9);
    expect(screen.getByRole("spinbutton", { name: "직접 최대 slide" })).toHaveValue(14);
    expect(screen.getByText(/직접 범위를 선택한 경우에만 적용됩니다/)).toBeInTheDocument();
    expect(screen.getByText("슬라이드 목업 설정")).toBeInTheDocument();
    expect(screen.getByLabelText("기본 목업 생성 모델")).toBeInTheDocument();
    expect(screen.queryByText("이미지 설정")).not.toBeInTheDocument();
  });
});
