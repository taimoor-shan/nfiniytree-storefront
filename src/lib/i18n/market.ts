/**
 * Market URLs: the first path segment names the country and, optionally, the
 * UI language.
 *
 *   /hu/store     Hungary, in Hungary's own language (Hungarian)
 *   /en-hu/store  Hungary, in English
 *   /de-hu/store  Hungary, in German
 *   /at/store     Austria, in German
 *   /en-at/store  Austria, in English
 *
 * This is how Shopify Markets lays out URLs. Every language of every market is
 * its own address, so search engines can index each one, and the language
 * selector switches by moving to the other address. The country keeps driving
 * prices, currency and shipping; the language only drives the text.
 *
 * The proxy rewrites `/en-hu/...` to the `[countryCode]` route for `hu` and
 * hands the language to server components in `LOCALE_HEADER`, so routes and
 * data fetching keep working with a plain country code. Links are built with
 * the URL's own prefix (`MARKET_HEADER`, `useMarketPrefix()`), so a visitor
 * stays in the language they are reading.
 *
 * Only languages with a dictionary in `src/i18n/dictionaries` can appear in a
 * URL. German has two dictionaries: Austria uses `de-AT`, every other market
 * `de-DE`.
 *
 * Pure functions only: this file is imported by the proxy, by server code and
 * by client components.
 */

/** Request header carrying the locale the URL asks for (set by the proxy). */
export const LOCALE_HEADER = "x-infinytree-locale"

/** Request header carrying the URL's market prefix, e.g. `en-hu` (set by the proxy). */
export const MARKET_HEADER = "x-infinytree-market"

/** Languages that can appear in a URL, as their two-letter code. */
export const URL_LANGUAGES = ["en", "de", "hu"] as const

/** The language a market is shown in when its URL names no language. */
const COUNTRY_DEFAULT_LOCALE: Record<string, string> = {
  hu: "hu-HU",
  at: "de-AT",
  de: "de-DE",
}

export const defaultLocaleForCountry = (country: string): string =>
  COUNTRY_DEFAULT_LOCALE[country.toLowerCase()] ?? "en"

/** `"de-AT"` → `"de"`. An empty or missing locale is English. */
export const languageOf = (locale: string | null | undefined): string =>
  (locale || "en").split("-")[0].toLowerCase()

/** The dictionary locale for a URL language in a market, or null if unsupported. */
export const localeForLanguage = (
  language: string,
  country: string
): string | null => {
  switch (language.toLowerCase()) {
    case "en":
      return "en"
    case "hu":
      return "hu-HU"
    case "de":
      return country.toLowerCase() === "at" ? "de-AT" : "de-DE"
    default:
      return null
  }
}

export type MarketSegment = { country: string; language: string | null }

/**
 * `"hu"` → `{ country: "hu", language: null }`,
 * `"en-hu"` → `{ country: "hu", language: "en" }`, anything else → null.
 * Whether the country is a real region is for the caller to check.
 */
export const parseMarketSegment = (
  segment: string | null | undefined
): MarketSegment | null => {
  const value = segment?.toLowerCase()
  if (!value) return null
  if (/^[a-z]{2}$/.test(value)) return { country: value, language: null }

  const match = /^([a-z]{2})-([a-z]{2})$/.exec(value)
  return match ? { country: match[2], language: match[1] } : null
}

/** The locale a market segment asks for, or null for an unsupported language. */
export const localeForSegment = (segment: MarketSegment): string | null =>
  segment.language
    ? localeForLanguage(segment.language, segment.country)
    : defaultLocaleForCountry(segment.country)

/**
 * The URL prefix for a country shown in a locale: the bare country for the
 * country's own language (`/hu`, never `/hu-hu`), `<language>-<country>`
 * otherwise. A locale that cannot appear in a URL falls back to the country's
 * own language.
 */
export const marketPrefix = (
  country: string,
  locale: string | null | undefined
): string => {
  const code = country.toLowerCase()
  const language = languageOf(locale)

  if (
    !(URL_LANGUAGES as readonly string[]).includes(language) ||
    language === languageOf(defaultLocaleForCountry(code))
  ) {
    return code
  }

  return `${language}-${code}`
}

/**
 * Every language version of a market, with its hreflang value
 * (`en-HU`, `hu-HU`, `de-HU`).
 */
export const marketVariants = (country: string) =>
  URL_LANGUAGES.map((language) => ({
    prefix: marketPrefix(country, localeForLanguage(language, country)),
    hreflang: `${language}-${country.toUpperCase()}`,
  }))

/** `"/en-hu/store"` → `"/store"`, `"/hu"` → `""`. Other paths are returned as they are. */
export const stripMarketPrefix = (pathname: string): string => {
  const segment = pathname.split("/")[1]
  if (!parseMarketSegment(segment)) return pathname
  return pathname.slice(segment.length + 1)
}
