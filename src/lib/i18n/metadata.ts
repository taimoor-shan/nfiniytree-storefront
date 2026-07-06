/**
 * Locale-aware product metadata resolution.
 *
 * Convention: any metadata field that needs translation stores its values
 * as a nested object keyed by locale code:
 *
 *   {
 *     "care_instructions": {
 *       "en": "Dust gently...",
 *       "de-AT": "Vorsichtig abstauben...",
 *       "de-DE": "Vorsichtig abstauben...",
 *       "hu-HU": "Óvatosan porolja le..."
 *     },
 *     "key_features": {
 *       "en": ["Handmade", "Unique"],
 *       "de-AT": ["Handgefertigt", "Einzigartig"]
 *     }
 *   }
 *
 * `getLocalizedMetadata()` walks all metadata keys, detects fields that
 * match this pattern, and resolves them to the requested locale.
 *
 * Non-locale fields (plain strings, numbers, etc.) pass through unchanged.
 *
 * ---
 * Storage-layer quirk: the Medusa admin UI stores metadata as text inputs,
 * so values like `{"en":[...],"de-AT":[...]}` may arrive as JSON strings
 * rather than parsed objects. We deserialise those strings once, at the
 * top-level loop in `getLocalizedMetadata`, before locale resolution.
 */

const LOCALE_CODES = ["en", "de-AT", "de-DE", "hu-HU", "de", "hu"] as const

/**
 * Metadata keys known to hold structured (JSON) values.
 *
 * These fields may be stored as JSON strings when entered through the
 * Medusa admin UI text-input.  Add new structured fields here as they
 * are introduced so they get deserialised before locale resolution.
 */
const STRUCTURED_METADATA_KEYS = new Set([
  "key_features",
  "care_instructions",
  "pot",
])

// ---------------------------------------------------------------------------
// Locale-pattern detection
// ---------------------------------------------------------------------------

/**
 * Check whether a value looks like a locale-pattern object:
 * an object whose keys are all known locale codes.
 */
function isLocaleObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false
  }
  const keys = Object.keys(value)
  if (keys.length === 0) return false
  return keys.every((k) => (LOCALE_CODES as readonly string[]).includes(k))
}

/**
 * Resolve a locale-pattern value to a single locale.
 *
 * Fallback order:
 *  1. Exact locale match:       "de-AT" → value["de-AT"]
 *  2. Case-insensitive match:   "de-at" → value["de-AT"]
 *  3. Language-only match:      "de-AT" → value["de"]
 *  4. English fallback:         value["en"]
 *  5. First available value
 */
function resolveLocaleValue(
  localeObj: Record<string, unknown>,
  locale: string
): unknown {
  // 1. Exact match
  if (locale in localeObj) return localeObj[locale]

  // 2. Case-insensitive
  const lower = locale.toLowerCase()
  for (const key of Object.keys(localeObj)) {
    if (key.toLowerCase() === lower) return localeObj[key]
  }

  // 3. Language-only (strip region)
  const lang = locale.split("-")[0]
  if (lang !== locale && lang in localeObj) return localeObj[lang]

  // 4. English fallback
  if ("en" in localeObj) return localeObj["en"]

  // 5. First available
  return localeObj[Object.keys(localeObj)[0]]
}

// ---------------------------------------------------------------------------
// Recursive locale resolver
// ---------------------------------------------------------------------------

/**
 * Recursively resolve locale-pattern objects anywhere in a value:
 * - A locale-pattern object → resolved scalar for the requested locale
 * - An array → each element recursively resolved
 * - A plain object that isn't a locale pattern → walk its keys
 * - Anything else → pass through unchanged
 */
function resolveValueDeep(value: unknown, locale: string): unknown {
  if (value === null || value === undefined) return value

  if (Array.isArray(value)) {
    return value.map((item) => resolveValueDeep(item, locale))
  }

  if (isLocaleObject(value)) {
    return resolveLocaleValue(value as Record<string, unknown>, locale)
  }

  // Plain object that isn't a locale pattern: walk its keys
  if (typeof value === "object") {
    const resolved: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      resolved[k] = resolveValueDeep(v, locale)
    }
    return resolved
  }

  return value
}

// ---------------------------------------------------------------------------
// JSON-string deserialization (storage-layer defence)
// ---------------------------------------------------------------------------

/**
 * Attempt to parse a string value as JSON.
 *
 * This is a defensive measure for metadata values that were stored as
 * JSON strings (e.g. when a locale-keyed object is pasted into a Medusa
 * admin UI text field).  Only non-primitive parse results (objects /
 * arrays) are accepted — a string that happens to parse to a number or
 * boolean is returned as-is.
 *
 * Logs a warning in dev when a JSON-looking string fails to parse, so
 * data-entry mistakes surface faster.
 */
function maybeParseJSON(value: unknown): unknown {
  if (typeof value !== "string") return value

  const trimmed = value.trim()
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return value

  try {
    const parsed = JSON.parse(trimmed)
    // Only accept objects / arrays — never reinterpret primitives
    if (typeof parsed === "object" && parsed !== null) return parsed
  } catch {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[getLocalizedMetadata] Failed to parse JSON metadata value: ` +
        `"${trimmed.slice(0, 80)}${trimmed.length > 80 ? "…" : ""}"`
      )
    }
  }

  return value
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Walk product metadata and resolve every locale-pattern field
 * to the requested locale.
 *
 * JSON-string values for known structured keys are deserialised before
 * locale resolution so that locale-pattern objects inside them are
 * detected.  Non-locale fields pass through unchanged.
 *
 * @param metadata - Raw product metadata from the API
 * @param locale    - Current locale, e.g. "de-AT"
 * @returns A new metadata object with locale fields resolved to scalars
 */
export function getLocalizedMetadata(
  metadata: Record<string, any> | null | undefined,
  locale: string
): Record<string, any> {
  if (!metadata || typeof metadata !== "object") return {}

  const resolved: Record<string, any> = {}

  for (const [key, value] of Object.entries(metadata)) {
    // Deserialise JSON strings for known structured fields before
    // locale resolution.  This is the single place we bridge the
    // storage-layer format (string) → application-layer format (object).
    const deserialized = STRUCTURED_METADATA_KEYS.has(key)
      ? maybeParseJSON(value)
      : value
    resolved[key] = resolveValueDeep(deserialized, locale)
  }

  return resolved
}

/**
 * Convenience: extract a single localized field from metadata.
 *
 * @returns The resolved value for the locale, or undefined if the field doesn't exist
 */
export function getLocalizedField(
  metadata: Record<string, any> | null | undefined,
  field: string,
  locale: string
): unknown {
  const resolved = getLocalizedMetadata(metadata, locale)
  return resolved[field]
}
