/**
 * Regression tests for getLocalizedMetadata.
 *
 * Run:  npx tsx src/lib/i18n/metadata.test.ts
 *
 * Covers:
 *  1. Locale object as a proper JS object    → resolved to current locale
 *  2. Locale object stored as a JSON string   → deserialised then resolved
 *  3. Flat array as a proper JS array         → passed through unchanged
 *  4. Flat array stored as a JSON string      → deserialised then passed
 *     through
 *  5. Plain string starting with "{" or "["   → kept as-is (not valid JSON,
 *     but not valid JSON)                       dev warning logged)
 *  6. Valid JSON primitive (number, boolean)  → kept as-is (not reinterpreted)
 *
 * NOTE: These tests import directly from the source module.  They must
 * be run from the storefront directory so that path aliases resolve:
 *   cd nfiniytree-storefront && npx tsx src/lib/i18n/metadata.test.ts
 */

import { getLocalizedMetadata, getLocalizedField } from "./metadata"

// ---------------------------------------------------------------------------
// Tiny test harness (no framework dependency)
// ---------------------------------------------------------------------------

let passed = 0
let failed = 0

function assert(condition: boolean, label: string) {
  if (condition) {
    passed++
    console.log(`  ✓ ${label}`)
  } else {
    failed++
    console.error(`  ✗ ${label}`)
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function section(title: string) {
  console.log(`\n${title}`)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const LOCALE = "en"

// -- Case 1: locale object as a proper JS object ---------------------------
section("1. Locale object as a proper JS object")

{
  const metadata = {
    key_features: {
      en: ["Handmade", "Unique"],
      "de-AT": ["Handgefertigt", "Einzigartig"],
    },
  }
  const result = getLocalizedMetadata(metadata, LOCALE)

  assert(
    deepEqual(result.key_features, ["Handmade", "Unique"]),
    "resolves locale object to the current locale's array"
  )
  assert(
    !deepEqual(result.key_features, { en: ["Handmade", "Unique"], "de-AT": ["Handgefertigt", "Einzigartig"] }),
    "does NOT return the raw locale object"
  )
}

{
  // de-AT locale
  const result = getLocalizedMetadata(
    {
      key_features: {
        en: ["Handmade"],
        "de-AT": ["Handgefertigt"],
      },
    },
    "de-AT"
  )
  assert(
    deepEqual(result.key_features, ["Handgefertigt"]),
    "resolves to de-AT when that locale is requested"
  )
}

{
  // Fallback: unknown locale → English
  const result = getLocalizedMetadata(
    {
      key_features: {
        en: ["Handmade"],
        "de-AT": ["Handgefertigt"],
      },
    },
    "fr"
  )
  assert(
    deepEqual(result.key_features, ["Handmade"]),
    "falls back to English for unknown locale"
  )
}

// -- Case 2: locale object stored as a JSON string --------------------------
// (This is what happens when an admin pastes JSON into the Medusa UI)
section("2. Locale object stored as a JSON string")

{
  const metadata = {
    key_features: JSON.stringify({
      en: ["Handmade", "Unique"],
      "de-AT": ["Handgefertigt", "Einzigartig"],
    }),
  }
  const result = getLocalizedMetadata(metadata, LOCALE)

  assert(
    deepEqual(result.key_features, ["Handmade", "Unique"]),
    "deserialises JSON string and resolves to current locale"
  )
  assert(
    typeof result.key_features !== "string",
    "result is not a string (was parsed)"
  )
}

{
  // de-AT from JSON string
  const metadata = {
    key_features: JSON.stringify({
      en: ["Handmade"],
      "de-AT": ["Handgefertigt"],
    }),
  }
  const result = getLocalizedMetadata(metadata, "de-AT")
  assert(
    deepEqual(result.key_features, ["Handgefertigt"]),
    "deserialises JSON string and resolves to de-AT"
  )
}

// -- Case 3: flat array as a proper JS array (old format) -------------------
section("3. Flat array as a proper JS array (old format)")

{
  const metadata = {
    key_features: ["Handmade", "Unique", "Maintenance-free"],
  }
  const result = getLocalizedMetadata(metadata, LOCALE)

  assert(
    deepEqual(result.key_features, ["Handmade", "Unique", "Maintenance-free"]),
    "passes through flat array unchanged"
  )
}

// -- Case 4: flat array stored as a JSON string -----------------------------
section("4. Flat array stored as a JSON string")

{
  const metadata = {
    key_features: '["Handmade","Unique","Maintenance-free"]',
  }
  const result = getLocalizedMetadata(metadata, LOCALE)

  assert(
    deepEqual(result.key_features, ["Handmade", "Unique", "Maintenance-free"]),
    "deserialises JSON array string to array"
  )
  assert(
    typeof result.key_features !== "string",
    "result is an array, not a string"
  )
}

// -- Case 5: plain string starting with "[" — not valid JSON ----------------
section('5. Plain string starting with "[" — not valid JSON')

{
  const originalWarn = console.warn
  let warnCalled = false
  console.warn = (..._args: unknown[]) => {
    warnCalled = true
  }

  // Simulate NODE_ENV !== "production" (should log warning)
  const metadata = {
    key_features: "[Dry clean only] Do not iron",
  }
  const result = getLocalizedMetadata(metadata, LOCALE)

  assert(
    result.key_features === "[Dry clean only] Do not iron",
    "keeps non-JSON [string] as-is"
  )
  assert(
    warnCalled,
    "logs a console.warn in dev for failed JSON parse"
  )

  console.warn = originalWarn
}

// -- Case 6: valid JSON primitive (should NOT be reinterpreted) --------------
section("6. Valid JSON primitive — kept as-is")

{
  const metadata = {
    key_features: "true",
  }
  const result = getLocalizedMetadata(metadata, LOCALE)

  // "true" is valid JSON but parses to boolean `true`, which is a primitive.
  // maybeParseJSON only accepts objects/arrays, so the string is kept.
  assert(
    result.key_features === "true",
    "keeps JSON-primitive string as-is (does not convert to boolean)"
  )
}

{
  const metadata = {
    key_features: "42",
  }
  const result = getLocalizedMetadata(metadata, LOCALE)
  assert(
    result.key_features === "42",
    "keeps JSON-number string as-is (does not convert to number)"
  )
}

// -- Case 7: non-structured keys are NOT deserialised -----------------------
section("7. Non-structured keys are NOT deserialised")

{
  // A key NOT in STRUCTURED_METADATA_KEYS that happens to contain JSON
  const metadata = {
    some_random_field: '{"en": "hello", "de-AT": "hallo"}',
  }
  const result = getLocalizedMetadata(metadata, LOCALE)

  assert(
    result.some_random_field === '{"en": "hello", "de-AT": "hallo"}',
    "non-structured key containing JSON string is NOT deserialised"
  )
}

// -- Case 8: care_instructions as locale object (string) --------------------
section("8. care_instructions (structured key) with locale-pattern string")

{
  const metadata = {
    care_instructions: JSON.stringify({
      en: "Dust gently with a soft cloth.",
      "de-AT": "Vorsichtig mit einem weichen Tuch abstauben.",
    }),
  }
  const result = getLocalizedMetadata(metadata, LOCALE)

  assert(
    result.care_instructions === "Dust gently with a soft cloth.",
    "deserialises and resolves care_instructions JSON string to English"
  )
}

{
  // de-AT
  const metadata = {
    care_instructions: JSON.stringify({
      en: "Dust gently.",
      "de-AT": "Vorsichtig abstauben.",
    }),
  }
  const result = getLocalizedMetadata(metadata, "de-AT")

  assert(
    result.care_instructions === "Vorsichtig abstauben.",
    "deserialises and resolves care_instructions to de-AT"
  )
}

// -- Case 9: getLocalizedField convenience ----------------------------------
section("9. getLocalizedField convenience function")

{
  const metadata = {
    key_features: JSON.stringify({
      en: ["Handmade"],
      "de-AT": ["Handgefertigt"],
    }),
    other: "plain",
  }
  const features = getLocalizedField(metadata, "key_features", LOCALE)

  assert(
    deepEqual(features, ["Handmade"]),
    "getLocalizedField extracts and resolves a single field"
  )
}

// -- Case 10: null / undefined / empty metadata -----------------------------
section("10. Edge cases: null, undefined, empty")

{
  assert(
    deepEqual(getLocalizedMetadata(null, LOCALE), {}),
    "null metadata → {}"
  )
  assert(
    deepEqual(getLocalizedMetadata(undefined, LOCALE), {}),
    "undefined metadata → {}"
  )
  assert(
    deepEqual(getLocalizedMetadata({}, LOCALE), {}),
    "empty metadata → {}"
  )
}

// -- Case 11: pot (structured key) with JSON string -------------------------
section("11. pot metadata as JSON string")

{
  const metadata = {
    pot: JSON.stringify({ width: 20, depth: 15, height: 18, finish: "Glossy" }),
  }
  const result = getLocalizedMetadata(metadata, LOCALE)

  assert(
    deepEqual(result.pot, { width: 20, depth: 15, height: 18, finish: "Glossy" }),
    "deserialises pot JSON string to object"
  )
}

// -- Case 12: locale object with mixed scalar and array values ---------------
section("12. Locale object with mixed scalar and array values")

{
  const metadata = {
    key_features: {
      en: ["Handmade", "Unique"],
      "de-AT": ["Handgefertigt", "Einzigartig"],
    },
    care_instructions: {
      en: "Dust gently.",
      "de-AT": "Vorsichtig abstauben.",
    },
  }
  const result = getLocalizedMetadata(metadata, LOCALE)

  assert(
    deepEqual(result.key_features, ["Handmade", "Unique"]),
    "resolves array-valued locale field"
  )
  assert(
    result.care_instructions === "Dust gently.",
    "resolves scalar-valued locale field"
  )
}

// ===========================================================================
console.log(`\n${"─".repeat(40)}`)
console.log(`Passed: ${passed}  Failed: ${failed}`)
if (failed > 0) {
  console.error("SOME TESTS FAILED")
  process.exit(1)
} else {
  console.log("All tests passed.")
}
