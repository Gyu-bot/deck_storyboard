"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Image as ImageIcon, Layers3, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProjectStatus } from "@/lib/db/schema";

type ProjectView = {
  id: string;
  name: string;
  status: ProjectStatus;
  improvementSuggestions: unknown[] | null;
  targetSlideCountRationale: string | null;
  generationError: string | null;
};

type SlideView = {
  id: string;
  sectionTitle: string;
  position: number;
  title: string;
  coreMessage: string;
  contentPoints: string[];
  visualDirection: string;
  imagePrompt: string;
  slideRole: string;
  fieldEditState: Record<string, string>;
  imageGenerationStatus: string;
};

function SortableSlideCard({
  slide,
  compact,
  selected,
  onSelect,
}: {
  slide: SlideView;
  compact: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: slide.id });
  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`grid gap-3 rounded-md border p-4 ${selected ? "border-primary bg-secondary" : "border-border bg-card"}`}
    >
      <div className="flex items-start gap-3">
        <button className="mt-1 text-muted-foreground" {...attributes} {...listeners} type="button" aria-label="Drag slide">
          <GripVertical className="size-4" aria-hidden="true" />
        </button>
        <button className="flex-1 text-left" type="button" onClick={onSelect}>
          <p className="text-xs font-medium text-muted-foreground">Slide {slide.position}</p>
          <h3 className="text-lg font-semibold">{slide.title}</h3>
          {!compact ? <p className="mt-2 text-sm text-muted-foreground">{slide.coreMessage}</p> : null}
        </button>
      </div>
      {!compact ? (
        <ul className="ml-7 list-disc text-sm text-muted-foreground">
          {slide.contentPoints.map((point) => <li key={point}>{point}</li>)}
        </ul>
      ) : null}
    </article>
  );
}

