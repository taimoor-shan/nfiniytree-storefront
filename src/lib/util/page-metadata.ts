import "server-only"

import type { Metadata } from "next"

import { listCountryCodes } from "@lib/data/regions"
import { retrievePageBySlug } from "@lib/data/pages"
import { getLocale } from "@lib/data/locale-actions"
import { translate } from "@lib/i18n"
import { DEFAULT_COUNTRY_CODE, getAlternates, SITE_NAME } from "./seo"

/**
 * `alternates` for a page's `generateMetadata`, resolved against the live
 * region list.
 *
 * Keeping the region lookup here (rather than in `seo.ts`) keeps the pure URL
 * builders importable from anywhere while this — the part that talks to the
 * backend — stays server-only.
 *
 * @param countryCode The market this request is for (from `params`).
 * @param path        The route without its country prefix: "", "/store",
 *                    "/products/olive-tree". Never include a query string —
 *                    canonicals must not carry filter or pagination params.
 */
export async function getSeoAlternates(countryCode: string, path: string = "") {
  const discovered = await listCountryCodes()

  // A backend outage must not produce a page with no canonical at all, so fall
  // back to a self-referencing canonical for the default market only. Emitting
  // a guessed hreflang cluster instead would risk pointing at markets that do
  // not exist.
  const countryCodes = discovered.length ? discovered : [DEFAULT_COUNTRY_CODE]

  return getAlternates({ countryCode, path, countryCodes })
}

/**
 * Pick the first CMS field that holds real prose, falling back to a caller
 * supplied default.
 *
 * The `||` chains this replaces tested truthiness, not content. A CMS field
 * containing only whitespace — trivially easy to produce in a rich-text editor,
 * and what a cleared field often leaves behind — is truthy, so it won the chain
 * and shipped as a blank `<meta name="description">`. That is worse than the
 * fallback it suppressed: the page has no description at all, and no editor
 * looking at the admin UI would see anything wrong.
 *
 * `htmlFallback` is a last resort for pages whose only other option is no
 * description whatsoever. Tags are stripped and the result is clipped to ~155
 * characters on a word boundary, which is roughly what Google renders.
 */
export function resolveDescription(
  candidates: (string | null | undefined)[],
  htmlFallback?: string | null
): string | undefined {
  for (const candidate of candidates) {
    const trimmed = candidate?.trim()
    if (trimmed) return trimmed
  }

  if (!htmlFallback) return undefined

  const text = htmlFallback
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&(?:lt|gt|quot|#39);/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  if (!text) return undefined
  if (text.length <= 155) return text

  const clipped = text.slice(0, 155)
  const lastSpace = clipped.lastIndexOf(" ")

  return `${(lastSpace > 80 ? clipped.slice(0, lastSpace) : clipped).replace(/[,;:.\s]+$/, "")}…`
}

/**
 * Metadata for a CMS-backed page (the policy/legal set, and any page rendered
 * from the backend Page module).
 *
 * All five policy pages previously shared one fallback description —
 * `policy.pageBeingUpdated`, "This page is being updated" — so Privacy, Terms,
 * Shipping, Returns and Imprint shipped byte-identical meta descriptions
 * whenever the CMS record had no `seo_description`. `descriptionKey` gives each
 * one a distinct fallback that actually describes the page.
 *
 * Editor-supplied copy still wins: `seo_description` → `excerpt` → fallback.
 */
export async function getCmsPageMetadata({
  slug,
  path,
  countryCode,
  titleKey,
  descriptionKey,
}: {
  slug: string
  path: string
  countryCode: string
  titleKey: string
  descriptionKey: string
}): Promise<Metadata> {
  const locale = (await getLocale()) || "en"
  const page = await retrievePageBySlug(slug, locale)

  const title =
    page?.seo_title ||
    page?.title ||
    `${await translate(titleKey, locale)} | ${SITE_NAME}`

  const description =
    resolveDescription([page?.seo_description, page?.excerpt]) ||
    (await translate(descriptionKey, locale))

  return {
    title,
    description,
    alternates: await getSeoAlternates(countryCode, path),
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      title,
      description,
      url: `/${countryCode}${path}`,
      ...(page?.featured_image ? { images: [{ url: page.featured_image }] } : {}),
    },
  }
}
