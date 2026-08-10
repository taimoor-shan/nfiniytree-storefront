/**
 * VAT number format validation for B2B checkout.
 *
 * Covers all 27 EU member states with intentionally permissive format checks.
 * TaxID.dev (VIES) is the authoritative validator — these regexes are a basic
 * sanity filter to catch empty strings and obviously-wrong inputs before
 * making an API call. Country prefix is optional in all patterns.
 *
 * Non-EU countries require a non-empty value only (already enforced by the
 * required field); VIES verification is skipped for those countries.
 *
 * The VAT_PATTERNS map doubles as the EU-27 country list for TaxID gating.
 */

const VAT_PATTERNS: Record<string, { regex: RegExp; example: string }> = {
  at: { regex: /^(?:AT)?U?\d{8}$/i,       example: "ATU12345678" },
  be: { regex: /^(?:BE)?\d{9,10}$/i,      example: "BE0123456789" },
  bg: { regex: /^(?:BG)?\d{9,10}$/i,      example: "BG123456789" },
  hr: { regex: /^(?:HR)?\d{11}$/i,        example: "HR12345678901" },
  cy: { regex: /^(?:CY)?\d{8}[A-Z]$/i,    example: "CY12345678X" },
  cz: { regex: /^(?:CZ)?\d{8,10}$/i,      example: "CZ12345678" },
  dk: { regex: /^(?:DK)?\d{8}$/i,         example: "DK12345678" },
  ee: { regex: /^(?:EE)?\d{9}$/i,         example: "EE123456789" },
  fi: { regex: /^(?:FI)?\d{8}$/i,         example: "FI12345678" },
  fr: { regex: /^(?:FR)?[A-Z0-9]{2}\d{9}$/i, example: "FRAB123456789" },
  de: { regex: /^(?:DE)?\d{9}$/i,         example: "DE123456789" },
  gr: { regex: /^(?:GR|EL)?\d{9}$/i,      example: "EL123456789" },
  hu: { regex: /^(?:HU)?\d{8}$/i,         example: "HU12345678" },
  ie: { regex: /^(?:IE)?\d{7,8}[A-Z]?$/i, example: "IE1234567X" },
  it: { regex: /^(?:IT)?\d{11}$/i,        example: "IT12345678901" },
  lv: { regex: /^(?:LV)?\d{11}$/i,        example: "LV12345678901" },
  lt: { regex: /^(?:LT)?\d{9,12}$/i,      example: "LT123456789" },
  lu: { regex: /^(?:LU)?\d{8}$/i,         example: "LU12345678" },
  mt: { regex: /^(?:MT)?\d{8}$/i,         example: "MT12345678" },
  nl: { regex: /^(?:NL)?\d{9}B\d{2}$/i,   example: "NL123456789B01" },
  pl: { regex: /^(?:PL)?\d{10}$/i,        example: "PL1234567890" },
  pt: { regex: /^(?:PT)?\d{9}$/i,         example: "PT123456789" },
  ro: { regex: /^(?:RO)?\d{2,10}$/i,      example: "RO1234567890" },
  sk: { regex: /^(?:SK)?\d{10}$/i,        example: "SK1234567890" },
  si: { regex: /^(?:SI)?\d{8}$/i,         example: "SI12345678" },
  es: { regex: /^(?:ES)?[A-Z]\d{7,8}[A-Z]?$/i, example: "ESX12345678" },
  se: { regex: /^(?:SE)?\d{12}$/i,        example: "SE123456789012" },
}

/** EU-27 country codes — maps 1:1 with VIES coverage (TaxID.dev). */
export const EU_COUNTRY_CODES = new Set(Object.keys(VAT_PATTERNS))

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
