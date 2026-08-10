/**
 * Shared locale display-name helpers.
 *
 * Medusa's /store/locales endpoint returns names in the format
 * "German (Germany)" / "English (United States)".  These utilities
 * derive a clean **language** name from the locale code, falling
 * back to stripping the parenthetical country from the raw name
 * when `Intl.DisplayNames` is unavailable.
 */

/**
 * Extracts the bare language subtag from a BCP 47 locale code.
 * @example "de-DE" → "de", "hu-HU" → "hu", "en-US" → "en"
 */
export function getLanguageSubtag(localeCode: string): string {
  try {
    return new Intl.Locale(localeCode).language
  } catch {
    return localeCode.split(/[-_]/)[0] ?? localeCode
  }
}

/**
 * Strips the trailing parenthetical country from a Medusa locale
 * display name.  Used as a last-resort fallback.
 * @example "German (Germany)" → "German"
 */
export function stripCountryFromName(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, "").trim()
}

/**
 * Returns the localized **language** name for a locale code.
 *
 * Strategy:
 * 1. Extract the language subtag (e.g. "de-DE" → "de")
 * 2. Resolve via `Intl.DisplayNames` with `type: "language"`
 * 3. If unavailable, strip the parenthetical country from the Medusa name
 *
 * @param localeCode   - BCP 47 locale code (e.g. "de-DE")
 * @param fallbackName - Raw name from the backend (e.g. "German (Germany)")
 * @param displayLocale - Locale to display names in (defaults to "en-US").
 *                        Uses `||` not `??` because the cookie-stored locale
 *                        can be an empty string (English default).
 */
export function getLocalizedLanguageName(
  localeCode: string,
  fallbackName: string,
  displayLocale: string = "en-US"
): string {
  try {
    const lang = getLanguageSubtag(localeCode)
    // || not ?? — empty string is a valid cookie value (English default)
    const locale = displayLocale || "en-US"
    const displayNames = new Intl.DisplayNames([locale], {
      type: "language",
    })
    return displayNames.of(lang) ?? stripCountryFromName(fallbackName)
  } catch {
    return stripCountryFromName(fallbackName)
  }
}
