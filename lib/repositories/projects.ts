import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import type { createTestDatabase } from "@/lib/db/test-utils";
import {
  defaultSlideFieldEditState,
  projects,
  slideEditOperations,
  slides,
  users,
  type ImageGenerationStatus,
  type ProjectStatus,
  type SlideFieldEditState,
} from "@/lib/db/schema";
import {
  defaultSlideCountPreference,
  exactSlideCountPreference,
  type SlideCountMode,
  type SlideMarkerConfidence,
} from "@/lib/projects/slide-count";

type Db = ReturnType<typeof createTestDatabase>;

function now() {
  return new Date().toISOString();
}

export function ensureUser(db: Db, userId: string, email = `${userId}@example.com`) {
  const existing = db.select().from(users).where(eq(users.id, userId)).get();
  if (existing) return existing;
  const timestamp = now();
  const row = {
    id: userId,
    email,
    passwordHash: "test-password-hash",
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  };
  db.insert(users).values(row).run();
  return row;
}

export function createProjectForUser(
  db: Db,
  userId: string,
  input: {
    name: string;
    storyline: string;
    status?: ProjectStatus;
    targetSlideCount?: number;
    slideCountMode?: SlideCountMode;
    minSlideCount?: number | null;
    maxSlideCount?: number | null;
    preferredSlideCount?: number | null;
    storylineSlideMarkerCount?: number | null;
    storylineSlideMarkerConfidence?: SlideMarkerConfidence;
    targetSlideCountRationale?: string | null;
    improvementSuggestionsEnabled?: boolean;
    styleTemplate?: string;
    customCommonStylePrompt?: string;
    resolvedCommonPrompt?: string;
    aspectRatio?: "16:9" | "4:3";
    defaultImageModel?: "gpt-image-2" | "nano-banana";
  },
) {
  ensureUser(db, userId);
  const timestamp = now();
  const slidePreference =
    input.slideCountMode !== undefined
      ? {
          mode: input.slideCountMode,
          minSlideCount: input.minSlideCount ?? null,
          maxSlideCount: input.maxSlideCount ?? null,
          preferredSlideCount: input.preferredSlideCount ?? null,
          storylineSlideMarkerCount: input.storylineSlideMarkerCount ?? null,
          storylineSlideMarkerConfidence:
            input.storylineSlideMarkerConfidence ?? "none",
          targetSlideCountRationale: input.targetSlideCountRationale ?? null,
        }
      : input.targetSlideCount !== undefined
        ? exactSlideCountPreference(input.targetSlideCount)
        : defaultSlideCountPreference();
  const row = {
    id: randomUUID(),
    userId,
    name: input.name,
    storyline: input.storyline,
    status: input.status ?? "draft_input",
    targetSlideCount:
      input.targetSlideCount ??
      slidePreference.preferredSlideCount ??
      slidePreference.maxSlideCount ??
      12,
    slideCountMode: slidePreference.mode,
    minSlideCount: slidePreference.minSlideCount,
    maxSlideCount: slidePreference.maxSlideCount,
    preferredSlideCount: slidePreference.preferredSlideCount,
    storylineSlideMarkerCount: slidePreference.storylineSlideMarkerCount,
    storylineSlideMarkerConfidence:
      slidePreference.storylineSlideMarkerConfidence,
    improvementSuggestionsEnabled:
      input.improvementSuggestionsEnabled ?? true,
    aspectRatio: input.aspectRatio ?? "16:9",
    defaultImageModel: input.defaultImageModel ?? "gpt-image-2",
    styleTemplate: input.styleTemplate ?? "Executive Consulting",
    customCommonStylePrompt: input.customCommonStylePrompt ?? "",
    resolvedCommonPrompt: input.resolvedCommonPrompt ?? "",
    storyStructure: null,
    improvementSuggestions: null,
    targetSlideCountRationale: slidePreference.targetSlideCountRationale,
    generationError: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  };
  db.insert(projects).values(row).run();
  return row;
}

export function listProjectsForUser(db: Db, userId: string) {
  return db
    .select()
    .from(projects)
    .where(and(eq(projects.userId, userId), isNull(projects.deletedAt)))
    .orderBy(desc(projects.updatedAt))
    .all();
}

export function getProjectForUser(db: Db, projectId: string, userId: string) {
  return (
    db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.userId, userId),
          isNull(projects.deletedAt),
        ),
      )
      .get() ?? null
  );
}

export function updateProjectForUser(
  db: Db,
  projectId: string,
  userId: string,
  values: Partial<typeof projects.$inferInsert>,
) {
  if (!getProjectForUser(db, projectId, userId)) return null;
  db.update(projects)
    .set({ ...values, updatedAt: now() })
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .run();
  return getProjectForUser(db, projectId, userId);
}

export function softDeleteProjectForUser(db: Db, projectId: string, userId: string) {
  return updateProjectForUser(db, projectId, userId, { deletedAt: now() });
}

export function createSlideForProject(
  db: Db,
  projectId: string,
  userId: string,
  input: Partial<typeof slides.$inferInsert> & { title: string },
) {
  const project = getProjectForUser(db, projectId, userId);
  if (!project) throw new Error("project not found");
  const timestamp = now();
  const position =
    input.position ??
    getSlidesForProject(db, projectId, userId).reduce(
      (max, slide) => Math.max(max, slide.position),
      0,
    ) + 1;
  const row = {
    id: input.id ?? randomUUID(),
    projectId,
    sectionId: input.sectionId ?? "manual",
    sectionTitle: input.sectionTitle ?? "Manual",
    position,
    title: input.title,
    coreMessage: input.coreMessage ?? "",
    contentPoints: input.contentPoints ?? [],
    visualDirection: input.visualDirection ?? "",
    imagePrompt: input.imagePrompt ?? "",
    slideRole: input.slideRole ?? "Manual slide",
    fieldEditState:
      (input.fieldEditState as SlideFieldEditState | undefined) ??
      defaultSlideFieldEditState,
    imageGenerationStatus:
      (input.imageGenerationStatus as ImageGenerationStatus | undefined) ??
      "not_generated",
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  };
  db.insert(slides).values(row).run();
  return row;
}

