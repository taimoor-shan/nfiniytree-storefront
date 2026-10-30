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
