/**
 * Default UI language per market.
 *
 * The visitor's language lives in the `_medusa_locale` cookie, which only
 * exists once they have picked a language. Crawlers never send it, so without
 * a default every market rendered in English: Google crawled `/hu` and `/at`
 * as English pages while their hreflang tags declared `hu-HU` and `de-AT`, and
 * the Hungarian and German content was never indexed.
 *
 * When there is no cookie, the market in the URL decides the language. A
 * cookie, once set by the language switcher, still wins.
 *
 * Only languages that have a dictionary in `src/i18n/dictionaries` belong
 * here; any other market keeps the English default.
 */
export const COUNTRY_DEFAULT_LOCALE: Record<string, string> = {
  hu: "hu-HU",
  at: "de-AT",
  de: "de-DE",
}

/**
 * Request header the proxy uses to hand the URL's default language to server
 * components (`getLocale()`), which cannot see the route's country segment.
 */
export const DEFAULT_LOCALE_HEADER = "x-infinytree-default-locale"

export const defaultLocaleForCountry = (
  countryCode: string | null | undefined
): string | null =>
  (countryCode && COUNTRY_DEFAULT_LOCALE[countryCode.toLowerCase()]) || null
