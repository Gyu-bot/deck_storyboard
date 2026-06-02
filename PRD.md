# Deck Storyboard PRD

## 0. Document Status

- **Product name:** Deck Storyboard
- **Document type:** Product Requirements Document / Detailed MVP Spec
- **Primary user:** Internal consultants
- **MVP goal:** Turn an existing report/proposal storyline into a slide storyboard, then generate reference slide images in parallel for manual PPT creation.
- **Last updated:** 2026-06-02

---

## 1. Product Overview

Deck Storyboard is an internal web application for consultants who already have a detailed report or proposal storyline. The product uses AI to structure that storyline into a slide-by-slide storyboard, lets the user review and edit the slide flow in a vertical list UI, and then generates reference slide images that the consultant can use while manually creating the final PowerPoint deck.

Deck Storyboard is **not** a PPT auto-generation tool. It does not attempt to create editable PowerPoint slides or final client-ready PPTX files in the MVP.

The primary value is speed and exploration:

1. Convert a long consulting storyline into a structured slide plan.
2. Let the consultant review and adjust slide logic before spending image-generation cost.
3. Generate multiple reference slide concept images quickly in parallel.
4. Preserve generation history so the consultant can compare and select preferred visual directions.
5. Export storyboard notes and selected images for manual PPT production.

---

## 2. Problem Statement

Consultants often have a clear storyline for a report or proposal, but turning that storyline into slide-by-slide structure is time-consuming. Even after the logic is clear, creating visual directions for each slide takes additional time.

Existing AI presentation tools tend to focus on automatically creating complete presentations. That is not the immediate need here. For consulting work, the user usually wants to preserve control over logic, message hierarchy, and final PPT craft.

Deck Storyboard solves the upstream workflow:

- Break the storyline into slides.
- Clarify each slide's title, key message, content points, role, and visualization direction.
- Generate reference images to accelerate manual PPT design.

---

## 3. Target Users

### 3.1 Primary User

Internal consultants preparing:

- Client proposals
- Strategy reports
- Executive reporting decks
- Project kickoff decks
- Diagnostic reports
- Transformation roadmaps

### 3.2 User Assumptions

The user:

- Already has a fairly detailed storyline or draft narrative.
- Wants help structuring it into slide units.
- Wants reference images, not final editable slides.
- Will manually create the final PPT using the storyboard and generated image references.
- Values control over slide logic and message wording.

---

## 4. Product Positioning

Deck Storyboard should be positioned as:

> An AI slide storyboard builder for consultants, not an AI PPT generator.

### 4.1 In Scope

- Storyline input
- AI story structure analysis
- AI slide breakdown
- Optional storyline improvement suggestions
- Vertical slide storyboard UI
- Slide editing and ordering
- Section display
- User-modified field protection
- Individual and batch reference image generation
- GPT Image / OpenAI Images provider implementation
- Nano Banana image provider implementation
- Image generation history
- Markdown export
- Selected image ZIP export

### 4.2 Out of Scope for MVP

- Editable PPTX generation
- Final PPTX export
- PPT element-level editing
- PDF/Word/PPT import
- Real-time collaboration
- Team/workspace permissions
- OAuth/SSO
- Email verification
- Password reset
- Two-factor authentication
- Brand template library
- Chart data generation from raw data
- Speaker notes generation
- Slide animation
- AI reflow suggestion after reorder
- AI merge / AI split / AI insert for the initial MVP release

### 4.3 High-Priority Follow-up Scope

The following items are excluded from the initial MVP release, but should be treated as high-priority follow-up work after the core storyboard and image-generation workflow is usable:

- AI merge for adjacent slides
- AI split for one slide into multiple slides
- AI insert from natural-language instruction

---

## 5. Core User Journey

```text
1. User signs up and logs in.
2. User registers personal API keys.
3. User opens the project list.
4. User creates a new project.
5. User enters project name and full storyline.
6. User configures slide count mode.
7. User optionally enables storyline improvement suggestions.
8. User selects style template and adds custom common prompt.
9. User selects image aspect ratio and default image model.
10. User generates storyboard.
11. AI performs story structure analysis.
12. AI optionally produces improvement suggestions.
13. AI generates slide breakdown with image prompts.
14. User reviews the vertical storyboard.
15. User edits, reorders, inserts blank slides, manually splits slides, or deletes slides.
16. User confirms storyboard.
17. User generates images individually or in batch.
18. System generates images in parallel with controlled concurrency.
19. User compares image history and selects preferred image versions.
20. User exports storyboard markdown and selected images ZIP.
21. User manually creates final PPT using the exported materials.
```

---

## 6. Functional Requirements

## 6.1 Authentication

### FR-AUTH-001: User sign-up

The system shall allow a user to create an account with:

- Email
- Password
- Confirm password
- OpenRouter API key
- Optional image provider API keys

MVP excludes:

- Email verification
- Password reset
- OAuth
- SSO
- 2FA

### FR-AUTH-002: Login/logout

