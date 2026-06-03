import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/auth/session";
import {
  MAX_STORYLINE_CHARACTERS,
  type StyleTemplateName,
  styleTemplates,
} from "@/lib/projects/style-settings";
import { MAX_SLIDE_COUNT } from "@/lib/projects/slide-count";

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
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">새 프로젝트</p>
          <h1 className="text-3xl font-semibold">스토리라인 입력</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/projects">프로젝트</Link>
          </Button>
          <LogoutButton />
        </div>
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
          <div className="mt-4 grid gap-4">
            <fieldset className="grid gap-3">
              <legend className="text-sm font-medium">슬라이드 수 범위</legend>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  ["auto", "자동", "스토리 밀도 기준"],
                  ["brief", "간단히", "5-8 slides"],
                  ["standard", "표준", "9-14 slides"],
                  ["detailed", "상세", "15-25 slides"],
                  ["custom", "직접 범위", "min/max 입력"],
                ].map(([value, label, help]) => (
                  <label
                    key={value}
                    className="grid min-h-24 cursor-pointer gap-2 rounded-md border border-border bg-background p-3 text-sm"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <input
                        name="slideCountMode"
                        type="radio"
                        value={value}
                        defaultChecked={value === "standard"}
                      />
                      {label}
                    </span>
                    <span className="text-xs leading-5 text-muted-foreground">{help}</span>
                  </label>
                ))}
              </div>
              <div className="grid gap-3 rounded-md border border-dashed border-border p-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium">
                  직접 최소 slide
                  <input
                    name="minSlideCount"
                    type="number"
                    min={1}
                    max={MAX_SLIDE_COUNT}
                    defaultValue={9}
                    className="h-10 rounded-md border border-border bg-background px-3"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  직접 최대 slide
                  <input
                    name="maxSlideCount"
                    type="number"
                    min={1}
                    max={MAX_SLIDE_COUNT}
                    defaultValue={14}
                    className="h-10 rounded-md border border-border bg-background px-3"
                  />
                </label>
                <p className="text-sm leading-6 text-muted-foreground sm:col-span-2">
                  자동은 범위를 강제하지 않습니다. 스토리라인에 `12페이지`,
                  `Slide 01` 같은 marker가 있으면 별도 LLM 호출 없이 참고용
                  count만 감지합니다.
                </p>
              </div>
            </fieldset>
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
