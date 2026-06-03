import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("T003 smoke test", () => {
  it("renders the app shell", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: /Deck Storyboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "새 스토리보드 시작" })).toHaveAttribute("href", "/signup");
    expect(
      screen.getByText(/전체 프리젠테이션\/제안서\/리포트 스토리라인을 이미 가지고 있는 사람/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/완성 deck을 만들 수 없습니다.*참고용 skeleton deck/),
    ).toBeInTheDocument();
    expect(screen.getByText("슬라이드 목업")).toBeInTheDocument();
    expect(screen.getByText(/최종 PPT 제작에 참고할 목업 방향/)).toBeInTheDocument();
    expect(screen.queryByText("레퍼런스 이미지")).not.toBeInTheDocument();
  });
});
