"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  DndContext,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertTriangle, GripVertical, Image as ImageIcon, Layers3, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProjectStatus } from "@/lib/db/schema";

const fieldStateLabels: Record<string, string> = {
  aiGenerated: "AI 생성",
  userModified: "사용자 수정",
};

const imageStatusLabels: Record<string, string> = {
  not_generated: "목업 없음",
  queued: "대기 중",
  generating: "생성 중",
  generated: "생성 완료",
  failed: "실패",
  regeneration_recommended: "재생성 권장",
};

function subscribeClientSnapshot() {
  return () => undefined;
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

function useClientReady() {
  return useSyncExternalStore(subscribeClientSnapshot, getClientSnapshot, getServerSnapshot);
}

function localizeGeneratedText(value: string) {
  return value
    .replace(/^Context$/i, "맥락")
    .replace(/^Strategy$/i, "전략")
    .replace(/^Execution$/i, "실행")
    .replace(/^Context slide (\d+)$/i, "맥락 슬라이드 $1")
    .replace(/^Strategy slide (\d+)$/i, "전략 슬라이드 $1")
    .replace(/^Execution slide (\d+)$/i, "실행 슬라이드 $1")
    .replace(/^Key implication from the storyline$/i, "스토리라인에서 도출한 핵심 시사점")
    .replace(/^Evidence or decision point to validate$/i, "검토가 필요한 근거 또는 의사결정 포인트")
    .replace(
      /^Generated (\d+) slides to match the requested target\.$/i,
      "요청한 목표에 맞춰 $1장의 슬라이드로 구성했습니다.",
    )
    .replace(
      /^Consulting-style layout with a strong headline and one primary visual\.$/i,
      "강한 헤드라인과 하나의 핵심 시각 요소를 중심으로 구성한 컨설팅형 레이아웃",
    )
    .replace(/^Set up the situation$/i, "상황과 문제를 정리")
    .replace(/^Frame the recommendation$/i, "권고 방향을 제시")
    .replace(/^Show the path$/i, "실행 경로를 구체화");
}

type ImprovementSuggestionView = {
  id: string;
  title: string;
  rationale: string;
};

function textField(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function normalizeImprovementSuggestion(
  suggestion: unknown,
  index: number,
): ImprovementSuggestionView {
  const fallbackId = `suggestion-${index + 1}`;
  const fallbackTitle = `개선 제안 ${index + 1}`;
  const fallbackRationale = "제안 근거가 제공되지 않았습니다.";

  if (typeof suggestion === "string") {
    return {
      id: fallbackId,
      title: textField(suggestion, fallbackTitle),
      rationale: fallbackRationale,
    };
  }

  if (suggestion && typeof suggestion === "object") {
    const record = suggestion as Record<string, unknown>;

    return {
      id: textField(record.id, fallbackId),
      title: textField(record.title, fallbackTitle),
      rationale: textField(record.rationale, fallbackRationale),
    };
  }

  return {
    id: fallbackId,
    title: fallbackTitle,
    rationale: fallbackRationale,
  };
}

type ProjectView = {
  id: string;
  name: string;
  status: ProjectStatus;
  improvementSuggestions: unknown[] | null;
  targetSlideCountRationale: string | null;
  generationError: string | null;
};

type SlideImageView = {
  id: string;
  imageUrl: string;
  provider: string;
  model: string;
  aspectRatio: "16:9" | "4:3";
  status: "succeeded" | "failed";
  selected: boolean;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
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
  imageUrl?: string | null;
  images?: SlideImageView[];
};

type ImageGenerationResponse = {
  generated: number;
  failed: number;
  error: string | null;
  images?: Array<SlideImageView & { slideId: string | null }>;
};

function SortableSlideCard({
  slide,
  compact,
  selected,
  onSelect,
  canGenerateMockup,
  generatingMockup,
  onGenerateMockup,
}: {
  slide: SlideView;
  compact: boolean;
  selected: boolean;
  onSelect: () => void;
  canGenerateMockup: boolean;
  generatingMockup: boolean;
  onGenerateMockup: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: slide.id });
  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`grid gap-3 rounded-md border p-4 shadow-sm ${selected ? "border-primary bg-secondary" : "border-border bg-card"}`}
    >
      <div className="flex items-start gap-3">
        <button className="mt-1 text-muted-foreground" {...attributes} {...listeners} type="button" aria-label="슬라이드 순서 변경">
          <GripVertical className="size-4" aria-hidden="true" />
        </button>
        <button className="flex-1 text-left" type="button" onClick={onSelect}>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium text-muted-foreground">슬라이드 {slide.position}</p>
            <span className="rounded-sm border border-border px-2 py-0.5 text-xs text-muted-foreground">
              {imageStatusLabels[slide.imageGenerationStatus] ?? slide.imageGenerationStatus}
            </span>
          </div>
          <h3 className="text-lg font-semibold leading-7">{localizeGeneratedText(slide.title)}</h3>
          {!compact ? <p className="mt-2 text-sm text-muted-foreground">{localizeGeneratedText(slide.coreMessage)}</p> : null}
        </button>
      </div>
      {!compact ? (
        <ul className="ml-7 list-disc text-sm text-muted-foreground">
          {slide.contentPoints.map((point) => <li key={point}>{localizeGeneratedText(point)}</li>)}
        </ul>
      ) : null}
      <div className="ml-7 flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canGenerateMockup || generatingMockup}
          aria-label={`슬라이드 ${slide.position} 목업 생성`}
          onClick={onGenerateMockup}
        >
          <ImageIcon className="size-4" aria-hidden="true" />
          {generatingMockup ? "생성 중" : "목업 생성"}
        </Button>
      </div>
    </article>
  );
}

