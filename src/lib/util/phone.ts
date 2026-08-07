const PHONE_PATTERNS: Record<string, { regex: RegExp; example: string }> = {
  hu: { regex: /^\+?36?\d{8,9}$/, example: "+36 30 123 4567" },
  at: { regex: /^\+?43?\d{7,11}$/, example: "+43 664 123 4567" },
  de: { regex: /^\+?49?\d{7,12}$/, example: "+49 151 123 4567" },
}

export type PhoneValidationResult =
  | { valid: true }
  | { valid: false; reason: "format"; example: string }

export function validatePhoneNumber(
  countryCode: string,
  phone: string
): PhoneValidationResult {
  if (!phone || !phone.trim()) return { valid: true }

  const normalized = phone.trim().replace(/[\s\-\.\(\)]/g, "")
  const pattern = PHONE_PATTERNS[countryCode.toLowerCase()]

  if (pattern && !pattern.regex.test(normalized)) {
    return { valid: false, reason: "format", example: pattern.example }
  }

  return { valid: true }
}

export function getPhoneFormatHint(countryCode: string): string {
  return PHONE_PATTERNS[countryCode.toLowerCase()]?.example ?? ""
}
