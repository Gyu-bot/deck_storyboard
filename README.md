# Deck Storyboard

[한국어 README](README_KO.md)

Deck Storyboard turns a free-form proposal or report storyline into a reviewable slide storyboard, then uses confirmed slide content to generate reference slide images.

## Product Purpose

Deck Storyboard is for people who already have the rough storyline of a presentation, proposal, report, or consulting deck and need help turning that storyline into a clearer slide-by-slide structure.

It is not meant to produce a final, client-ready PowerPoint deck. The intended output is an early skeleton deck reference: a structured storyboard, slide titles, core messages, content points, visual directions, and optional reference images that can guide a human deck-building process.

> [!CAUTION]
> Deck Storyboard cannot create a finished deck. Its output is reference material only, intended to help humans draft and refine the final presentation.

Use it when you want to move from "I know the story I need to tell" to "I have a reviewable slide plan and visual references." The final layout, copy polish, client branding, and presentation craft remain human-owned.

The core product flow is:

1. A user enters a free-form storyline and project settings.
2. An LLM normalizes the storyline into a structured deck story.
3. The app creates or requests slide-level objects that match the storyboard schema.
4. The user reviews, edits, reorders, and confirms the storyboard.
5. The app combines project style settings and slide-level prompts.
6. An image generation provider creates reference images for each confirmed slide.

## Storyboard Object Contract

Each generated slide is represented by a structured object before it is persisted:

```ts
type SlideBreakdown = {
  sectionId: string;
  sectionTitle: string;
  title: string;
  coreMessage: string;
  contentPoints: string[];
  visualDirection: string;
  imagePrompt: string;
  slideRole: string;
};
```

The full storyboard response also includes the document-level structure:

```ts
type StoryboardResponse = {
  documentPurpose: string;
  overallThesis: string;
  sections: StorySection[];
  improvementSuggestions?: StoryImprovementSuggestion[];
  targetSlideCountRationale?: string;
  slides?: SlideBreakdown[];
};
```

The LLM never writes directly to the database. Its output is first validated against the structured schema. Only validated slide objects are persisted as slide records.

## LLM Calls and Prompt Structure

The current implementation has two possible storyboard LLM calls and one image generation call per requested slide.

### 1. `story_structure` LLM call

This call receives the project storyline and slide count policy.

The OpenRouter Chat Completions request uses:

- System message: a senior presentation strategist instruction.
- User message assembled by `buildStoryboardPrompt`.
- Strict JSON schema response format: `storyboardResponseJsonSchema`.
- Task value: `story_structure`.

The user prompt body currently includes:

```text
task: story_structure
slideCountPolicy:
{
  "mode": "auto | brief | standard | detailed | custom_range",
  "userSelectedRange": { "minSlideCount": number, "maxSlideCount": number } | null,
  "preferredSlideCount": number | null,
  "heuristicMarker": {
    "estimatedCount": number | null,
    "confidence": "none | low | medium | high"
  },
  "existingRationale": string | null
}
includeSuggestions: true | false

<task guidance>
<slide count policy rules>
<JSON-only / language / consulting-storyboard instructions>

User storyline:
<raw project storyline>
```

The expected structured output is a `StoryboardResponse`:

```json
{
  "documentPurpose": "...",
  "overallThesis": "...",
  "sections": [
    {
      "id": "...",
      "title": "...",
      "role": "...",
      "coreMessage": "...",
      "sourceSummary": "...",
      "suggestedSlideCount": 3
    }
  ],
  "improvementSuggestions": null,
  "targetSlideCountRationale": null,
  "slides": null
}
```

If this response includes schema-valid `slides[]`, the app can skip the second LLM call and persist those slides directly. Otherwise, the app stores the story structure on the project and uses it as context for `slide_breakdown`.

### 2. `slide_breakdown` LLM call

This call is used when `story_structure` did not return complete slide objects.

The request uses the same strict `StoryboardResponse` schema, the same storyline, and the same slide count policy. It also appends:

```text
Previous story structure JSON:
<validated StoryboardResponse from story_structure>
```

The expected response is still a `StoryboardResponse`, but this time `slides[]` should be populated:

```json
{
  "documentPurpose": "...",
  "overallThesis": "...",
  "sections": [{ "...": "..." }],
  "improvementSuggestions": null,
  "targetSlideCountRationale": "Generated slides to match the selected range.",
  "slides": [
    {
      "sectionId": "...",
      "sectionTitle": "...",
      "title": "...",
      "coreMessage": "...",
      "contentPoints": ["...", "..."],
      "visualDirection": "...",
      "imagePrompt": "...",
      "slideRole": "..."
    }
  ]
}
```

After schema validation, each `slides[]` item is persisted as a slide record. The persisted fields become the storyboard review UI fields: title, core message, content points, visual direction, image prompt, and slide role.

