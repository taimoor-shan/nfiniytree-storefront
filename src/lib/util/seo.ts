/**
 * Canonical URL and hreflang construction.
 *
 * Every indexable page needs exactly one canonical URL and a set of hreflang
 * alternates pointing at the *equivalent* page in the other markets. Both are
 * derived here so there is a single place that knows the URL shape.
 *
 * ---
 * URL shape: `https://<site>/<countryCode><path>`
 *
 * The country code is the only localisation carried in the URL. The UI
 * *language* lives in the `_medusa_locale` cookie, so `/at/store` renders in
 * German or English depending on the visitor's cookie. That means hreflang can
 * only ever express country targeting here, not language targeting — see the
 * note on `getAlternates()`.
 */

import { getBaseURL } from "./env"
import { COUNTRY_TO_LOCALE } from "./country-locale"

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
 * `path` is the route *without* the country prefix ("" or "/store" or
 * "/products/olive-tree"). Query strings are deliberately not accepted:
 * canonical URLs must not carry filter/pagination parameters.
 */
export const buildUrl = (countryCode: string, path: string = "") => {
  const normalized =
    !path || path === "/" ? "" : path.startsWith("/") ? path : `/${path}`

  return `${getSiteUrl()}/${countryCode.toLowerCase()}${normalized}`
}

/**
 * Build `alternates` for Next's Metadata API: one canonical plus one hreflang
 * entry per market that actually serves this path.
 *
 * `countryCodes` must come from the live region list, so we never emit an
 * hreflang URL for a market that does not exist — an alternate pointing at a
 * 404 invalidates the whole cluster for Google.
 *
 * The hreflang value is the country's formatting locale (`at` → `de-AT`,
 * `hu` → `hu-HU`), which is the same country→locale map the price formatter
 * uses. A country with no mapping is skipped rather than guessed at.
 */
export const getAlternates = ({
  countryCode,
  path = "",
  countryCodes,
}: {
  countryCode: string
  path?: string
  countryCodes: string[]
}) => {
  const languages: Record<string, string> = {}

  for (const code of countryCodes) {
    const hreflang = COUNTRY_TO_LOCALE[code.toLowerCase()]
    if (!hreflang) continue
    languages[hreflang] = buildUrl(code, path)
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

  return {
    canonical: buildUrl(countryCode, path),
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
