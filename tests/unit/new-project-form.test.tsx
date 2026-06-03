import { render, screen } from "@testing-library/react";
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
    expect(screen.getByRole("spinbutton", { name: "직접 최소 slide" })).toHaveValue(9);
    expect(screen.getByRole("spinbutton", { name: "직접 최대 slide" })).toHaveValue(14);
    expect(screen.getByText(/별도 LLM 호출 없이 참고용 count만 감지/)).toBeInTheDocument();
  });
});