function DetailPanel({ projectId, slide }: { projectId: string; slide: SlideView | null }) {
  const [tab, setTab] = useState<"content" | "prompt" | "images">("content");
  if (!slide) {
    return (
      <aside className="rounded-md border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">No selected slide</h2>
        <p className="mt-2 text-sm text-muted-foreground">Select a slide to edit its fields.</p>
      </aside>
    );
  }
  const selectedSlide = slide;

  async function saveField(field: string, value: string) {
    const form = new FormData();
    form.set("field", field);
    form.set("value", value);
    await fetch(`/api/projects/${projectId}/slides/${selectedSlide.id}`, { method: "PATCH", body: form });
    window.location.reload();
  }

  async function deleteSlide() {
    await fetch(`/api/projects/${projectId}/slides/${selectedSlide.id}`, { method: "DELETE" });
    window.location.reload();
  }

  return (
    <aside className="grid gap-4 rounded-md border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{slide.title}</h2>
        <Button type="button" variant="outline" size="sm" onClick={deleteSlide}>
          <Trash2 className="size-4" aria-hidden="true" />
          Delete
        </Button>
      </div>
      <div className="grid grid-cols-3 rounded-md border border-border">
        {(["content", "prompt", "images"] as const).map((item) => (
          <button
            key={item}
            type="button"
            className={`h-9 text-sm font-medium ${tab === item ? "bg-secondary" : ""}`}
            onClick={() => setTab(item)}
          >
            {item[0]!.toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>
      {tab === "content" ? (
        <div className="grid gap-3">
          {[
            ["title", "Title", slide.title],
            ["coreMessage", "Core message", slide.coreMessage],
            ["contentPoints", "Content points", slide.contentPoints.join("\n")],
            ["visualDirection", "Visual direction", slide.visualDirection],
            ["slideRole", "Slide role", slide.slideRole],
          ].map(([field, label, value]) => (
            <label key={field} className="grid gap-2 text-sm font-medium">
              {label} <span className="text-xs text-muted-foreground">{slide.fieldEditState[field] ?? "aiGenerated"}</span>
              <textarea defaultValue={value} rows={field === "contentPoints" ? 4 : 2} className="rounded-md border border-border bg-background p-3" onBlur={(event) => saveField(field, event.currentTarget.value)} />
            </label>
          ))}
        </div>
      ) : null}
      {tab === "prompt" ? (
        <label className="grid gap-2 text-sm font-medium">
          Image prompt <span className="text-xs text-muted-foreground">{slide.fieldEditState.imagePrompt}</span>
          <textarea defaultValue={slide.imagePrompt} rows={8} className="rounded-md border border-border bg-background p-3" onBlur={(event) => saveField("imagePrompt", event.currentTarget.value)} />
        </label>
      ) : null}
      {tab === "images" ? (
        <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
          Image history will appear after generation. Current status: {slide.imageGenerationStatus}
        </div>
      ) : null}
    </aside>
  );
}

export function StoryboardWorkspace({
  project,
  initialSlides,
}: {
  project: ProjectView;
  initialSlides: SlideView[];
}) {
  const [compact, setCompact] = useState(false);
  const [slides, setSlides] = useState(initialSlides);
  const [selectedId, setSelectedId] = useState(initialSlides[0]?.id ?? null);
  const selectedSlide = useMemo(
    () => slides.find((slide) => slide.id === selectedId) ?? null,
    [slides, selectedId],
  );
  const grouped = useMemo(() => {
    return slides.reduce<Record<string, SlideView[]>>((acc, slide) => {
      acc[slide.sectionTitle] = [...(acc[slide.sectionTitle] ?? []), slide];
      return acc;
    }, {});
  }, [slides]);

  async function onDragEnd(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return;
    const oldIndex = slides.findIndex((slide) => slide.id === event.active.id);
    const newIndex = slides.findIndex((slide) => slide.id === event.over?.id);
    const ordered = arrayMove(slides, oldIndex, newIndex).map((slide, index) => ({
      ...slide,
      position: index + 1,
    }));
    setSlides(ordered);
    await fetch(`/api/projects/${project.id}/slides`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedSlideIds: ordered.map((slide) => slide.id) }),
    });
  }

  async function addBlank() {
    const form = new FormData();
    form.set("position", String(slides.length + 1));
    await fetch(`/api/projects/${project.id}/slides`, { method: "POST", body: form });
    window.location.reload();
  }

  if (project.status === "storyboard_generation_failed") {
    return <section className="rounded-md border border-red-300 bg-card p-5 text-red-800">Generation failed: {project.generationError}</section>;
  }

  if (project.status === "storyboard_generating") {
    return <section className="rounded-md border border-border bg-card p-5">Generating storyboard...</section>;
  }

  if (slides.length === 0) {
    return <section className="rounded-md border border-dashed border-border p-8 text-center text-muted-foreground">No slides yet. Generate the storyboard to start review.</section>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setCompact((value) => !value)}>
              <Layers3 className="size-4" aria-hidden="true" />
              {compact ? "Expanded" : "Compact"}
            </Button>
            <Button type="button" variant="outline" onClick={addBlank}>
              <Plus className="size-4" aria-hidden="true" />
              Blank slide
            </Button>
          </div>
          <Button type="button" disabled={project.status !== "storyboard_confirmed"}>
            <ImageIcon className="size-4" aria-hidden="true" />
            Generate image
          </Button>
        </div>
        {project.improvementSuggestions?.length ? (
          <details className="rounded-md border border-border bg-card p-4">
            <summary className="cursor-pointer font-semibold">Improvement suggestions</summary>
            <pre className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{JSON.stringify(project.improvementSuggestions, null, 2)}</pre>
          </details>
        ) : null}
        {project.targetSlideCountRationale ? (
          <p className="text-sm text-muted-foreground">{project.targetSlideCountRationale}</p>
        ) : null}
        <DndContext onDragEnd={onDragEnd}>
          <SortableContext items={slides.map((slide) => slide.id)}>
            <div className="grid gap-5">
              {Object.entries(grouped).map(([sectionTitle, sectionSlides]) => (
                <section key={sectionTitle} className="grid gap-3">
                  <h2 className="border-b border-border pb-2 text-sm font-semibold uppercase text-muted-foreground">{sectionTitle}</h2>
                  {sectionSlides.map((slide) => (
                    <SortableSlideCard
                      key={slide.id}
                      slide={slide}
                      compact={compact}
                      selected={slide.id === selectedId}
                      onSelect={() => setSelectedId(slide.id)}
                    />
                  ))}
                </section>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </section>
      <DetailPanel projectId={project.id} slide={selectedSlide} />
    </div>
  );
}
