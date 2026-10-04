import "server-only"
import { translate } from "@lib/i18n/dictionaries"
import { getLocale } from "./locale-actions"

/**
 * Known backend error messages → translation keys.  Raw Medusa/SDK error
 * text is English and technical; these are the messages users can actually
 * encounter, localized before they reach the UI.
 */
const KNOWN_ERROR_KEYS: Record<string, string> = {
  "invalid email or password": "account.invalidCredentials",
}

/**
 * Localize a caught error for the UI.  Known messages are mapped to their
 * translation keys; everything else falls back to a generic message so raw
 * SDK errors never surface untranslated.
 */
export const localizeError = async (error: any): Promise<string> => {
  const locale = await getLocale()
  const raw = String(error?.message ?? error ?? "").toLowerCase()
  const entry = Object.entries(KNOWN_ERROR_KEYS).find(([known]) =>
    raw.includes(known)
  )
  return translate(entry?.[1] || "account.errorOccurred", locale)
}
