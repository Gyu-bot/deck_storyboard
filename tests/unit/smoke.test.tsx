import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("T003 smoke test", () => {
  it("renders the app shell", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: /Deck Storyboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "새 스토리보드 시작" })).toHaveAttribute("href", "/signup");
  });
});
