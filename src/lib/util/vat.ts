/**
 * VAT number format validation for B2B checkout.
 *
 * Supported countries have strict format checks.
 * All other countries require a non-empty value (already enforced by the required field).
 */

const VAT_PATTERNS: Record<string, { regex: RegExp; example: string }> = {
  hu: { regex: /^HU\d{8}$/i, example: "HU12345678" },
  de: { regex: /^DE\d{9}$/i, example: "DE123456789" },
  at: { regex: /^ATU\d{8}$/i, example: "ATU12345678" },
}

/**
 * Validates a VAT number against the expected format for the given country.
 *
 * @param countryCode - lowercase ISO-2 country code (e.g. "hu", "de", "at")
 * @param vat - the VAT number string to validate
 * @returns `null` if valid, or an error message string if invalid
 */
export function validateVatNumber(
  countryCode: string,
  vat: string
): string | null {
  if (!vat || !vat.trim()) {
    return "VAT number is required"
  }

  const trimmed = vat.trim()
  const pattern = VAT_PATTERNS[countryCode.toLowerCase()]

  if (pattern) {
    if (!pattern.regex.test(trimmed)) {
      return `Invalid VAT number for ${countryCode.toUpperCase()}. Expected format: ${pattern.example}`
    }
  }
  // For other countries, just require non-empty (already checked above)

  return null
}

/**
 * Returns a human-readable format hint for the given country's VAT number.
 *
 * @param countryCode - lowercase ISO-2 country code
 * @returns format example string (e.g. "HU12345678"), or empty string for non-strict countries
 */
export function getVatFormatHint(countryCode: string): string {
  const pattern = VAT_PATTERNS[countryCode.toLowerCase()]
  return pattern?.example ?? ""
}