export function getSlidesForProject(db: Db, projectId: string, userId: string) {
  if (!getProjectForUser(db, projectId, userId)) return [];
  return db
    .select()
    .from(slides)
    .where(and(eq(slides.projectId, projectId), isNull(slides.deletedAt)))
    .orderBy(asc(slides.position))
    .all();
}

export function updateSlideForProject(
  db: Db,
  projectId: string,
  userId: string,
  slideId: string,
  values: Partial<typeof slides.$inferInsert>,
) {
  if (!getProjectForUser(db, projectId, userId)) return null;
  const before = db
    .select()
    .from(slides)
    .where(and(eq(slides.id, slideId), eq(slides.projectId, projectId)))
    .get();
  if (!before || before.deletedAt) return null;
  db.update(slides)
    .set({ ...values, updatedAt: now() })
    .where(and(eq(slides.id, slideId), eq(slides.projectId, projectId)))
    .run();
  const after = db
    .select()
    .from(slides)
    .where(and(eq(slides.id, slideId), eq(slides.projectId, projectId)))
    .get();
  recordSlideOperation(db, {
    projectId,
    slideId,
    userId,
    operationType: "edit_field",
    metadata: { fields: Object.keys(values) },
    beforeSnapshot: before,
    afterSnapshot: after,
  });
  return after ?? null;
}

export function updateSlideFieldForProject(
  db: Db,
  projectId: string,
  userId: string,
  slideId: string,
  field:
    | "title"
    | "coreMessage"
    | "contentPoints"
    | "visualDirection"
    | "imagePrompt"
    | "slideRole",
  value: string | string[],
) {
  const before = db
    .select()
    .from(slides)
    .where(and(eq(slides.id, slideId), eq(slides.projectId, projectId)))
    .get();
  if (!before) return null;
  const fieldEditState = { ...before.fieldEditState, [field]: "userModified" as const };
  const imageGenerationStatus =
    before.imageGenerationStatus === "generated"
      ? "regeneration_recommended"
      : before.imageGenerationStatus;
  return updateSlideForProject(db, projectId, userId, slideId, {
    [field]: value,
    fieldEditState,
    imageGenerationStatus,
  });
}

export function insertBlankSlideForProject(
  db: Db,
  projectId: string,
  userId: string,
  position: number,
) {
  const current = getSlidesForProject(db, projectId, userId);
  for (const slide of current) {
    if (slide.position >= position) {
      db.update(slides)
        .set({ position: slide.position + 1, updatedAt: now() })
        .where(eq(slides.id, slide.id))
        .run();
    }
  }
  const blank = createSlideForProject(db, projectId, userId, {
    sectionId: "manual",
    sectionTitle: "Manual",
    position,
    title: "Blank slide",
    coreMessage: "",
    contentPoints: [],
    visualDirection: "",
    imagePrompt: "",
    slideRole: "Manual split",
    fieldEditState: {
      title: "userModified",
      coreMessage: "userModified",
      contentPoints: "userModified",
      visualDirection: "userModified",
      imagePrompt: "userModified",
      slideRole: "userModified",
    },
    imageGenerationStatus: "not_generated",
  });
  recordSlideOperation(db, {
    projectId,
    slideId: blank.id,
    userId,
    operationType: "insert_blank",
    metadata: { position },
    afterSnapshot: blank,
  });
  return blank;
}

export function softDeleteSlideForProject(
  db: Db,
  projectId: string,
  userId: string,
  slideId: string,
) {
  if (!getProjectForUser(db, projectId, userId)) return null;
  db.update(slides)
    .set({ deletedAt: now(), updatedAt: now() })
    .where(and(eq(slides.id, slideId), eq(slides.projectId, projectId)))
    .run();
  recordSlideOperation(db, {
    projectId,
    slideId,
    userId,
    operationType: "delete_slide",
    metadata: { slideId },
  });
}

export function reorderSlidesForProject(
  db: Db,
  projectId: string,
  userId: string,
  orderedSlideIds: string[],
) {
  if (!getProjectForUser(db, projectId, userId)) return [];
  orderedSlideIds.forEach((slideId, index) => {
    db.update(slides)
      .set({ position: index + 1, updatedAt: now() })
      .where(and(eq(slides.id, slideId), eq(slides.projectId, projectId)))
      .run();
  });
  recordSlideOperation(db, {
    projectId,
    userId,
    operationType: "reorder",
    metadata: { orderedSlideIds },
  });
  return getSlidesForProject(db, projectId, userId);
}

export function recordSlideOperation(
  db: Db,
  input: {
    projectId: string;
    userId: string;
    operationType:
      | "reorder"
      | "insert_blank"
      | "delete_slide"
      | "edit_field"
      | "confirm_storyboard";
    slideId?: string;
    metadata: Record<string, unknown>;
    beforeSnapshot?: unknown;
    afterSnapshot?: unknown;
  },
) {
  db.insert(slideEditOperations)
    .values({
      id: randomUUID(),
      projectId: input.projectId,
      slideId: input.slideId ?? null,
      userId: input.userId,
      operationType: input.operationType,
      metadata: input.metadata,
      beforeSnapshot: input.beforeSnapshot ?? null,
      afterSnapshot: input.afterSnapshot ?? null,
      createdAt: now(),
    })
    .run();
}