The system shall allow users to log in and log out.

### FR-AUTH-003: User-scoped projects

A user shall only access projects where `project.userId = currentUser.id`.

### FR-AUTH-004: Sessions

The system shall maintain login sessions via secure cookies.

Recommended implementation:

- Auth.js / NextAuth Credentials provider
- Password hashing with argon2 or bcrypt

---

## 6.2 API Key Management

### FR-KEY-001: User API keys

The system shall support user-level API keys for:

- OpenRouter
- Nano Banana image provider
- OpenAI Images / GPT Image provider

### FR-KEY-002: Encrypted storage

API keys shall be encrypted before storage in the database.

Recommended encryption:

- AES-GCM using Node `crypto`
- Encryption secret from server environment variable

Environment variable:

```env
API_KEY_ENCRYPTION_SECRET=...
```

### FR-KEY-003: No server fallback

If a user has not configured the required API key, the system shall not call the AI provider using a server-level fallback key.

### FR-KEY-004: Settings screen

The user shall be able to add, replace, and remove API keys from a personal Settings page.

### FR-KEY-005: Masked display

Stored API keys shall be displayed only in masked form.

Example:

```text
OpenRouter: sk-or-v1-••••••••••••abcd
```

### FR-KEY-006: Connection tests

Mandatory provider connection tests are not required for the initial MVP.

Settings may show whether a key is present, but shall not call providers automatically just to validate a key.

### FR-KEY-007: Key removal behavior

Removing an API key shall prevent new calls to that provider immediately.

Existing generated storyboard data, image history records, and stored image files shall remain available subject to normal project ownership rules.

---

## 6.3 Project List

### FR-PROJ-001: Project list page

After login, the user shall see a project list page.

The page shall support:

- New project
- Open project
- Rename project
- Delete project

### FR-PROJ-002: Sorting

Projects shall be sorted by `updatedAt` descending by default.

### FR-PROJ-003: Soft delete

Deleting a project shall set `deletedAt` instead of permanently deleting database records or image files.

Deleted projects shall not appear in the default project list.

---

## 6.4 New Project Creation

### FR-NEW-001: One-page creation form

Project creation shall use one page with collapsible option sections, not a multi-step wizard.

Required visible fields:

- Project name
- Storyline input

Collapsible sections:

- Slide count settings
- AI options
- Style settings
- Image settings

### FR-NEW-002: Storyline input

The user shall input the full report/proposal storyline as:

- Markdown
- Plain text
- Mixed structured/unstructured text

### FR-NEW-003: Slide count mode

The system shall support:

- Auto slide count
- Target slide count

Schema:

```ts
type SlideCountMode = "auto" | "target"
```

### FR-NEW-004: Optional improvement suggestions

The user shall be able to enable or disable storyline improvement suggestions.

Default: off.

### FR-NEW-005: Style template + custom prompt

The user shall select a style template and optionally enter a custom common style prompt.

### FR-NEW-006: Image settings

The user shall configure:

- Aspect ratio: `16:9` or `4:3`
- Default image model

Default aspect ratio: `16:9`.

---

## 6.5 Story Structure Analysis

### FR-AI-001: Two-stage AI workflow

Storyboard generation shall use two stages:

1. Story structure analysis
2. Slide breakdown

### FR-AI-002: Story structure output

The story structure analysis shall produce:

- Document purpose
- Overall thesis
- Sections
- Section role
- Section core message
- Source summary
- Suggested slide count per section

### FR-AI-003: Optional improvement suggestions

If enabled, storyline improvement suggestions shall be generated during the story structure analysis call in the MVP.

The suggestions shall be displayed separately and shall not be automatically applied.

Suggestion types:

- Logic gap
- Duplication
- Weak evidence
- Weak conclusion
- Structure issue
- Missing transition
- Overloaded section

### FR-AI-004: Structured output validation

All LLM outputs that enter the database shall be validated using JSON schema / Zod.

The default validation retry policy is:

1. Retry once or according to configured retry policy.
2. If still invalid, display an error and allow regeneration.

For the initial MVP:

- The invalid output shall not be saved as accepted storyboard data.
- The failed attempt may be recorded in operation/debug history with a validation error summary.
- The user shall see which generation stage failed: story structure analysis or slide breakdown.
- The user shall be able to retry without re-entering the project form.

### FR-AI-005: Storyline input limits

The MVP shall define a maximum accepted storyline size to avoid provider token-limit failures.

Default limit:

```env
MAX_STORYLINE_CHARACTERS=60000
```

If the input exceeds the configured limit, the system shall show a validation message before calling the LLM.

### FR-AI-006: Target slide count handling

If `slideCountMode = "target"`, the generated slide count should match `targetSlideCount` unless the LLM determines that the requested count would create unusable slides.

If the output count differs from the target, the story structure result shall include a short rationale that can be displayed to the user.

---

## 6.6 Slide Breakdown

### FR-SLIDE-001: Slide fields

Each generated slide shall include:

