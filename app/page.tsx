import { AlertTriangle, ArrowRight, FileText, Image, Layers3 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const workflowItems = [
  {
    icon: FileText,
    label: "스토리 구조화",
    text: "긴 제안서/보고서 스토리라인을 섹션과 슬라이드 메시지로 나눕니다.",
  },
  {
    icon: Layers3,
    label: "논리 검토",
    text: "목업 생성 비용을 쓰기 전에 세로형 스토리보드에서 흐름을 확인합니다.",
  },
  {
    icon: Image,
    label: "슬라이드 목업",
    text: "최종 PPT 제작에 참고할 목업 방향을 생성합니다.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between border-b border-border pb-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              컨설팅 덱 스토리보드 워크스페이스
            </p>
            <h1 className="text-2xl font-semibold tracking-normal">
              Deck Storyboard
            </h1>
          </div>
          <Button asChild>
            <Link href="/signup">
              새 스토리보드 시작
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </header>

        <div className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[1fr_420px]">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-normal text-muted-foreground">
              AI storyboard builder
            </p>
            <h2 className="text-4xl font-semibold tracking-normal text-balance sm:text-5xl">
              슬라이드 논리를 먼저 확정하고, 목업은 그 다음에 만듭니다.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              전체 프리젠테이션/제안서/리포트 스토리라인을 이미 가지고 있는
              사람이 그 흐름을 검토 가능한 슬라이드 단위로 정리하는 도구입니다.
            </p>
            <div className="mt-5 flex max-w-2xl items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-950">
              <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <p className="text-sm leading-6">
                완성 deck을 만들 수 없습니다. 산출물은 사람이 최종 덱을 만들
                때 사용하는 참고용 skeleton deck 자료입니다.
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {workflowItems.map((item) => (
              <article
                key={item.label}
                className="rounded-md border border-border bg-card p-5 text-card-foreground shadow-sm"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                    <item.icon className="size-4" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-semibold">{item.label}</h3>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
