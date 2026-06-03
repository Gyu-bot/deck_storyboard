import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LogoutButton } from "@/components/logout-button";

describe("authenticated logout action", () => {
  it("links authenticated users to the logout route", () => {
    render(<LogoutButton />);

    expect(screen.getByRole("link", { name: "로그아웃" })).toHaveAttribute("href", "/logout");
  });
});
