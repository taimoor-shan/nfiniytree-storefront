import { getLocalizedField } from "@lib/i18n/metadata"

/**
 * Copy a product keeps in its metadata (product → Metadata in the admin), for
 * what Medusa's own fields have no place for. Each value is plain text or one
 * text per language, as JSON:
 *   {"en": "…", "de-AT": "…", "de-DE": "…", "hu-HU": "…"}
 *
 *   short_description  shown under the title; the full description (the
 *                      product's own description) then moves to a Description
 *                      section below
 *   long_description   the formatted text of the Description section, HTML from
 *                      the admin's Long description box (see
 *                      `getLongDescription()`)
 *   seo_title          <title>, used as-is (include the brand if wanted)
 *   seo_description    <meta name="description">, used as-is
 */
type ProductLike = {
  metadata?: Record<string, unknown> | null
}

const asText = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

export function getShortDescription(
  product: ProductLike,
  locale: string
): string | undefined {
  return asText(getLocalizedField(product.metadata, "short_description", locale))
}

/** Markup that shows something even without a word of text. */
const VISIBLE_WITHOUT_TEXT = /<(?:img|hr|table|iframe|video)\b/i

/** An editor that was emptied leaves `<p></p>`, which is not a text. */
const isBlankHtml = (html: string): boolean =>
  !VISIBLE_WITHOUT_TEXT.test(html) &&
  html.replace(/<[^>]*>/g, "").replace(/&nbsp;|\s/g, "") === ""

/**
 * The long description: HTML from the rich-text editor in the admin's Long
 * description box, for the Description section. Medusa's own description is the
 * short text under the title, so a product with a long description shows that
 * here and its description in the intro.
 *
 * Plain HTML is the same in every language; one text per language is resolved
 * like the other copy (a language without a text is shown the English one).
 */
export function getLongDescription(
  product: ProductLike,
  locale: string
): string | undefined {
  const html = asText(getLocalizedField(product.metadata, "long_description", locale))

  return html && !isBlankHtml(html) ? html : undefined
}

export type ProductSeo = {
  title?: string
  description?: string
}

export function getProductSeo(product: ProductLike, locale: string): ProductSeo {
  return {
    title: asText(getLocalizedField(product.metadata, "seo_title", locale)),
    description: asText(
      getLocalizedField(product.metadata, "seo_description", locale)
    ),
  }
}
