"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(formData: FormData) {
    setError("");
    const result = await signIn("credentials", {
      redirect: false,
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
    if (result?.error) {
      setError("로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.");
      return;
    }
    router.push("/projects");
  }

  return (
    <form action={onSubmit} className="grid gap-4 rounded-md border border-border bg-card p-5 shadow-sm">
      <label className="grid gap-2 text-sm font-medium">
        이메일
        <input name="email" type="email" required className="h-10 rounded-md border border-border bg-background px-3" />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        비밀번호
        <input name="password" type="password" required className="h-10 rounded-md border border-border bg-background px-3" />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button type="submit">
        <LogIn className="size-4" aria-hidden="true" />
        로그인
      </Button>
    </form>
  );
}
