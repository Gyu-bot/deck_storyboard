import { ArrowRight, FileText, Image, Layers3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const workflowItems = [
  {
    icon: FileText,
    label: "Structure",
    text: "Turn a long storyline into sections and slide-level messages.",
  },
  {
    icon: Layers3,
    label: "Review",
    text: "Inspect the vertical storyboard before spending image-generation cost.",
  },
  {
    icon: Image,
    label: "Reference",
    text: "Generate visual directions for manual PowerPoint production.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between border-b border-border pb-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Deck Storyboard
            </p>
            <h1 className="text-2xl font-semibold tracking-normal">
              Consulting storyboard workspace
            </h1>
          </div>
          <Button>
            Start draft
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </header>

        <div className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[1fr_420px]">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-normal text-muted-foreground">
              MVP scaffold
            </p>
            <h2 className="text-4xl font-semibold tracking-normal text-balance sm:text-5xl">
              Build slide logic first, then generate reference images.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              This app helps consultants convert a proposal or report storyline
              into a reviewable slide storyboard before creating the final PPT.
            </p>
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