- id
- order
- sectionId
- sectionTitle
- title
- coreMessage
- contentPoints
- visualDirection
- imagePrompt
- slideRole

### FR-SLIDE-002: Image prompt generation timing

The slide-specific `imagePrompt` shall be generated during slide breakdown, before storyboard confirmation.

### FR-SLIDE-003: Section display

Sections shall be displayed lightly in the UI as headers or grouping labels.

MVP excludes complex section management features.

---

## 6.7 Storyboard Review UI

### FR-UI-001: Vertical list layout

The storyboard shall be displayed as a vertical list of slide cards.

### FR-UI-002: Compact/Expanded toggle

The user shall be able to toggle between compact and expanded card views.

Compact card displays:

- Slide number
- Section
- Title
- Core message summary
- Image generation status
- Selected thumbnail if available

Expanded card displays:

- Slide number
- Section
- Title
- Core message
- Content points
- Visual direction
- Slide role
- Image prompt preview
- Image generation status
- Selected thumbnail if available

### FR-UI-003: Side panel editing

Selecting a slide shall open or populate a right-side detail panel.

Side panel tabs:

- Content
- Prompt
- Images

### FR-UI-004: Improvement suggestion panel

If improvement suggestions exist, they shall be displayed in a collapsible panel above the storyboard list.

### FR-UI-005: Required UI states

The storyboard workspace shall handle the following states:

- Empty project before storyboard generation
- Storyboard generation in progress
- Storyboard generation failed
- Storyboard ready for review
- Storyboard confirmed
- Image generation in progress
- Image generation partially failed
- No selected slide

### FR-UI-006: Responsive behavior

The primary MVP target is desktop use.

For narrow screens, the side panel may collapse below the storyboard list or open as a drawer, but all core actions shall remain accessible.

---

## 6.8 Manual Slide Editing

### FR-EDIT-001: Field editing

The user shall be able to edit:

- Title
- Core message
- Content points
- Visual direction
- Image prompt
- Slide role

### FR-EDIT-002: User-modified field state

When the user edits a field, that field shall be marked as `userModified`.

### FR-EDIT-003: Reorder

The user shall be able to reorder slides using drag and drop.

MVP shall not include AI reflow suggestion after reorder.

### FR-EDIT-004: Add blank slide

The user shall be able to insert a blank slide.

### FR-EDIT-005: Delete slide

The user shall be able to delete a slide.

### FR-EDIT-006: Manual split

The user shall be able to manually split one slide into multiple slides by creating a new slide and editing fields.

---

## 6.9 AI Slide Editing

Initial MVP status: excluded. This section defines the high-priority follow-up requirements after the initial MVP release.

### FR-AIEDIT-001: AI merge

The user shall be able to merge adjacent slides using AI.

AI merge shall create a new compressed slide with:

- Title
- Core message
- Content points
- Visual direction
- Image prompt
- Slide role

### FR-AIEDIT-002: AI split

The user shall be able to split a slide into 2 or more slides using AI.

AI split shall generate each resulting slide with complete slide fields.

### FR-AIEDIT-003: AI insert

The user shall be able to insert a slide using natural language.

Example:

```text
Add one slide here that summarizes customer pain points.
```

### FR-AIEDIT-004: AI reflow suggestion excluded

AI reflow suggestion after reorder is explicitly out of scope for MVP.

### FR-AIEDIT-005: Immediate apply in follow-up

In the high-priority follow-up release, AI editing results shall be applied immediately, without preview/diff.

However, user-modified fields shall be protected where applicable.

### FR-AIEDIT-006: Operation history

AI editing operations shall be recorded in operation history with before/after snapshots when the follow-up feature is implemented.

### FR-AIEDIT-007: User-modified field protection

For AI merge, split, and insert follow-up features:

- AI merge may create a new compressed slide and replace the merged source slides, but operation history shall preserve before/after snapshots.
- AI split may replace the source slide with generated child slides.
- AI insert may create a new slide at the requested position.
- If an operation would overwrite an existing user-modified field on a retained slide, that field shall remain unchanged.
- If an operation creates a new slide, all fields may be AI-generated.
- A future preview/diff flow may relax immediate apply behavior, but it is not part of the initial follow-up requirement.

---

## 6.10 Storyboard Confirmation

### FR-CONFIRM-001: Confirmation required before image generation

The system shall require the user to confirm the storyboard before image generation.

Before confirmation, image generation buttons shall be disabled.

### FR-CONFIRM-002: Editing after confirmation

The user may edit slides after storyboard confirmation.

If a slide is edited after image generation, that slide should be marked as `regeneration_recommended`.

### FR-CONFIRM-003: Confirmation state behavior

Confirmation is a project-level gate for image generation.

- Confirming a storyboard changes the project status to `storyboard_confirmed`.
- Editing slides after confirmation does not unconfirm the project.
- Adding, deleting, reordering, or manually splitting slides after confirmation remains allowed.
- Newly added slides after confirmation start with image status `not_generated`.
- Edited slides with a previously selected/generated image become `regeneration_recommended`.

