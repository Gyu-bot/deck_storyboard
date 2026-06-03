import Link from "next/link";
import { KeyRound, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-5xl gap-8 px-6 py-10 lg:grid-cols-[1fr_420px]">
      <section className="flex flex-col justify-center">
        <p className="text-sm font-medium text-muted-foreground">Deck Storyboard</p>
        <h1 className="mt-2 text-4xl font-semibold">작업 공간 만들기</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          계정 생성 후 관리자가 필요한 provider key를 할당하면 스토리보드
          생성과 슬라이드 목업 생성 기능을 사용할 수 있습니다.
        </p>
      </section>
      <form
        action="/api/signup"
        method="post"
        className="grid content-start gap-4 rounded-md border border-border bg-card p-5 shadow-sm"
      >
        <label className="grid gap-2 text-sm font-medium">
          이메일
          <input name="email" type="email" required className="h-10 rounded-md border border-border bg-background px-3" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          비밀번호
          <input name="password" type="password" minLength={8} required className="h-10 rounded-md border border-border bg-background px-3" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          비밀번호 확인
          <input name="passwordConfirm" type="password" minLength={8} required className="h-10 rounded-md border border-border bg-background px-3" />
        </label>
        <Button type="submit">
          <UserPlus className="size-4" aria-hidden="true" />
          가입하기
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">
            <KeyRound className="size-4" aria-hidden="true" />
            로그인으로 이동
          </Link>
        </Button>
      </form>
    </main>
  );
}