### 3. Image generation prompt assembly

When a confirmed slide requests an image, the app currently builds the provider prompt from:

```text
<project.resolvedCommonPrompt>

Slide title: <slide.title>

<slide.imagePrompt>
```

`project.resolvedCommonPrompt` is created when the project is created:

```text
<selected style template prompt>

Custom common style prompt: <custom project style prompt>
```

The image provider input then includes:

```ts
{
  apiKey,
  model: project.defaultImageModel,
  aspectRatio: project.aspectRatio,
  prompt: resolvedPrompt
}
```

The generated image result is stored in local storage, and a `slide_image_generations` history record stores the provider, model, aspect ratio, status, selected flag, error message, and prompt snapshots.

Current implementation note: `visualDirection`, `coreMessage`, and `contentPoints` are not directly included in the final image prompt unless the LLM already folded that information into `slide.imagePrompt`. Follow-up prompt assembly work should make this relationship explicit.

## LLM and Image Generation Workflow

The production-oriented design uses a hybrid LLM flow. It prefers a two-step path for messy real-world input, while allowing the second LLM call to be skipped when the first result already contains valid slide objects.

```mermaid
flowchart TD
  A["User<br/>Free-form storyline"] --> B["App<br/>Create project draft"]
  B --> C["Validate input<br/>required fields, length, user API keys"]

  C --> D["LLM call #1<br/>story_structure"]
  D --> E["Structured story output<br/>documentPurpose<br/>overallThesis<br/>sections<br/>suggestions<br/>optional slides[]"]
  E --> F["Schema validation<br/>storyboardResponseSchema"]

  F --> G{"slides[] exists<br/>and passes quality gate?"}

  G -- "Yes" --> H["Use slides[] from<br/>story_structure result"]
  G -- "No" --> I["LLM call #2<br/>slide_breakdown"]
  I --> J["SlideBreakdown[] output"]
  J --> K["Schema validation<br/>slideBreakdownSchema"]

  H --> L["Persist slide objects"]
  K --> L

  L --> M["Storyboard review UI<br/>edit fields, reorder, add/delete slides"]
  M --> N{"User confirms<br/>storyboard?"}
  N -- "No" --> M
  N -- "Yes" --> O["Confirmed storyboard"]

  O --> P["Build resolved image prompt<br/>project style prompt<br/>+ slide title<br/>+ slide imagePrompt"]
  P --> Q["Image model call<br/>OpenAI Images or Nano Banana"]
  Q --> R["Store image output<br/>local storage + generation history"]
  R --> S["User selects, regenerates,<br/>or exports storyboard assets"]
```

## Detailed Sequence

```mermaid
sequenceDiagram
  participant U as User
  participant App as App
  participant LLM as LLM Provider
  participant DB as Database
  participant IMG as Image Provider
  participant FS as Local Storage

  U->>App: Enter storyline and project settings
  App->>DB: Save draft project
  App->>LLM: story_structure request
  LLM-->>App: StoryboardResponse with sections and optional slides[]
  App->>App: Validate StoryboardResponse

  alt Valid slides[] returned by first call
    App->>App: Accept slides[] from story_structure
  else Missing or insufficient slides[]
    App->>LLM: slide_breakdown request using story structure
    LLM-->>App: SlideBreakdown[] response
    App->>App: Validate SlideBreakdown[]
  end

  App->>DB: Persist slide objects
  U->>App: Review, edit, reorder, add, delete slides
  App->>DB: Save user edits and operation history
  U->>App: Confirm storyboard
  App->>DB: Mark project storyboard_confirmed

  App->>App: Resolve image prompt per slide
  App->>IMG: Generate slide image
  IMG-->>App: Image bytes or image URL
  App->>FS: Store generated image
  App->>DB: Save generation history and selected image state
```

## Why Two LLM Steps Exist

Real user input is often less structured than a prepared slide canvas. It may be a long memo, rough bullets, a meeting transcript, or pasted notes. Splitting the reasoning into two possible LLM tasks improves control:

- `story_structure` focuses on understanding the deck purpose, audience, thesis, sections, gaps, and narrative flow.
- `slide_breakdown` focuses on producing complete slide objects with titles, messages, content points, visual direction, and image prompts.

The second call is not mandatory. If `story_structure` already returns valid, high-quality `slides[]`, the app can skip `slide_breakdown` and persist those slide objects directly.

Development mode seeds two local accounts when the app opens the database:

| Role | Login ID | Password |
|---|---|---|
| User | `test` | `test` |
| Admin placeholder | `admin` | `admin` |

The current auth schema is still email-based internally, so these short IDs map to `test@example.local` and `admin@example.local`. Full admin roles and the admin management screen are tracked separately in `IMPLEMENTATION_PLAN.md`.
