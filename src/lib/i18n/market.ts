/**
 * Market URLs: the first path segment names the UI language and the country,
 * always both, so the two are independent.
 *
 *   /en-hu/store  Hungary, in English
 *   /de-hu/store  Hungary, in German
 *   /de-at/store  Austria, in German
 *   /en-de/store  Germany, in English
 *
 * This is how Shopify Markets lays out URLs. Every language of every market is
 * its own address, so search engines can index each one, and the language
 * selector switches by moving to the other address. The country keeps driving
 * prices, currency and shipping; the language only drives the text.
 *
 * A bare country (`/hu/store`, what Medusa's country selector and old links
 * produce) is redirected to the visitor's language: the one they last picked
 * (`_medusa_locale` cookie), else the country's usual language.
 *
 * The proxy rewrites `/en-hu/...` to the `[countryCode]` route for `hu` and
 * hands the language to server components in `LOCALE_HEADER`, so routes and
 * data fetching keep working with a plain country code. Links are built with
 * the URL's own prefix (`MARKET_HEADER`, `useMarketPrefix()`), so a visitor
 * stays in the language they are reading.
 *
 * Only languages in `URL_LANGUAGES` can appear in a URL; each needs a
 * dictionary in `src/i18n/dictionaries`. German has two dictionaries: Austria
 * uses `de-AT`, every other market `de-DE` (`getLocale()` swaps to the other
 * one when Medusa only has that one, see `matchLocale`).
 *
 * Pure functions only: this file is imported by the proxy, by server code and
 * by client components.
 */

/** Request header carrying the locale the URL asks for (set by the proxy). */
export const LOCALE_HEADER = "x-infinytree-locale"

/** Request header carrying the URL's market prefix, e.g. `en-hu` (set by the proxy). */
export const MARKET_HEADER = "x-infinytree-market"

/** Languages that can appear in a URL, as their two-letter code. */
export const URL_LANGUAGES = ["en", "de"] as const

/** The language a country is shown in until the visitor picks one. */
const COUNTRY_DEFAULT_LANGUAGE: Record<string, string> = {
  at: "de",
  de: "de",
}

export const defaultLanguageForCountry = (country: string): string =>
  COUNTRY_DEFAULT_LANGUAGE[country.toLowerCase()] ?? "en"

const isUrlLanguage = (language: string) =>
  (URL_LANGUAGES as readonly string[]).includes(language)

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

/**
 * The locale a market segment asks for, or null when the URL names no
 * supported language (a bare country, `/hu-hu`), which the proxy redirects.
 */
export const localeForSegment = (segment: MarketSegment): string | null =>
  segment.language ? localeForLanguage(segment.language, segment.country) : null

/**
 * The URL prefix for a country shown in a locale: always
 * `<language>-<country>` (`en-hu`, `de-de`). No locale, or one that cannot
 * appear in a URL, falls back to the country's usual language.
 */
export const marketPrefix = (
  country: string,
  locale: string | null | undefined
): string => {
  const code = country.toLowerCase()
  // No locale at all means "not chosen": the country's usual language. An
  // empty string is the selector's explicit English.
  const language =
    locale === null || locale === undefined
      ? defaultLanguageForCountry(code)
      : languageOf(locale)

  return `${
    isUrlLanguage(language) ? language : defaultLanguageForCountry(code)
  }-${code}`
}

/**
 * The prefix to send a visitor to in a country when the URL does not say
 * which language: the one they last picked (the `_medusa_locale` cookie,
 * where English is ""), else the country's usual language.
 */
export const preferredMarketPrefix = (
  country: string,
  cookieLocale: string | null | undefined
): string => marketPrefix(country, cookieLocale)

/**
 * The locale to use from the ones Medusa offers: the exact one if it is
 * there, else another variant of the same language (`de-DE` → `de-AT`), else
 * the locale itself. German content saved for one country is then shown in
 * every German market, instead of falling back to English.
 */
export const matchLocale = (
  locale: string,
  available: readonly string[] | null | undefined
): string => {
  if (!available?.length) return locale
  const exact = available.find((c) => c.toLowerCase() === locale.toLowerCase())
  if (exact) return exact
  const language = languageOf(locale)
  return available.find((c) => languageOf(c) === language) ?? locale
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
