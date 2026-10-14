import { getLocalizedField } from "@lib/i18n/metadata"

/**
 * SEO copy for a product category, edited in the Medusa admin as category
 * metadata (category → Metadata):
 *
 *   seo_title        <title>, used as-is (include the brand if wanted)
 *   seo_description  <meta name="description">, ~150 characters
 *   seo_text         the text shown under the product grid; blank lines
 *                    separate paragraphs
 *
 * Each value is either plain text or one text per language, as JSON:
 *   {"en": "Artificial olive trees", "hu-HU": "Mű olajfák", "de-AT": "…", "de-DE": "…"}
 *
 * Only product translations are enabled in the backend, so the category's own
 * `description` field is not translated. It is used for the text under the
 * grid when `seo_text` is missing.
 */
export type CategorySeo = {
  title?: string
  description?: string
  text?: string
}

type CategoryLike = {
  description?: string | null
  metadata?: Record<string, unknown> | null
}

const asText = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

export function getCategorySeo(
  category: CategoryLike,
  locale: string
): CategorySeo {
  const field = (key: string) =>
    asText(getLocalizedField(category.metadata, key, locale))

  return {
    title: field("seo_title"),
    description: field("seo_description"),
    text: field("seo_text") ?? asText(category.description),
  }
}

/** Split category copy into paragraphs on blank lines. */
export const toParagraphs = (text: string): string[] =>
  text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
