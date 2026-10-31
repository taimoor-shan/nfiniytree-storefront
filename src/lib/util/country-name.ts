/**
 * Country names in the visitor's language. Pure, so they run under
 * `npx tsx src/lib/util/country-name.test.ts`.
 *
 * Medusa's region countries only carry an English `display_name`
 * ("Austria"); `Intl.DisplayNames` has every country in every language.
 */
import { languageOf } from "../i18n/market"
import { intlLocale } from "./blog"

/**
 * The name of a country (ISO 3166-1 alpha-2) in `locale` ("Österreich",
 * "Ausztria"). English, an unknown code or a browser without
 * `Intl.DisplayNames` keep `fallback`, Medusa's own name for the country.
 */
export const getCountryName = (
  iso2: string | null | undefined,
  locale: string | null | undefined,
  fallback: string
): string => {
  // English is Medusa's text as the admin has it: leave it alone.
  if (!iso2 || languageOf(locale) === "en") {
    return fallback
  }

  try {
    const code = iso2.toUpperCase()
    const name = new Intl.DisplayNames([intlLocale(locale)], {
      type: "region",
    }).of(code)

    // A code with no name comes back as itself.
    return name && name !== code ? name : fallback
  } catch {
    return fallback
  }
}
