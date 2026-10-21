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
  // Registering an email that already has an account.  Medusa answers 401, as
  // it does for every registration failure, and the SDK's error carries no
  // type or code, so this sentence is all that tells it from the others.
  "identity with email already exists": "account.emailAlreadyRegistered",
}

/**
 * The translation key of an error whose message is a known one, if it is.
 */
export const knownErrorKey = (error: any): string | undefined => {
  const raw = String(error?.message ?? error ?? "").toLowerCase()
  return Object.entries(KNOWN_ERROR_KEYS).find(([known]) =>
    raw.includes(known)
  )?.[1]
}

/**
 * Localize a caught error for the UI.  Known messages are mapped to their
 * translation keys; everything else falls back to a generic message so raw
 * SDK errors never surface untranslated.
 */
export const localizeError = async (error: any): Promise<string> => {
  const locale = await getLocale()
  return translate(knownErrorKey(error) || "account.errorOccurred", locale)
}