---

## 6.11 Image Generation

### FR-IMG-001: Reference images only

Generated slide images are concept references, not final deliverables.

Image text may be imperfect. The images are intended to guide:

- Layout
- Message hierarchy
- Visualization concept
- Visual style

### FR-IMG-002: Aspect ratio

The system shall support:

- `16:9`
- `4:3`

Default: `16:9`.

### FR-IMG-003: Provider interface

Image generation shall use a provider interface.

Initial MVP shall implement both image providers:

- Nano Banana
- GPT Image / OpenAI Images

Default model:

```env
DEFAULT_IMAGE_MODEL=gpt-image-2
```

If the selected provider key is missing, the system shall show a provider-key error and shall not fall back to another provider automatically.

### FR-IMG-004: Structured prompt

Image generation prompts shall be structured and detailed.

Prompt components:

- Aspect ratio
- Common style prompt
- Slide title
- Core message
- Content points
- Visual direction
- Slide role
- Instruction to include readable slide text
- Instruction to include useful visual elements such as diagrams, icons, charts, or images when helpful

MVP shall not include a global negative prompt / forbidden elements section.

### FR-IMG-005: Individual generation

The user shall be able to generate or regenerate an image for a single slide.

### FR-IMG-006: Batch generation

The user shall be able to generate images for multiple slides in parallel.

Batch target options:

- Not generated slides only
- All slides
- Regeneration recommended slides only

Default: Not generated slides only.

### FR-IMG-007: Batch model

Batch generation shall use the project default image model.

### FR-IMG-008: Parallelism

Batch image generation shall use limited parallelism.

Recommended default:

```env
IMAGE_GENERATION_CONCURRENCY=3
```

### FR-IMG-009: Failure retry

Image generation shall retry once on failure.

If retry fails:

- Save generation status as `failed`
- Save error message
- Allow user to retry manually

### FR-IMG-010: Regeneration selection behavior

When regeneration succeeds, the newly generated image shall be added to history but shall not automatically become the selected image.

The existing selected image shall remain selected until the user chooses another version.

### FR-IMG-011: No prompt confirmation in MVP

MVP shall not show a separate prompt preview/confirm modal before image generation.

### FR-IMG-012: Image status semantics

Slide image status shall be interpreted as:

- `not_generated`: no completed image exists for the slide.
- `generating`: at least one active generation is running for the slide.
- `generated`: at least one completed image exists and the current slide content does not require regeneration.
- `failed`: the latest attempted generation failed and no newer successful generation changed the status.
- `regeneration_recommended`: a selected/generated image exists, but slide content or prompt changed after generation.

### FR-IMG-013: Batch progress semantics

Batch generation shall track total, completed, failed, and remaining counts.

Batch status shall be:

- `running` while any target slide is still generating.
- `completed` when all target slides complete successfully.
- `partially_failed` when at least one target slide fails and at least one succeeds.
- `failed` when all target slides fail.

---

## 6.12 Image History

### FR-HIST-001: Generation history per slide

Each slide shall keep image generation history.

Stored per generation:

- Model
- Aspect ratio
- Common prompt snapshot
- Slide prompt snapshot
- Resolved prompt snapshot
- Image path/url
- Status
- Error message if failed
- Created/completed timestamps
- Selected flag

### FR-HIST-002: Side panel history

Image history shall be displayed in the slide side panel under the Images tab.

### FR-HIST-003: Select previous image

The user shall be able to select a previous completed image generation as the current selected image.

---

## 6.13 Export

### FR-EXP-001: Markdown export

The user shall be able to export a project storyboard as Markdown.

Markdown shall include:

- Project name
- Style settings
- Story structure summary
- Improvement suggestions if any
- Sections
- Slides with title, core message, content points, visual direction, image prompt, selected image path

### FR-EXP-002: Selected image ZIP export

The user shall be able to export a ZIP containing:

```text
deck-storyboard-export/
  storyboard.md
  images/
    slide-001.png
    slide-002.png
    slide-003.png
```

Only selected images shall be included.

MVP shall not export full image history.

### FR-EXP-003: Export edge cases

Markdown and ZIP export shall handle:

- Slides without selected images by leaving the selected image field blank or marking it as `Not selected`.
- Failed image generations by excluding failed image files from ZIP.
- Soft-deleted slides by excluding them from export.
- ZIP file names by using zero-padded slide order, such as `slide-001.png`.
- Duplicate or missing selected image paths by surfacing an export error instead of creating a misleading ZIP.
- Export content as a point-in-time snapshot of the project at export time.

---

## 7. Non-Functional Requirements

### NFR-001: Deployment

The app shall be deployable via Docker / Docker Compose.

### NFR-002: Persistence

SQLite database and generated images shall persist through Docker volumes.

Recommended path:

```text
/app/data/
  deck-storyboard.sqlite
  storage/
    projects/
      {projectId}/
        images/
```

