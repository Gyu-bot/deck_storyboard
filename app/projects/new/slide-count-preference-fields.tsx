"use client";

import { useState } from "react";
import { MAX_SLIDE_COUNT, type SlideCountMode } from "@/lib/projects/slide-count";

const slideCountOptions: Array<{
  value: SlideCountMode;
  label: string;
  help: string;
}> = [
  { value: "auto", label: "자동", help: "스토리 밀도 기준" },
  { value: "brief", label: "간단히", help: "5-8 slides" },
  { value: "standard", label: "표준", help: "9-14 slides" },
  { value: "detailed", label: "상세", help: "15-25 slides" },
  { value: "custom", label: "직접 범위", help: "min/max 입력" },
];

export function SlideCountPreferenceFields() {
  const [mode, setMode] = useState<SlideCountMode>("standard");

  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-medium">슬라이드 수 범위</legend>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {slideCountOptions.map((option) => (
          <label
            key={option.value}
            className="grid min-h-24 cursor-pointer gap-2 rounded-md border border-border bg-background p-3 text-sm"
          >
            <span className="flex items-center gap-2 font-medium">
              <input
                name="slideCountMode"
                type="radio"
                value={option.value}
                checked={mode === option.value}
                onChange={() => setMode(option.value)}
              />
              {option.label}
            </span>
            <span className="text-xs leading-5 text-muted-foreground">
              {option.help}
            </span>
          </label>
        ))}
      </div>
      {mode === "custom" ? (
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
            직접 범위를 선택한 경우에만 적용됩니다. 최소값은 1 이상,
            최대값은 최소값 이상이며 MVP 상한 {MAX_SLIDE_COUNT}장을 넘을 수 없습니다.
          </p>
        </div>
      ) : null}
    </fieldset>
  );
}
