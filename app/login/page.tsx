import Link from "next/link";
import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-5xl gap-8 px-6 py-10 lg:grid-cols-[1fr_420px]">
      <section className="flex flex-col justify-center">
        <p className="text-sm font-medium text-muted-foreground">Deck Storyboard</p>
        <h1 className="mt-2 text-4xl font-semibold">Log in</h1>
        <p className="mt-4 text-muted-foreground">
          Continue to your storyboard projects.
        </p>
        <Link className="mt-4 text-sm font-medium text-primary" href="/signup">
          Create an account
        </Link>
      </section>
      <LoginForm />
    </main>
  );
}