### NFR-003: Local storage abstraction

Generated images shall be stored locally in MVP, but the implementation shall use a storage provider abstraction to allow future migration to S3-compatible storage.

### NFR-004: Security

- Passwords shall be hashed.
- API keys shall be encrypted.
- Users shall only access their own projects.
- Server default provider keys shall not be used.
- Local image URLs shall enforce project ownership before returning image content.
- Deleted projects and deleted slides shall not expose images through default UI or export flows.

### NFR-005: Reliability

- LLM output shall be schema-validated.
- Image generation failures shall be saved and visible.
- Batch generation shall track progress and failed count.
- Retry policies shall be deterministic and visible in implementation config.

### NFR-006: Performance

Batch image generation shall use limited concurrency to reduce wait time while avoiding provider rate-limit overload.

### NFR-007: API key encryption requirements

`API_KEY_ENCRYPTION_SECRET` shall be a server-only secret suitable for AES-GCM key derivation.

The application shall fail startup or disable key storage if the secret is missing in production.

API key display shall use provider-specific safe masking and shall never reveal the full decrypted value after storage.

---

## 8. Technical Stack

```text
Frontend/Backend: Next.js App Router + React + TypeScript
UI: Tailwind CSS + shadcn/ui
Auth: Auth.js / NextAuth Credentials
Password hashing: argon2 or bcrypt
Database: SQLite
ORM: Drizzle ORM
Drag and drop: dnd-kit
LLM provider: OpenRouter
Image generation: Provider interface + GPT Image / OpenAI Images + Nano Banana
Storage: Local filesystem with provider abstraction
Export: Markdown generation + ZIP archive
Deployment: Docker Compose
```

---

## 9. Suggested Routes / Screens

## 9.1 Auth Routes

```text
/signup
/login
/logout
/settings
```

### Sign-up

Fields:

- Email
- Password
- Confirm password
- OpenRouter API key
- Optional Nano Banana API key
- Optional OpenAI Images API key

### Settings

Fields/actions:

- Replace OpenRouter API key
- Replace Nano Banana API key
- Replace OpenAI Images API key
- Remove API keys
- Masked key display

---

## 9.2 Project Routes

```text
/projects
/projects/new
/projects/{projectId}
```

### `/projects`

Project list:

- New Project button
- Project cards/rows
- Rename
- Delete

### `/projects/new`

One-page project creation form.

### `/projects/{projectId}`

Storyboard workspace.

Layout:

```text
┌──────────────────────────────────────────────┐
│ Top bar: Project name / Status / Export       │
├──────────────────────────────┬───────────────┤
│ Storyboard list              │ Side panel    │
│                              │               │
│ [Suggestions collapsed]      │ [Content]     │
│ [Compact/Expanded toggle]    │ [Prompt]      │
│                              │ [Images]      │
│ [Section]                    │               │
│  Slide card 1                │               │
│  Slide card 2                │               │
│                              │               │
└──────────────────────────────┴───────────────┘
```

---

## 10. Data Model Draft

## 10.1 User

```ts
type User = {
  id: string
  email: string
  passwordHash: string
  createdAt: string
  updatedAt: string
}
```

## 10.2 UserApiKey

```ts
type ApiKeyProvider = "openrouter" | "nano_banana" | "openai_images"

type UserApiKey = {
  id: string
  userId: string
  provider: ApiKeyProvider
  encryptedValue: string
  iv: string
  authTag: string
  createdAt: string
  updatedAt: string
}
```

## 10.3 Project

```ts
type ProjectStatus =
  | "draft_input"
  | "storyboard_generating"
  | "storyboard_generation_failed"
  | "storyboard_review"
  | "storyboard_confirmed"

type Project = {
  id: string
  userId: string
  name: string
  status: ProjectStatus
  createdAt: string
  updatedAt: string
  deletedAt?: string

  sourceStoryline: string
  slideCountMode: "auto" | "target"
  targetSlideCount?: number

  improvementSuggestionsEnabled: boolean
  storyStructure?: StoryStructure
  improvementSuggestions?: StoryImprovementSuggestion[]

  style: ProjectStyle
  imageSettings: ProjectImageSettings
}
```

## 10.4 ProjectStyle

```ts
type ProjectStyle = {
  templateId: string
  customPrompt: string
  resolvedCommonPrompt: string
}
```

## 10.5 ProjectImageSettings

```ts
type ImageModel = "nano-banana" | "gpt-image-2"
type SlideAspectRatio = "16:9" | "4:3"

type ProjectImageSettings = {
  aspectRatio: SlideAspectRatio
  defaultModel: ImageModel
}
```

## 10.6 StoryStructure

```ts
type StoryStructure = {
  documentPurpose: string
  targetAudience?: string
  overallThesis: string
  sections: StorySection[]
}

type StorySection = {
  id: string
  order: number
  title: string
  role: string
  coreMessage: string
  sourceSummary: string
  suggestedSlideCount: number
}
```