function StaticSlideCard({
  slide,
  compact,
  selected,
  onSelect,
  canGenerateMockup,
  generatingMockup,
  onGenerateMockup,
}: {
  slide: SlideView;
  compact: boolean;
  selected: boolean;
  onSelect: () => void;
  canGenerateMockup: boolean;
  generatingMockup: boolean;
  onGenerateMockup: () => void;
}) {
  return (
    <article
      className={`grid gap-3 rounded-md border p-4 shadow-sm ${selected ? "border-primary bg-secondary" : "border-border bg-card"}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 text-muted-foreground" aria-hidden="true">
          <GripVertical className="size-4" />
        </div>
        <button className="flex-1 text-left" type="button" onClick={onSelect}>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium text-muted-foreground">슬라이드 {slide.position}</p>
            <span className="rounded-sm border border-border px-2 py-0.5 text-xs text-muted-foreground">
              {imageStatusLabels[slide.imageGenerationStatus] ?? slide.imageGenerationStatus}
            </span>
          </div>
          <h3 className="text-lg font-semibold leading-7">{localizeGeneratedText(slide.title)}</h3>
          {!compact ? <p className="mt-2 text-sm text-muted-foreground">{localizeGeneratedText(slide.coreMessage)}</p> : null}
        </button>
      </div>
      {!compact ? (
        <ul className="ml-7 list-disc text-sm text-muted-foreground">
          {slide.contentPoints.map((point) => <li key={point}>{localizeGeneratedText(point)}</li>)}
        </ul>
      ) : null}
      <div className="ml-7 flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canGenerateMockup || generatingMockup}
          aria-label={`슬라이드 ${slide.position} 목업 생성`}
          onClick={onGenerateMockup}
        >
          <ImageIcon className="size-4" aria-hidden="true" />
          {generatingMockup ? "생성 중" : "목업 생성"}
        </Button>
      </div>
    </article>
  );
}

function DetailPanel({
  projectId,
  slide,
  onSelectImage,
}: {
  projectId: string;
  slide: SlideView | null;
  onSelectImage: (slideId: string, image: SlideImageView) => void;
}) {
  const [tab, setTab] = useState<"content" | "prompt" | "images">("content");
  if (!slide) {
    return (
      <aside
        aria-label="선택 슬라이드 상세 편집 패널"
        className="self-start rounded-md border border-border bg-card p-5 lg:sticky lg:top-6"
      >
        <h2 className="text-lg font-semibold">선택된 슬라이드 없음</h2>
        <p className="mt-2 text-sm text-muted-foreground">왼쪽 목록에서 편집할 슬라이드를 선택하세요.</p>
      </aside>
    );
  }
  const selectedSlide = slide;
  const imageHistory = slide.images ?? [];
  const selectedImage = imageHistory.find((image) => image.selected) ?? null;
  const selectedImageUrl = imageHistory.length
    ? selectedImage?.imageUrl ?? null
    : slide.imageUrl ?? null;

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

  async function selectImage(imageId: string, selected = true) {
    const response = await fetch(`/api/projects/${projectId}/images/${imageId}`, {
      method: "PATCH",
      ...(selected
        ? {}
        : {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ selected: false }),
          }),
    });
    if (!response.ok) {
      if (projectId === "dev-storyboard-sample") {
        const localImage = imageHistory.find((image) => image.id === imageId);
        if (localImage) onSelectImage(selectedSlide.id, { ...localImage, selected });
      }
      return;
    }
    const image = (await response.json()) as SlideImageView & { slideId: string | null };
    if (image.slideId) onSelectImage(image.slideId, image);
  }

  function fieldRows(field: string) {
    if (field === "contentPoints") return 7;
    if (field === "coreMessage" || field === "visualDirection") return 5;
    return 2;
  }

  return (
    <aside
      aria-label="선택 슬라이드 상세 편집 패널"
      className="grid self-start overflow-hidden rounded-md border border-border bg-card shadow-sm lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:max-h-[calc(100vh-3rem)] lg:grid-rows-[auto_auto_minmax(0,1fr)]"
    >
      <div className="flex items-center justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">슬라이드 상세</p>
          <h2 className="truncate text-lg font-semibold">{localizeGeneratedText(slide.title)}</h2>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={deleteSlide}>
          <Trash2 className="size-4" aria-hidden="true" />
          삭제
        </Button>
      </div>
      <div className="mx-5 flex h-10 overflow-hidden rounded-md border border-border">
        {[
          ["content", "내용"],
          ["prompt", "프롬프트"],
          ["images", "목업"],
        ].map(([item, label]) => (
          <button
            key={item}
            type="button"
            className={`h-full flex-1 text-sm font-medium ${tab === item ? "bg-secondary" : ""}`}
            onClick={() => setTab(item as "content" | "prompt" | "images")}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        data-testid="storyboard-detail-scroll-area"
        className="min-h-0 overflow-y-auto overscroll-contain px-5 pb-5"
      >
        {tab === "content" ? (
          <div className="grid gap-3">
            {[
              ["title", "제목", localizeGeneratedText(slide.title)],
              ["coreMessage", "핵심 메시지", localizeGeneratedText(slide.coreMessage)],
              ["contentPoints", "본문 포인트", slide.contentPoints.map(localizeGeneratedText).join("\n")],
              ["visualDirection", "시각화 방향", localizeGeneratedText(slide.visualDirection)],
              ["slideRole", "슬라이드 역할", localizeGeneratedText(slide.slideRole)],
            ].map(([field, label, value]) => (
              <label key={`${field}-${slide.id}`} className="grid gap-2 text-sm font-medium">
                <span className="flex items-center justify-between gap-2">
                  {label}
                  <span className="text-xs text-muted-foreground">
                    {fieldStateLabels[slide.fieldEditState[field] ?? "aiGenerated"]}
                  </span>
                </span>
                <textarea
                  key={`${field}-content-${slide.id}`}
                  defaultValue={value}
                  rows={fieldRows(field)}
                  className="w-full rounded-md border border-border bg-background p-3 leading-6"
                  onBlur={(event) => saveField(field, event.currentTarget.value)}
                />
              </label>
            ))}
          </div>
        ) : null}
        {tab === "prompt" ? (
          <label className="grid gap-2 text-sm font-medium">
            <span className="flex items-center justify-between gap-2">
              슬라이드 목업 프롬프트
              <span className="text-xs text-muted-foreground">
                {fieldStateLabels[slide.fieldEditState.imagePrompt] ?? "AI 생성"}
              </span>
            </span>
            <textarea
              key={`imagePrompt-${slide.id}`}
              defaultValue={localizeGeneratedText(slide.imagePrompt)}
              rows={8}
              className="w-full rounded-md border border-border bg-background p-3 leading-6"
              onBlur={(event) => saveField("imagePrompt", event.currentTarget.value)}
            />
          </label>
        ) : null}
        {tab === "images" ? (
          <div className="grid gap-3">
            <section className="grid gap-2">
              <h3 className="text-sm font-semibold">선택된 목업</h3>
              {selectedImageUrl ? (
                <div className="overflow-hidden rounded-md border border-border bg-background">
                  <Image
                    src={selectedImageUrl}
                    alt={`${localizeGeneratedText(slide.title)} 선택 목업`}
                    width={960}
                    height={540}
                    unoptimized
                    className="aspect-video w-full object-contain"
                  />
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                  선택된 목업 이미지가 아직 없습니다.
                </div>
              )}
            </section>
            <p className="text-sm text-muted-foreground">
              현재 상태: {imageStatusLabels[slide.imageGenerationStatus] ?? slide.imageGenerationStatus}
            </p>
            <section className="grid gap-2">
              <h3 className="text-sm font-semibold">생성 이력</h3>
              {imageHistory.length ? (
                <ol className="grid gap-2">
                  {imageHistory.map((image) => (
                    <li
                      key={image.id || image.imageUrl}
                      className="grid gap-2 rounded-md border border-border bg-background p-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">
                            {image.provider} · {image.model} · {image.aspectRatio}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {image.status === "succeeded" ? "완료" : "실패"} ·{" "}
                            {new Date(image.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {image.selected ? (
                          <div className="flex items-center gap-2">
                            <span className="rounded-sm bg-secondary px-2 py-1 text-xs font-medium">
                              선택됨
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              aria-label={`목업 ${image.id} 선택 해제`}
                              onClick={() => selectImage(image.id, false)}
                            >
                              선택 해제
                            </Button>
                          </div>
                        ) : image.status === "succeeded" && image.id ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            aria-label={`목업 ${image.id} 선택`}
                            onClick={() => selectImage(image.id)}
                          >
                            선택
                          </Button>
                        ) : null}
                      </div>
                      {image.status === "succeeded" && image.imageUrl ? (
                        <Image
                          src={image.imageUrl}
                          alt={`${localizeGeneratedText(slide.title)} 이력 목업 ${image.id}`}
                          width={320}
                          height={180}
                          unoptimized
                          className="aspect-video w-full rounded-sm border border-border object-contain"
                        />
                      ) : null}
                      {image.errorMessage ? (
                        <p className="text-xs text-red-700">{image.errorMessage}</p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                  생성된 목업 이력이 아직 없습니다.
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>
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
  const clientReady = useClientReady();
  const [compact, setCompact] = useState(false);
  const [slides, setSlides] = useState(initialSlides);
  const [selectedId, setSelectedId] = useState(initialSlides[0]?.id ?? null);
  const [mockupGenerationPending, setMockupGenerationPending] = useState(false);
  const [generatingSlideIds, setGeneratingSlideIds] = useState<string[]>([]);
  const [mockupGenerationMessage, setMockupGenerationMessage] = useState<string | null>(null);
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

  function applySelectedImage(slideId: string, image: SlideImageView) {
    setSlides((currentSlides) =>
      currentSlides.map((slide) => {
        if (slide.id !== slideId) return slide;
        const images = [
          image,
          ...(slide.images ?? []).filter((candidate) => candidate.id !== image.id),
        ].map((candidate) => ({
          ...candidate,
          selected: image.selected
            ? candidate.id === image.id
            : candidate.id === image.id
              ? false
              : candidate.selected,
        }));
        return {
          ...slide,
          imageGenerationStatus: "generated",
          imageUrl: image.selected ? image.imageUrl : null,
          images,
        };
      }),
    );
  }

  async function generateMockups(slideId?: string) {
    setMockupGenerationPending(true);
    if (slideId) setGeneratingSlideIds((ids) => [...new Set([...ids, slideId])]);
    setMockupGenerationMessage(null);
    const form = new FormData();
    if (slideId) form.set("slideId", slideId);
    const response = await fetch(`/api/projects/${project.id}/images/generate`, {
      method: "POST",
      ...(slideId ? { body: form } : {}),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      setMockupGenerationMessage(payload?.error ?? "목업 생성에 실패했습니다.");
      setMockupGenerationPending(false);
      if (slideId) setGeneratingSlideIds((ids) => ids.filter((id) => id !== slideId));
      return;
    }
    const payload = (await response.json().catch(() => null)) as ImageGenerationResponse | null;
    const imageBySlideId = new Map(
      (payload?.images ?? [])
        .filter((image) => image.slideId)
        .map((image) => [image.slideId as string, image]),
    );
    setSlides((currentSlides) =>
      currentSlides.map((slide) => {
        const generatedImage = imageBySlideId.get(slide.id);
        const wasRequested = !slideId || slide.id === slideId;
        const generatedSelected =
          generatedImage?.selected ??
          (generatedImage ? !(slide.images ?? []).some((image) => image.selected) : false);
        const images = generatedImage
          ? [
              { ...generatedImage, selected: generatedSelected },
              ...(slide.images ?? []).filter((image) => image.id !== generatedImage.id),
            ].map((image) => ({
              ...image,
              selected: generatedSelected
                ? image.id === generatedImage.id
                : image.selected,
            }))
          : slide.images;
        const selectedImage = images?.find((image) => image.selected);
        return {
          ...slide,
          imageGenerationStatus:
            generatedImage || (wasRequested && !payload?.images?.length)
              ? "generated"
              : slide.imageGenerationStatus,
          imageUrl: selectedImage?.imageUrl ?? (generatedSelected ? generatedImage?.imageUrl : slide.imageUrl),
          images,
        };
      }),
    );
    setMockupGenerationMessage(
      slideId ? "선택한 슬라이드 목업 생성이 완료되었습니다." : "전체 슬라이드 목업 생성이 완료되었습니다.",
    );
    setMockupGenerationPending(false);
    if (slideId) setGeneratingSlideIds((ids) => ids.filter((id) => id !== slideId));
  }

  if (project.status === "storyboard_generation_failed") {
    return (
      <section
        role="alert"
        className="rounded-md border border-red-300 bg-red-50 p-5 text-red-900"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
              <h2 className="text-lg font-semibold">스토리보드 생성 실패</h2>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6">
              {project.generationError ?? "스토리보드 생성 중 오류가 발생했습니다."}
            </p>
            <p className="mt-1 text-xs text-red-800">
              필요한 provider key가 할당된 뒤 다시 생성할 수 있습니다.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/projects">프로젝트 목록</Link>
          </Button>
        </div>
      </section>
    );
  }

  if (project.status === "storyboard_generating") {
    return <section className="rounded-md border border-border bg-card p-5">스토리보드 생성 중...</section>;
  }

  if (slides.length === 0) {
    return <section className="rounded-md border border-dashed border-border p-8 text-center text-muted-foreground">아직 슬라이드가 없습니다. 스토리보드를 생성하면 검토를 시작할 수 있습니다.</section>;
  }

  return (
    <div
      data-testid="storyboard-workspace-layout"
      className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(480px,520px)] xl:grid-cols-[minmax(0,1fr)_minmax(520px,560px)]"
    >
      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setCompact((value) => !value)}>
              <Layers3 className="size-4" aria-hidden="true" />
              {compact ? "상세 보기" : "간단히 보기"}
            </Button>
            <Button type="button" variant="outline" onClick={addBlank}>
              <Plus className="size-4" aria-hidden="true" />
              빈 슬라이드 추가
            </Button>
          </div>
          <Button
            type="button"
            disabled={project.status !== "storyboard_confirmed" || mockupGenerationPending}
            onClick={() => generateMockups()}
          >
            <ImageIcon className="size-4" aria-hidden="true" />
            {mockupGenerationPending ? "생성 중" : "전체 슬라이드 목업 생성"}
          </Button>
        </div>
        {mockupGenerationMessage ? (
          <p className="rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
            {mockupGenerationMessage}
          </p>
        ) : null}
        {project.improvementSuggestions?.length ? (
          <details className="rounded-md border border-border bg-card p-4">
            <summary className="cursor-pointer font-semibold">스토리라인 개선 제안</summary>
            <ol className="mt-3 grid gap-3 text-sm">
              {project.improvementSuggestions.map((suggestion, index) => {
                const item = normalizeImprovementSuggestion(suggestion, index);

                return (
                  <li key={`${item.id}-${index}`} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
                    <h3 className="font-semibold text-foreground">{localizeGeneratedText(item.title)}</h3>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">제안 이유</p>
                    <p className="mt-1 leading-6 text-muted-foreground">{localizeGeneratedText(item.rationale)}</p>
                  </li>
                );
              })}
            </ol>
          </details>
        ) : null}
        {project.targetSlideCountRationale ? (
          <p className="text-sm text-muted-foreground">{localizeGeneratedText(project.targetSlideCountRationale)}</p>
        ) : null}
        {clientReady ? (
          <DndContext onDragEnd={onDragEnd}>
            <SortableContext items={slides.map((slide) => slide.id)}>
              <div className="grid gap-5">
                {Object.entries(grouped).map(([sectionTitle, sectionSlides]) => (
                  <section key={sectionTitle} className="grid gap-3">
                    <h2 className="border-b border-border pb-2 text-sm font-semibold text-muted-foreground">{localizeGeneratedText(sectionTitle)}</h2>
                    {sectionSlides.map((slide) => (
                      <SortableSlideCard
                        key={slide.id}
                        slide={slide}
                        compact={compact}
                        selected={slide.id === selectedId}
                        onSelect={() => setSelectedId(slide.id)}
                        canGenerateMockup={project.status === "storyboard_confirmed"}
                        generatingMockup={generatingSlideIds.includes(slide.id)}
                        onGenerateMockup={() => generateMockups(slide.id)}
                      />
                    ))}
                  </section>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="grid gap-5">
            {Object.entries(grouped).map(([sectionTitle, sectionSlides]) => (
              <section key={sectionTitle} className="grid gap-3">
                <h2 className="border-b border-border pb-2 text-sm font-semibold text-muted-foreground">{localizeGeneratedText(sectionTitle)}</h2>
                {sectionSlides.map((slide) => (
                  <StaticSlideCard
                    key={slide.id}
                    slide={slide}
                    compact={compact}
                    selected={slide.id === selectedId}
                    onSelect={() => setSelectedId(slide.id)}
                    canGenerateMockup={project.status === "storyboard_confirmed"}
                    generatingMockup={generatingSlideIds.includes(slide.id)}
                    onGenerateMockup={() => generateMockups(slide.id)}
                  />
                ))}
              </section>
            ))}
          </div>
        )}
      </section>
      <DetailPanel projectId={project.id} slide={selectedSlide} onSelectImage={applySelectedImage} />
    </div>
  );
}
