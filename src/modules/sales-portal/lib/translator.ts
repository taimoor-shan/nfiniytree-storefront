import { getLocale } from "@lib/data/locale-actions"
import { getDictionary } from "@lib/i18n/dictionaries"

/** One dictionary load per page, instead of one `translate()` call per string. */
export const getPortalTranslator = async () => {
  const locale = (await getLocale()) || "en"
  const dict = await getDictionary(locale)

  return {
    locale,
    t: (key: string) => dict[key] ?? key,
  }
}

export type PortalT = Awaited<ReturnType<typeof getPortalTranslator>>["t"]