## 10.7 StoryImprovementSuggestion

```ts
type StoryImprovementSuggestion = {
  id: string
  severity: "low" | "medium" | "high"
  type:
    | "logic_gap"
    | "duplication"
    | "weak_evidence"
    | "weak_conclusion"
    | "structure_issue"
    | "missing_transition"
    | "overloaded_section"
  title: string
  description: string
  suggestedAction: string
  relatedSectionIds?: string[]
  relatedSlideIds?: string[]
}
```

## 10.8 Slide

```ts
type Slide = {
  id: string
  projectId: string
  order: number
  sectionId?: string
  sectionTitle?: string

  title: string
  coreMessage: string
  contentPoints: string[]
  visualDirection: string
  imagePrompt: string
  slideRole: string

  fieldEditState: SlideFieldEditState
  imageGenerationStatus:
    | "not_generated"
    | "generating"
    | "generated"
    | "failed"
    | "regeneration_recommended"
  selectedImageGenerationId?: string

  createdAt: string
  updatedAt: string
  deletedAt?: string
}
```

## 10.9 SlideFieldEditState

```ts
type FieldEditState = "aiGenerated" | "userModified"

type SlideFieldEditState = {
  title: FieldEditState
  coreMessage: FieldEditState
  contentPoints: FieldEditState
  visualDirection: FieldEditState
  imagePrompt: FieldEditState
  slideRole: FieldEditState
}
```

## 10.9.1 Status Semantics

Project status tracks storyboard readiness only.

- Image generation progress is tracked by `Slide.imageGenerationStatus` and `ImageGenerationBatch`.
- A confirmed project can still contain slides with `not_generated`, `failed`, or `regeneration_recommended` image status.
- `storyboard_generation_failed` is used when the story structure or slide breakdown step fails before a valid storyboard is saved.
- Soft-deleted slides remain excluded from ordering, generation, and export.

## 10.10 SlideImageGeneration

```ts
type SlideImageGeneration = {
  id: string
  projectId: string
  slideId: string
  batchId?: string
  version: number

  model: ImageModel
  aspectRatio: SlideAspectRatio

  imageUrl?: string
  localPath?: string

  commonPromptSnapshot: string
  slidePromptSnapshot: string
  resolvedPromptSnapshot: string

  status: "generating" | "completed" | "failed"
  errorMessage?: string

  selected: boolean

  createdAt: string
  completedAt?: string
}
```

## 10.11 ImageGenerationBatch

```ts
type ImageGenerationBatch = {
  id: string
  projectId: string
  target:
    | "not_generated_only"
    | "all_slides"
    | "regeneration_recommended_only"
  model: ImageModel
  aspectRatio: SlideAspectRatio
  totalCount: number
  completedCount: number
  failedCount: number
  status: "running" | "completed" | "failed" | "partially_failed"
  createdAt: string
  completedAt?: string
}
```

## 10.12 SlideEditOperation

```ts
type SlideEditOperationType =
  | "reorder"
  | "merge"
  | "split"
  | "insert_blank"
  | "insert_ai"
  | "delete_slide"
  | "edit_field"
  | "generate_image"
  | "select_image_version"
  | "confirm_storyboard"


type SlideEditOperation = {
  id: string
  projectId: string
  userId: string
  type: SlideEditOperationType
  createdAt: string
  beforeSnapshot?: unknown
  afterSnapshot?: unknown
  metadata?: Record<string, unknown>
}
```

---

## 11. Provider Interfaces

## 11.1 LLM Provider

```ts
type LlmTaskType =
  | "story_structure"
  | "slide_breakdown"
  | "merge_slides"
  | "split_slide"
  | "insert_slide"
  | "image_prompt_generation"

interface LlmProvider {
  generateStructuredOutput<T>(input: {
    taskType: LlmTaskType
    systemPrompt: string
    userPrompt: string
    schemaName: string
    schema: unknown
    apiKey: string
  }): Promise<T>
}
```

Initial MVP requires `story_structure` and `slide_breakdown`.

`merge_slides`, `split_slide`, and `insert_slide` are reserved for Phase 5.

`image_prompt_generation` may be used only if implementation separates prompt generation from slide breakdown; otherwise image prompts are generated inside `slide_breakdown`.

MVP implementation:

```ts
class OpenRouterLlmProvider implements LlmProvider {}
```

MVP uses a fixed model from environment/config.

Example:

```env
OPENROUTER_MODEL=...
```

Future direction:

- High Quality / Balanced presets
- Function-level model routing

---

## 11.2 Image Generation Provider

```ts
type ImageGenerationInput = {
  prompt: string
  aspectRatio: "16:9" | "4:3"
  model: ImageModel
  apiKey: string
}

type ImageGenerationResult = {
  imageBytes?: Buffer
  imageUrl?: string
  mimeType: string
}

interface ImageGenerationProvider {
  generateSlideImage(input: ImageGenerationInput): Promise<ImageGenerationResult>
}
```

MVP:

