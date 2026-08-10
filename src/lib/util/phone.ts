import { parsePhoneNumber, CountryCode } from "libphonenumber-js/min"

export type PhoneValidationResult =
  | { valid: true }
  | { valid: false; reason: "format"; example: string }

/**
 * Validate a phone number against the selected shipping country.
 * Empty values are always valid (phone is optional at checkout).
 *
 * Uses Google's libphonenumber for authoritative validation — handles
 * mobile vs landline, national vs international format, extensions,
 * leading zeros, and all country-specific edge cases.
 *
 * @param countryCode - lowercase ISO-2 country code (e.g. "hu", "de")
 * @param phone - raw user input, may include spaces, dashes, parentheses, +
 */
export function validatePhoneNumber(
  countryCode: string,
  phone: string
): PhoneValidationResult {
  if (!phone || !phone.trim()) return { valid: true }

  try {
    const parsed = parsePhoneNumber(
      phone,
      countryCode.toUpperCase() as CountryCode
    )
    if (parsed && parsed.isValid()) {
      return { valid: true }
    }
  } catch {
    // parsePhoneNumber throws on completely unparseable input
  }

  // Fall through: invalid — include a format example for the country
  const example = getPhoneExample(countryCode)
  return { valid: false, reason: "format", example }
}

/**
 * Human-readable example for the format hint shown below the input.
 * These are UI hints only; validation is handled by libphonenumber-js.
 */
function getPhoneExample(countryCode: string): string {
  const examples: Record<string, string> = {
    at: "+43 664 123 4567",
    be: "+32 470 12 34 56",
    bg: "+359 88 123 4567",
    hr: "+385 99 123 4567",
    cy: "+357 96 123456",
    cz: "+420 601 123 456",
    dk: "+45 12 34 56 78",
    ee: "+372 5123 4567",
    fi: "+358 40 123 4567",
    fr: "+33 6 12 34 56 78",
    de: "+49 151 123 4567",
    gr: "+30 691 123 4567",
    hu: "+36 30 123 4567",
    ie: "+353 87 123 4567",
    it: "+39 347 123 4567",
    lv: "+371 20 123 456",
    lt: "+370 612 34567",
    lu: "+352 621 123 456",
    mt: "+356 99 123 456",
    nl: "+31 6 12345678",
    pl: "+48 601 123 456",
    pt: "+351 912 345 678",
    ro: "+40 721 234 567",
    sk: "+421 901 123 456",
    si: "+386 40 123 456",
    es: "+34 612 34 56 78",
    se: "+46 70 123 45 67",
  }
  return examples[countryCode.toLowerCase()] ?? ""
}

/**
 * Returns a human-readable format hint for the given country's phone number.
 *
 * @param countryCode - lowercase ISO-2 country code
 * @returns format example string (e.g. "+36 30 123 4567"), or empty string for unknown countries
 */
export function getPhoneFormatHint(countryCode: string): string {
  return getPhoneExample(countryCode)
}
