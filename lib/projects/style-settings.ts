export const MAX_STORYLINE_CHARACTERS = 60000;

export const styleTemplates = {
  "Executive Consulting":
    "Executive Consulting: crisp consulting narrative, restrained palette, strong headline hierarchy, boardroom-ready charts.",
  "Strategy Proposal":
    "Strategy Proposal: persuasive recommendation flow, opportunity framing, clear trade-off visuals, confident executive tone.",
  "Minimal White":
    "Minimal White: white canvas, generous spacing, thin dividers, minimal accent color, calm analytical visuals.",
  "Dark Executive":
    "Dark Executive: dark background, luminous data accents, high-contrast executive summary style.",
  "Technical Architecture":
    "Technical Architecture: system diagrams, architecture layers, dependency maps, precise labels, engineering clarity.",
} as const;

export type StyleTemplateName = keyof typeof styleTemplates;

export function validateStorylineLength(storyline: string) {
  if (storyline.length > MAX_STORYLINE_CHARACTERS) {
    return `Storyline must be ${MAX_STORYLINE_CHARACTERS} characters or fewer.`;
  }
  return null;
}

export function resolveCommonStylePrompt(
  templateName: StyleTemplateName,
  customPrompt = "",
) {
  return [styleTemplates[templateName], customPrompt.trim()]
    .filter(Boolean)
    .join("\n\nCustom common style prompt: ");
}

export function parseStyleTemplate(value: FormDataEntryValue | null): StyleTemplateName {
  const name = String(value ?? "Executive Consulting");
  return Object.prototype.hasOwnProperty.call(styleTemplates, name)
    ? (name as StyleTemplateName)
    : "Executive Consulting";
}
