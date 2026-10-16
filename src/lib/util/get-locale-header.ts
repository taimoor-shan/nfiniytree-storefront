import { getLocale } from "@lib/data/locale-actions"

export async function getLocaleHeader() {
  const locale = await getLocale()
  return {
    // English is the products' own text, so it is never sent as a locale
    // (the language selector stores it as ""; `/en-hu` URLs resolve to "en").
    "x-medusa-locale": locale && locale !== "en" ? locale : null,
  } as const
}
