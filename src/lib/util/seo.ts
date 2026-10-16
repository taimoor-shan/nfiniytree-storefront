/**
 * Canonical URL and hreflang construction.
 *
 * Every indexable page needs exactly one canonical URL and a set of hreflang
 * alternates pointing at the *equivalent* page in the other markets. Both are
 * derived here so there is a single place that knows the URL shape.
 *
 * ---
 * URL shape: `https://<site>/<market><path>`, where the market is the country
 * (`/hu`, shown in the country's own language) or language-country (`/en-hu`).
 * See `src/lib/i18n/market.ts`. Every language of every market is its own
 * URL, so hreflang names both the language and the country (`en-HU`).
 */

import { getBaseURL } from "./env"
import { marketVariants } from "@lib/i18n/market"

export const SITE_NAME = "Infinytree"

/**
 * The canonical origin, with any trailing slash removed.
 *
 * In production `NEXT_PUBLIC_BASE_URL` must be the canonical domain
 * (`https://infinytree.com`) — not the `www.` host and not `http://` — because
 * every canonical tag, hreflang alternate and sitemap entry is built from it.
 */
export const getSiteUrl = () => getBaseURL().replace(/\/+$/, "")

/**
 * Fallback country code for `x-default` and for the sitemap when the backend
 * is unreachable at build time.
 */
export const DEFAULT_COUNTRY_CODE = (
  process.env.NEXT_PUBLIC_DEFAULT_REGION || "hu"
).toLowerCase()

/**
 * Absolute URL for a path inside a market.
 *
 * `market` is the URL prefix (`hu`, `en-hu`). `path` is the route *without*
 * that prefix ("" or "/store" or
 * "/products/olive-tree"). Query strings are deliberately not accepted:
 * canonical URLs must not carry filter/pagination parameters.
 */
export const buildUrl = (market: string, path: string = "") => {
  const normalized =
    !path || path === "/" ? "" : path.startsWith("/") ? path : `/${path}`

  return `${getSiteUrl()}/${market.toLowerCase()}${normalized}`
}

/**
 * The hreflang cluster for a path: every language of every market
 * (`hu-HU` → `/hu`, `en-HU` → `/en-hu`, `de-AT` → `/at`, …) plus `x-default`.
 */
export const getHreflangs = (countryCodes: string[], path: string = "") => {
  const languages: Record<string, string> = {}

  for (const code of countryCodes) {
    for (const { prefix, hreflang } of marketVariants(code)) {
      languages[hreflang] = buildUrl(prefix, path)
    }
  }

  // `x-default` is what Google serves when no hreflang matches the user. The
  // default region is the same one the proxy falls back to, so this points at
  // the URL an unmatched visitor would actually land on.
  const defaultCode = countryCodes.includes(DEFAULT_COUNTRY_CODE)
    ? DEFAULT_COUNTRY_CODE
    : countryCodes[0]

  if (defaultCode) {
    languages["x-default"] = buildUrl(defaultCode, path)
  }

  return languages
}

/**
 * Build `alternates` for Next's Metadata API: the page's own URL as canonical
 * plus one hreflang entry per language of every market.
 *
 * `countryCodes` must come from the live region list, so we never emit an
 * hreflang URL for a market that does not exist — an alternate pointing at a
 * 404 invalidates the whole cluster for Google.
 *
 * `market` is the prefix the page was requested under (`en-hu`), so each
 * language version is its own canonical.
 */
export const getAlternates = ({
  market,
  path = "",
  countryCodes,
}: {
  market: string
  path?: string
  countryCodes: string[]
}) => {
  const languages = getHreflangs(countryCodes, path)

  return {
    canonical: buildUrl(market, path),
    // Omit the key entirely when there is only one market — a single-entry
    // hreflang cluster is noise.
    ...(Object.keys(languages).length > 1 ? { languages } : {}),
  }
}

/**
 * Metadata for routes that must never be indexed: cart, checkout, account,
 * order confirmation and transfer, internal search results.
 *
 * `follow` stays on so link equity still flows out of these pages, and
 * `googleBot` is set explicitly because Google honours the more specific
 * directive when both are present.
 */
export const NOINDEX_METADATA = {
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
} as const
