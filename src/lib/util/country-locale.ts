/**
 * Country → formatting-locale resolution.
 *
 * Commercial context (country) determines how money is formatted; the UI
 * language (`_medusa_locale` cookie) never affects number/currency
 * formatting. Medusa regions only expose ISO-2 country codes, so this map
 * is the single source for country → locale. All values are explicit
 * strings so server and client render identically.
 */

/**
 * ISO-2 country code → Intl formatting locale (EU-27 + GB/CH/NO + us).
 * Backend only serves de/at/hu today; this map is forward-looking.
 * Multi-language countries use a single deliberate convention.
 */
export const COUNTRY_TO_LOCALE: Record<string, string> = {
  at: "de-AT",
  be: "nl-BE", // Belgium: Dutch convention
  bg: "bg-BG",
  hr: "hr-HR",
  cy: "el-CY",
  cz: "cs-CZ",
  dk: "da-DK",
  ee: "et-EE",
  fi: "fi-FI",
  fr: "fr-FR",
  de: "de-DE",
  gr: "el-GR",
  hu: "hu-HU",
  ie: "en-IE",
  it: "it-IT",
  lv: "lv-LV",
  lt: "lt-LT",
  lu: "fr-LU", // Luxembourg: French convention
  mt: "mt-MT",
  nl: "nl-NL",
  pl: "pl-PL",
  pt: "pt-PT",
  ro: "ro-RO",
  sk: "sk-SK",
  si: "sl-SI",
  es: "es-ES",
  se: "sv-SE",
  gb: "en-GB",
  ch: "de-CH", // Switzerland: German convention
  no: "nb-NO",
  us: "en-US",
}

/**
 * Fallback when the country is unknown: pick a locale sensible for the
 * currency itself, so EUR never falls back to a US-centric presentation.
 */
const CURRENCY_FALLBACK_LOCALE: Record<string, string> = {
  huf: "hu-HU",
  eur: "en-IE",
  gbp: "en-GB",
  usd: "en-US",
}

export const getFormattingLocale = ({
  countryCode,
  currency_code,
}: {
  countryCode?: string | null
  currency_code?: string | null
}): string => {
  if (countryCode) {
    const hit = COUNTRY_TO_LOCALE[countryCode.toLowerCase()]
    if (hit) return hit
  }

  return (
    CURRENCY_FALLBACK_LOCALE[currency_code?.toLowerCase() ?? ""] ?? "en-US"
  )
}

/**
 * Commercial country of a cart: the shipping country when set. This is the
 * authoritative country for cart/checkout amounts (Medusa recalcs prices,
 * VAT and shipping from it), so formatting must follow it — not the URL.
 */
export const getCartCountryCode = (
  cart?: {
    shipping_address?: { country_code?: string | null } | null
  } | null
): string | undefined => cart?.shipping_address?.country_code ?? undefined

/**
 * Historical orders keep their own shipping country: an order placed to
 * Germany stays German-formatted even when viewed from another country.
 */
export const getOrderCountryCode = getCartCountryCode