- Implement provider interface.
- Implement GPT Image / OpenAI Images provider.
- Implement Nano Banana provider.
- Map `gpt-image-2` to the `openai_images` user API key.
- Map `nano-banana` to the `nano_banana` user API key.

---

## 11.3 Image Storage Provider

```ts
type SaveImageInput = {
  projectId: string
  slideId: string
  generationId: string
  imageBytes: Buffer
  mimeType: string
}

type SavedImage = {
  localPath: string
  imageUrl: string
}

interface ImageStorageProvider {
  saveImage(input: SaveImageInput): Promise<SavedImage>
  getImageUrl(localPath: string): string
}
```

MVP implementation:

```ts
class LocalImageStorageProvider implements ImageStorageProvider {}
```

Future:

```ts
class S3ImageStorageProvider implements ImageStorageProvider {}
```

---

## 12. Style Templates

MVP shall include a small set of style templates.

Recommended templates:

### 12.1 Executive Consulting

Clean executive consulting deck style. White background, navy/gray palette, strong hierarchy, clear title and key message, diagram-oriented composition.

### 12.2 Strategy Proposal

Proposal-oriented style emphasizing problem, approach, impact, roadmap, and decision logic.

### 12.3 Minimal White

High whitespace, clean typography, simple shapes/icons, low visual clutter.

### 12.4 Dark Executive

Dark background, high contrast, premium executive summary / conclusion feel.

### 12.5 Technical Architecture

Architecture diagrams, system layers, data flow, components, and technical proposal visuals.

Schema:

```ts
type StyleTemplate = {
  id: string
  name: string
  description: string
  basePrompt: string
}
```

---

## 13. Development Phases

Important: Deck Storyboard only becomes practically usable after Phase 4, because the core value includes reference image generation. Phases are implementation sequencing units, not separately useful product releases.

## Phase 1. Core Project + Auth

Goal: Build app shell, auth, persistence, and Docker foundation.

Scope:

- Next.js app setup
- Tailwind + shadcn/ui
- SQLite + Drizzle setup
- Auth.js Credentials auth
- Sign-up/login/logout
- Password hashing
- User API key encrypted storage
- Settings page
- Project list
- New project base form
- Soft delete project
- Dockerfile and docker-compose

Acceptance criteria:

- User can sign up, log in, and log out.
- User can store encrypted API keys.
- Stored API keys are encrypted in the database and displayed only in masked form.
- User can create, view, rename, and soft-delete projects.
- Soft-deleted projects disappear from the default project list.
- App runs via Docker Compose with persistent `/app/data` volume.

---

## Phase 2. Storyboard Generation

Goal: Generate a structured slide storyboard from a storyline.

Scope:

- OpenRouter LLM provider
- Zod schemas for structured output
- Story structure analysis
- Optional improvement suggestions generated in the same call
- Slide breakdown
- Style templates
- Project image settings
- Vertical storyboard list UI
- Section headers
- Compact/Expanded toggle
- Improvement suggestion collapsible panel
- Confirm storyboard

Acceptance criteria:

- User can enter storyline and generate storyboard.
- Storyboard contains sections and slides.
- Slides include all required fields.
- Target slide count mode is reflected in the generated output or a rationale is displayed when the count differs.
- Optional suggestions appear when enabled.
- Optional suggestions do not appear when disabled.
- Generated sections/slides are saved and rendered in the review UI.
- User can confirm storyboard.
- Invalid LLM output is caught, not accepted as storyboard data, and surfaced with the failed stage.

---

## Phase 3. Storyboard Editing

Goal: Let the consultant revise slide logic and content before image generation.

Scope:

- Drag and drop reorder
- Right-side slide detail panel
- Field editing
- User-modified field state
- Add blank slide
- Delete slide
- Manual split support
- Operation history

Explicitly excluded:

- AI reflow suggestion after reorder
- Diff/preview before applying AI edit results
- AI merge
- AI split
- AI insert
- Undo/redo UI

Acceptance criteria:

- User can edit slide fields.
- Edited fields are marked as `userModified`.
- User can reorder slides.
- User can insert/delete slides.
- User can manually split a slide.
- Editing after storyboard confirmation does not unconfirm the project.
- Operations are recorded with enough metadata to diagnose the change.

---

## Phase 4. Image Generation + Export

Goal: Generate reference slide images in parallel and export useful materials for manual PPT creation.

Scope:

- Image generation provider interface
- GPT Image / OpenAI Images provider implementation
- Nano Banana image provider implementation
- Local image storage provider
- Individual image generation/regeneration
- Batch image generation with limited concurrency
- Image generation batch records
- Retry once on failure
- Image history in side panel
- Select previous image version
- Markdown export
- Selected image ZIP export

Acceptance criteria:

