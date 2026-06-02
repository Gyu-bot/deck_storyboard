import Link from "next/link";
import { KeyRound, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-5xl gap-8 px-6 py-10 lg:grid-cols-[1fr_420px]">
      <section className="flex flex-col justify-center">
        <p className="text-sm font-medium text-muted-foreground">Deck Storyboard</p>
        <h1 className="mt-2 text-4xl font-semibold">Create your workspace</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Add your OpenRouter key now so storyboard generation can run without
          a server-side fallback key.
        </p>
      </section>
      <form
        action="/api/signup"
        method="post"
        className="grid content-start gap-4 rounded-md border border-border bg-card p-5 shadow-sm"
      >
        <label className="grid gap-2 text-sm font-medium">
          Email
          <input name="email" type="email" required className="h-10 rounded-md border border-border bg-background px-3" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Password
          <input name="password" type="password" minLength={8} required className="h-10 rounded-md border border-border bg-background px-3" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Confirm password
          <input name="passwordConfirm" type="password" minLength={8} required className="h-10 rounded-md border border-border bg-background px-3" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          OpenRouter API key
          <input name="openrouterKey" type="password" required className="h-10 rounded-md border border-border bg-background px-3" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Optional image provider
          <select name="imageProvider" className="h-10 rounded-md border border-border bg-background px-3">
            <option value="openai_images">OpenAI Images</option>
            <option value="nano_banana">Nano Banana</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Optional image provider key
          <input name="imageProviderKey" type="password" className="h-10 rounded-md border border-border bg-background px-3" />
        </label>
        <Button type="submit">
          <UserPlus className="size-4" aria-hidden="true" />
          Sign up
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">
            <KeyRound className="size-4" aria-hidden="true" />
            Log in instead
          </Link>
        </Button>
      </form>
    </main>
  );
}
