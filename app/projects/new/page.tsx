import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/auth/session";
import {
  MAX_STORYLINE_CHARACTERS,
  type StyleTemplateName,
  styleTemplates,
} from "@/lib/projects/style-settings";

const styleTemplateLabels: Record<StyleTemplateName, string> = {
  "Executive Consulting": "임원 보고형",
  "Strategy Proposal": "전략 제안형",
  "Minimal White": "미니멀 화이트",
  "Dark Executive": "다크 임원 보고",
  "Technical Architecture": "기술 아키텍처",
};

export default async function NewProjectPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-8">
      <header className="mb-8 border-b border-border pb-5">
        <p className="text-sm font-medium text-muted-foreground">새 프로젝트</p>
        <h1 className="text-3xl font-semibold">스토리라인 입력</h1>
      </header>
      <form action="/api/projects" method="post" className="grid gap-5">
        <section className="grid gap-4 rounded-md border border-border bg-card p-5">
          <label className="grid gap-2 text-sm font-medium">
            프로젝트 이름
            <input name="name" required className="h-10 rounded-md border border-border bg-background px-3" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            스토리라인
            <textarea
              name="storyline"
              required
              maxLength={MAX_STORYLINE_CHARACTERS}
              rows={12}
              className="rounded-md border border-border bg-background p-3"
            />
          </label>
          <p className="text-sm text-muted-foreground">
            최대 {MAX_STORYLINE_CHARACTERS.toLocaleString()}자까지 입력할 수 있습니다.
          </p>
        </section>
        <details open className="rounded-md border border-border bg-card p-5">
          <summary className="cursor-pointer text-lg font-semibold">슬라이드 수와 AI 옵션</summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              목표 슬라이드 수
              <input name="targetSlideCount" type="number" min={1} max={80} defaultValue={8} className="h-10 rounded-md border border-border bg-background px-3" />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input name="improvementSuggestionsEnabled" type="checkbox" defaultChecked />
              스토리라인 개선 제안 생성
            </label>
          </div>
        </details>
        <details className="rounded-md border border-border bg-card p-5">
          <summary className="cursor-pointer text-lg font-semibold">스타일 설정</summary>
          <div className="mt-4 grid gap-4">
            <label className="grid gap-2 text-sm font-medium">
              템플릿
              <select name="styleTemplate" className="h-10 rounded-md border border-border bg-background px-3">
                {Object.keys(styleTemplates).map((name) => (
                  <option key={name} value={name}>{styleTemplateLabels[name as StyleTemplateName]}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              공통 스타일 프롬프트
              <textarea name="customCommonStylePrompt" rows={4} className="rounded-md border border-border bg-background p-3" />
            </label>
          </div>
        </details>
        <details className="rounded-md border border-border bg-card p-5">
          <summary className="cursor-pointer text-lg font-semibold">이미지 설정</summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              화면 비율
              <select name="aspectRatio" defaultValue="16:9" className="h-10 rounded-md border border-border bg-background px-3">
                <option value="16:9">16:9</option>
                <option value="4:3">4:3</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              기본 이미지 모델
              <select name="defaultImageModel" defaultValue="gpt-image-2" className="h-10 rounded-md border border-border bg-background px-3">
                <option value="gpt-image-2">gpt-image-2</option>
                <option value="nano-banana">nano-banana</option>
              </select>
            </label>
          </div>
        </details>
        <Button type="submit" className="justify-self-start">
          <Sparkles className="size-4" aria-hidden="true" />
          프로젝트 만들기
        </Button>
      </form>
    </main>
  );
}
