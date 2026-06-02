import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("T003 smoke test", () => {
  it("renders the app shell", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: /Deck Storyboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Start draft/i })).toHaveAttribute(
      "href",
      "/signup",
    );
  });
});
