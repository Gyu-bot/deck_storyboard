export const MAX_SLIDE_COUNT = 80;

export const slideCountModes = [
  "auto",
  "brief",
  "standard",
  "detailed",
  "custom",
] as const;

export type SlideCountMode = (typeof slideCountModes)[number];
export type SlideMarkerConfidence = "none" | "low" | "medium" | "high";

export type SlideCountPreference = {
  mode: SlideCountMode;
  minSlideCount: number | null;
  maxSlideCount: number | null;
  preferredSlideCount: number | null;
  storylineSlideMarkerCount: number | null;
  storylineSlideMarkerConfidence: SlideMarkerConfidence;
  targetSlideCountRationale: string | null;
};

const presetRanges: Record<
  Exclude<SlideCountMode, "auto" | "custom">,
  { min: number; max: number }
> = {
  brief: { min: 5, max: 8 },
  standard: { min: 9, max: 14 },
  detailed: { min: 15, max: 25 },
};

function midpoint(min: number, max: number) {
  return Math.ceil((min + max) / 2);
}

function parsePositiveInteger(value: unknown) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return null;
  return parsed;
}

function parseMode(value: unknown): SlideCountMode {
  return slideCountModes.includes(value as SlideCountMode)
    ? (value as SlideCountMode)
    : "standard";
}

export function detectStorylineSlideMarkers(storyline: string): {
  estimatedCount: number | null;
  confidence: SlideMarkerConfidence;
} {
  const numberedMarkers = Array.from(
    storyline.matchAll(/(?:^|\n)\s*(?:#{1,6}\s*)?(?:slide|page|슬라이드)\s*0?(\d{1,2})(?=[\s:.)-])/gi),
  )
    .map((match) => Number(match[1]))
    .filter((value) => Number.isInteger(value) && value > 0);

  if (numberedMarkers.length >= 2) {
    return {
      estimatedCount: Math.max(...numberedMarkers),
      confidence: "high",
    };
  }

  const countMarker = storyline.match(
    /(?:총|전체|약|around|about)?\s*(\d{1,2})\s*(?:페이지|page|pages|slides|슬라이드|장)/i,
  );
  if (countMarker) {
    return {
      estimatedCount: Number(countMarker[1]),
      confidence: "medium",
    };
  }

  const separatorCount = storyline.split(/\n\s*(?:---+|={3,})\s*\n/g).length;
  if (separatorCount >= 3) {
    return {
      estimatedCount: separatorCount,
      confidence: "low",
    };
  }

  return { estimatedCount: null, confidence: "none" };
}

function validateRange(min: number, max: number) {
  if (min < 1 || max < 1 || max > MAX_SLIDE_COUNT || max < min) {
    throw new Error(
      `Slide count range must be between 1-${MAX_SLIDE_COUNT}, and max must be greater than or equal to min.`,
    );
  }
}

export function buildSlideCountConflictNotice(
  preference: Pick<SlideCountPreference, "mode" | "minSlideCount" | "maxSlideCount">,
  marker: { estimatedCount: number | null; confidence: SlideMarkerConfidence },
) {
  if (
    preference.mode === "auto" ||
    !marker.estimatedCount ||
    marker.confidence === "none" ||
    marker.confidence === "low" ||
    !preference.minSlideCount ||
    !preference.maxSlideCount
  ) {
    return null;
  }

  if (
    marker.estimatedCount >= preference.minSlideCount &&
    marker.estimatedCount <= preference.maxSlideCount
  ) {
    return null;
  }

  return `스토리라인에서 약 ${marker.estimatedCount}장으로 보이는 marker를 감지했습니다. 선택한 범위 ${preference.minSlideCount}-${preference.maxSlideCount}장과 다를 수 있어 생성 결과의 slide count rationale을 확인하세요.`;
}

export function parseSlideCountPreference({
  mode,
  customMin,
  customMax,
  storyline,
}: {
  mode?: unknown;
  customMin?: unknown;
  customMax?: unknown;
  storyline: string;
}): SlideCountPreference {
  const parsedMode = parseMode(mode);
  const marker = detectStorylineSlideMarkers(storyline);

  if (parsedMode === "auto") {
    return {
      mode: "auto",
      minSlideCount: null,
      maxSlideCount: null,
      preferredSlideCount: null,
      storylineSlideMarkerCount: marker.estimatedCount,
      storylineSlideMarkerConfidence: marker.confidence,
      targetSlideCountRationale: null,
    };
  }

  const range =
    parsedMode === "custom"
      ? {
          min: parsePositiveInteger(customMin),
          max: parsePositiveInteger(customMax),
        }
      : presetRanges[parsedMode];

  if (!range.min || !range.max) {
    throw new Error(
      `Slide count range must be between 1-${MAX_SLIDE_COUNT}, and max must be greater than or equal to min.`,
    );
  }
  validateRange(range.min, range.max);

  const preference = {
    mode: parsedMode,
    minSlideCount: range.min,
    maxSlideCount: range.max,
    preferredSlideCount: midpoint(range.min, range.max),
    storylineSlideMarkerCount: marker.estimatedCount,
    storylineSlideMarkerConfidence: marker.confidence,
    targetSlideCountRationale: null,
  };

  return {
    ...preference,
    targetSlideCountRationale: buildSlideCountConflictNotice(preference, marker),
  };
}

export function defaultSlideCountPreference(): SlideCountPreference {
  return parseSlideCountPreference({
    mode: "standard",
    storyline: "",
  });
}

export function exactSlideCountPreference(
  targetSlideCount: number,
): SlideCountPreference {
  validateRange(targetSlideCount, targetSlideCount);
  return {
    mode: "custom",
    minSlideCount: targetSlideCount,
    maxSlideCount: targetSlideCount,
    preferredSlideCount: targetSlideCount,
    storylineSlideMarkerCount: null,
    storylineSlideMarkerConfidence: "none",
    targetSlideCountRationale: null,
  };
}

export function describeSlideCountPreferenceForPrompt(
  preference: Pick<
    SlideCountPreference,
    "mode" | "minSlideCount" | "maxSlideCount" | "preferredSlideCount"
  >,
) {
  if (preference.mode === "auto") {
    return "auto; do not force a min/max, choose the right count from storyline structure and density";
  }

  const preferred = preference.preferredSlideCount
    ? `, preferred ${preference.preferredSlideCount}`
    : "";
  return `${preference.mode} range ${preference.minSlideCount}-${preference.maxSlideCount} slides${preferred}`;
}
