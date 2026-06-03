import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import type { SlideCountMode, SlideMarkerConfidence } from "@/lib/projects/slide-count";

export const projectStatusValues = [
  "draft_input",
  "story_structure_ready",
  "storyboard_generating",
  "storyboard_review",
  "storyboard_confirmed",
  "storyboard_generation_failed",
] as const;

export const providerKeyValues = [
  "openrouter",
  "openai",
  "anthropic",
  "gemini",
] as const;

export const userRoleValues = ["member", "admin"] as const;

export const imageGenerationStatusValues = [
  "not_generated",
  "queued",
  "generating",
  "generated",
  "failed",
  "regeneration_recommended",
] as const;

export const editStateValues = ["aiGenerated", "userModified"] as const;

export type ProjectStatus = (typeof projectStatusValues)[number];
export type ProviderKey = (typeof providerKeyValues)[number];
export type UserRole = (typeof userRoleValues)[number];
export type ImageGenerationStatus =
  (typeof imageGenerationStatusValues)[number];
export type FieldEditState = (typeof editStateValues)[number];

export type SlideFieldEditState = {
  title: FieldEditState;
  coreMessage: FieldEditState;
  contentPoints: FieldEditState;
  visualDirection: FieldEditState;
  imagePrompt: FieldEditState;
  slideRole: FieldEditState;
};

export const defaultSlideFieldEditState: SlideFieldEditState = {
  title: "aiGenerated",
  coreMessage: "aiGenerated",
  contentPoints: "aiGenerated",
  visualDirection: "aiGenerated",
  imagePrompt: "aiGenerated",
  slideRole: "aiGenerated",
};

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").$type<UserRole>().notNull().default("member"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at"),
  },
  (table) => ({
    emailUnique: uniqueIndex("users_email_unique").on(table.email),
  }),
);

export const userApiKeys = sqliteTable(
  "user_api_keys",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    provider: text("provider").$type<ProviderKey>().notNull(),
    ciphertext: text("ciphertext").notNull(),
    iv: text("iv").notNull(),
    authTag: text("auth_tag").notNull(),
    maskedKey: text("masked_key").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at"),
  },
  (table) => ({
    userProviderUnique: uniqueIndex("user_api_keys_user_provider_unique").on(
      table.userId,
      table.provider,
    ),
  }),
);

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  storyline: text("storyline").notNull(),
  status: text("status").$type<ProjectStatus>().notNull().default("draft_input"),
  targetSlideCount: integer("target_slide_count").notNull().default(8),
  slideCountMode: text("slide_count_mode")
    .$type<SlideCountMode>()
    .notNull()
    .default("standard"),
  minSlideCount: integer("min_slide_count").default(9),
  maxSlideCount: integer("max_slide_count").default(14),
  preferredSlideCount: integer("preferred_slide_count").default(12),
  storylineSlideMarkerCount: integer("storyline_slide_marker_count"),
  storylineSlideMarkerConfidence: text("storyline_slide_marker_confidence")
    .$type<SlideMarkerConfidence>()
    .notNull()
    .default("none"),
  improvementSuggestionsEnabled: integer("improvement_suggestions_enabled", {
    mode: "boolean",
  })
    .notNull()
    .default(true),
  aspectRatio: text("aspect_ratio").$type<"16:9" | "4:3">().notNull().default("16:9"),
  defaultImageModel: text("default_image_model")
    .$type<"gpt-image-2" | "nano-banana">()
    .notNull()
    .default("gpt-image-2"),
  styleTemplate: text("style_template").notNull().default("Executive Consulting"),
  customCommonStylePrompt: text("custom_common_style_prompt").notNull().default(""),
  resolvedCommonPrompt: text("resolved_common_prompt").notNull().default(""),
  storyStructure: text("story_structure", { mode: "json" }).$type<unknown>(),
  improvementSuggestions: text("improvement_suggestions", {
    mode: "json",
  }).$type<unknown[]>(),
  targetSlideCountRationale: text("target_slide_count_rationale"),
  generationError: text("generation_error"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),
});

export const slides = sqliteTable("slides", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  sectionId: text("section_id").notNull(),
  sectionTitle: text("section_title").notNull(),
  position: integer("position").notNull(),
  title: text("title").notNull(),
  coreMessage: text("core_message").notNull(),
  contentPoints: text("content_points", { mode: "json" })
    .$type<string[]>()
    .notNull(),
  visualDirection: text("visual_direction").notNull(),
  imagePrompt: text("image_prompt").notNull(),
  slideRole: text("slide_role").notNull(),
  fieldEditState: text("field_edit_state", { mode: "json" })
    .$type<SlideFieldEditState>()
    .notNull(),
  imageGenerationStatus: text("image_generation_status")
    .$type<ImageGenerationStatus>()
    .notNull()
    .default("not_generated"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),
});

export const slideImageGenerations = sqliteTable("slide_image_generations", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  slideId: text("slide_id").references(() => slides.id),
  provider: text("provider").$type<"openai" | "gemini" | "local">().notNull(),
  model: text("model").notNull(),
  promptSnapshot: text("prompt_snapshot").notNull(),
  commonPromptSnapshot: text("common_prompt_snapshot").notNull().default(""),
  slidePromptSnapshot: text("slide_prompt_snapshot").notNull().default(""),
  storageKey: text("storage_key").notNull(),
  imageUrl: text("image_url").notNull(),
  status: text("status").$type<"succeeded" | "failed">().notNull(),
  errorMessage: text("error_message"),
  createdAt: text("created_at").notNull(),
  deletedAt: text("deleted_at"),
});

export const imageGenerationBatches = sqliteTable("image_generation_batches", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  status: text("status").$type<"queued" | "running" | "completed" | "failed">().notNull(),
  totalSlides: integer("total_slides").notNull(),
  completedSlides: integer("completed_slides").notNull().default(0),
  failedSlides: integer("failed_slides").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),
});

export const slideEditOperations = sqliteTable("slide_edit_operations", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  slideId: text("slide_id").references(() => slides.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  operationType: text("operation_type")
    .$type<"reorder" | "insert_blank" | "delete_slide" | "edit_field" | "confirm_storyboard">()
    .notNull(),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
  beforeSnapshot: text("before_snapshot", { mode: "json" }).$type<unknown>(),
  afterSnapshot: text("after_snapshot", { mode: "json" }).$type<unknown>(),
  createdAt: text("created_at").notNull(),
});

export const schema = {
  users,
  userApiKeys,
  projects,
  slides,
  slideImageGenerations,
  imageGenerationBatches,
  slideEditOperations,
};
