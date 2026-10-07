import { getLocale } from "@lib/data/locale-actions"
import { getDictionary } from "@lib/i18n/dictionaries"

type Params = Record<string, string | number>

/** Fills `{name}` placeholders in a sentence. */
export const interpolate = (text: string, params?: Params) =>
  params
    ? text.replace(/\{(\w+)\}/g, (match, key) =>
        key in params ? String(params[key]) : match
      )
    : text

/**
 * One dictionary load per page, instead of one `translate()` call per string.
 * A page shown in the language of an email (the invite page) names it.
 */
export const getPortalTranslator = async (language?: string | null) => {
  const locale = language || (await getLocale()) || "en"
  const dict = await getDictionary(locale)

  return {
    locale,
    t: (key: string, params?: Params) => interpolate(dict[key] ?? key, params),
  }
}

export type PortalT = Awaited<ReturnType<typeof getPortalTranslator>>["t"]
