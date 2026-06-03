import Link from "next/link";
import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto grid min-h-svh w-full max-w-4xl items-center gap-6 px-6 py-6 lg:grid-cols-[1fr_360px]">
      <section className="flex flex-col justify-center">
        <p className="text-sm font-medium text-muted-foreground">Deck Storyboard</p>
        <h1 className="mt-2 text-3xl font-semibold">로그인</h1>
        <p className="mt-4 text-muted-foreground">
          진행 중인 스토리보드 프로젝트로 돌아갑니다.
        </p>
        <Link className="mt-4 text-sm font-medium text-primary" href="/signup">
          계정 만들기
        </Link>
      </section>
      <LoginForm />
    </main>
  );
}