- User can generate one slide image.
- User can regenerate a slide image without losing previous versions.
- User can choose either GPT Image / OpenAI Images or Nano Banana when the corresponding user API key is configured.
- Missing provider keys block generation for that provider without server fallback.
- User can batch-generate images in parallel.
- Batch generation shows progress/status.
- Failed generations are saved and can be retried.
- User can select a previous image version.
- User can export Markdown and selected images ZIP.
- Export excludes soft-deleted slides and failed/unselected images.

---

## Phase 5. High-Priority AI Slide Editing Follow-up

Goal: Add AI-assisted slide editing after the initial MVP proves the core storyboard and image-generation workflow.

Scope:

- AI merge for adjacent slides
- AI split for one slide into 2 or more slides
- AI insert from natural-language instruction
- User-modified field protection rules
- Operation history before/after snapshots

Explicitly excluded:

- AI reflow suggestion after reorder
- Preview/diff before applying AI edit results
- Undo/redo UI

Acceptance criteria:

- User can AI-merge adjacent slides and operation history preserves source/merged snapshots.
- User can AI-split a slide and each generated slide has complete slide fields.
- User can AI-insert a slide at a chosen position from natural language.
- AI operations do not overwrite retained user-modified fields.
- Invalid AI edit output is caught and surfaced.

---

## 14. MVP Risks and Mitigations

## 14.1 Image model text quality

Risk: Generated text inside images may be misspelled or visually distorted.

Mitigation:

- Treat images as references only.
- Keep slide text fields separate in storyboard.
- Prompt for readable text, but prioritize visual composition.

## 14.2 LLM structured output instability

Risk: Long storylines may produce invalid JSON.

Mitigation:

- Use Zod validation.
- Retry on schema failure.
- Split workflow into story structure and slide breakdown.

## 14.3 Editing scope creep

Risk: AI edit functions can become complex.

Mitigation:

- Initial MVP excludes AI merge/split/insert.
- AI merge/split/insert move to Phase 5 as high-priority follow-up work.
- Follow-up AI edits apply immediately and record operation history, but AI reflow suggestion remains deferred.

## 14.4 Batch image generation rate limits

Risk: Parallel generation may hit API rate limits.

Mitigation:

- Use configurable concurrency.
- Retry once.
- Save failed states.
- Allow retrying failed slides.

## 14.5 API key handling

Risk: User provider keys are sensitive.

Mitigation:

- Encrypt keys in DB.
- Do not use server fallback keys.
- Mask key display.

---

## 15. Open Questions / Future Decisions

These are intentionally deferred beyond MVP:

1. Should the app support team workspaces or project sharing?
2. Should deleted projects have a restore UI?
3. Should optional API key connection-test buttons be added after MVP?
4. Should AI edit results eventually use preview/diff before apply?
5. Should AI reflow suggestions support nearby vs entire deck analysis?
6. Should model routing evolve into High Quality / Balanced presets?
7. Should image history export support all versions?
8. Should storage migrate to S3/R2/MinIO?
9. Should PPTX wrapper/export be added later?
10. Should source import support PDF, Word, PPT, Notion, or Google Docs?

---

## 16. Success Criteria

MVP is successful if an internal consultant can:

1. Enter a full proposal/report storyline.
2. Generate a logical slide storyboard.
3. Edit slide titles, messages, contents, and visualization directions.
4. Confirm the storyboard.
5. Generate reference images for multiple slides in parallel.
6. Regenerate weak images and compare history.
7. Export markdown and selected images.
8. Use those materials to create the actual PPT faster than starting from a blank deck.

---

## 17. Appendix: Example Image Prompt Shape

```text
Create a 16:9 consulting-style presentation slide concept image.

This image is a reference for a consultant who will manually create the final PowerPoint slide. Prioritize useful slide composition, message hierarchy, and visualization concept.

Common style:
{resolvedCommonPrompt}

Slide title:
{title}

Core message:
{coreMessage}

Key content points:
- {contentPoint1}
- {contentPoint2}
- {contentPoint3}

Slide role in deck:
{slideRole}

Visual direction:
{visualDirection}

Include readable slide text based on the title, core message, and key points. Text accuracy is helpful but not critical; the main goal is to show a strong layout and visual direction.

Use appropriate visual elements such as diagrams, icons, charts, process flows, comparison layouts, or images when they help communicate the message.
```

---

## 18. Appendix: Example Export Markdown Shape

```markdown
# Deck Storyboard Export: {Project Name}

## Style

Template: Executive Consulting
Custom prompt: {customPrompt}
Aspect ratio: 16:9
Default image model: GPT Image

---

## Section 1. Proposal Background

### Slide 1. Quality issues repeat because root-cause tracing is slow

**Core Message**
Repeated quality issues are not caused by a lack of data, but by the absence of a traceable root-cause analysis structure.

**Content Points**
- Quality issues occur repeatedly across plants.
- Root-cause investigation depends heavily on manual experience.
- Process, equipment, and quality data are fragmented.

**Visual Direction**
Show a timeline from issue occurrence to delayed root-cause identification, with fragmented data sources creating bottlenecks.

**Image Prompt**
...

**Selected Image**
images/slide-001.png
```
