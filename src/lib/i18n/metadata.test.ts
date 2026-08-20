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

import {
  getLocalizedMetadata,
  getLocalizedField,
  resolvePotLabel,
  resolvePotSpecs,
  resolveSpecField,
} from "./metadata"

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

// -- Case 13: resolveSpecField -------------------------------------------------
section("13. resolveSpecField")

{
  assert(
    deepEqual(
      resolveSpecField({ value: 40, label: "Breite" }, "Width"),
      { label: "Breite", value: "40" }
    ),
    "structured field resolves label and value"
  )
  assert(
    deepEqual(resolveSpecField({ value: 40 }, "Width"), {
      label: "Width",
      value: "40",
    }),
    "structured field without label falls back to the key"
  )
  assert(
    deepEqual(resolveSpecField(40, "Width"), {
      label: "Width",
      value: "40",
    }),
    "flat scalar resolves with fallback label"
  )
  assert(
    resolveSpecField(null, "Width") === null,
    "null field resolves to null"
  )
  assert(
    resolveSpecField(undefined, "Width") === null,
    "undefined field resolves to null"
  )
  assert(
    resolveSpecField({ label: "Breite" }, "Width") === null,
    "structured field without value resolves to null"
  )
  assert(
    resolveSpecField({ value: "" }, "Width") === null,
    "structured field with empty value resolves to null"
  )
}

// -- Case 14: resolvePotSpecs with backend-managed labels ---------------------
section("14. resolvePotSpecs with structured { value, label } shape")

{
  const rawPot = {
    width: {
      value: 40,
      label: { en: "Width", "de-AT": "Breite", "de-DE": "Breite", "hu-HU": "Szélesség" },
    },
    depth: {
      value: 40,
      label: { en: "Depth", "de-AT": "Tiefe", "de-DE": "Tiefe", "hu-HU": "Mélység" },
    },
    height: {
      value: 80,
      label: { en: "Height", "de-AT": "Höhe", "de-DE": "Höhe", "hu-HU": "Magasság" },
    },
    unit: { en: "cm", "de-AT": "cm", "de-DE": "cm", "hu-HU": "cm" },
    material: {
      label: { en: "Material", "de-AT": "Material", "de-DE": "Material", "hu-HU": "Anyag" },
      value: {
        en: "High-quality luxury glossy acrylic",
        "de-AT": "Hochwertiges, luxuriöses Hochglanz-Acryl",
        "de-DE": "Hochwertiges, luxuriöses Hochglanz-Acryl",
        "hu-HU": "Kiváló minőségű, fényes prémium akril",
      },
    },
  }

  const metadata = getLocalizedMetadata({ pot: rawPot }, "de-AT")
  const specs = resolvePotSpecs(metadata.pot)

  assert(
    deepEqual(specs, [
      { label: "Höhe", value: "80 cm" },
      { label: "Breite", value: "40 cm" },
      { label: "Tiefe", value: "40 cm" },
      { label: "Material", value: "Hochwertiges, luxuriöses Hochglanz-Acryl" },
    ]),
    "resolves structured pot fields to localized label/value pairs (de-AT)"
  )

  const specsHu = resolvePotSpecs(
    getLocalizedMetadata({ pot: rawPot }, "hu-HU").pot
  )
  assert(
    deepEqual(specsHu, [
      { label: "Magasság", value: "80 cm" },
      { label: "Szélesség", value: "40 cm" },
      { label: "Mélység", value: "40 cm" },
      { label: "Anyag", value: "Kiváló minőségű, fényes prémium akril" },
    ]),
    "resolves structured pot fields for hu-HU"
  )
}

// -- Case 15: resolvePotSpecs with legacy flat shape --------------------------
section("15. resolvePotSpecs with legacy flat shape")

{
  const specs = resolvePotSpecs({
    width: 20,
    depth: 15,
    height: 18,
    unit: "cm",
    material: "Acrylic",
    finish: "Glossy",
  })

  assert(
    deepEqual(specs, [
      { label: "Height", value: "18 cm" },
      { label: "Width", value: "20 cm" },
      { label: "Depth", value: "15 cm" },
      { label: "Material", value: "Acrylic" },
      { label: "Finish", value: "Glossy" },
    ]),
    "flat pot fields resolve with key fallback labels and unit suffix"
  )

  assert(
    deepEqual(resolvePotSpecs({ height: 80 }), [
      { label: "Height", value: "80 cm" },
    ]),
    "missing unit defaults to cm"
  )
}

// -- Case 16: resolvePotSpecs edge cases --------------------------------------
section("16. resolvePotSpecs edge cases")

{
  assert(deepEqual(resolvePotSpecs(undefined), []), "undefined pot → empty list")
  assert(deepEqual(resolvePotSpecs(null), []), "null pot → empty list")
  assert(deepEqual(resolvePotSpecs({}), []), "empty pot → empty list")
  assert(
    deepEqual(resolvePotSpecs("not an object" as any), []),
    "non-object pot → empty list"
  )
  assert(
    deepEqual(
      resolvePotSpecs({ width: { value: 40, label: "Breite" }, size: "Medium" }),
      [{ label: "Breite", value: "40 cm" }]
    ),
    "size is excluded from spec rows (rendered in the heading instead)"
  )
}

// -- Case 17: fallback label localization --------------------------------------
section("17. resolvePotSpecs with fallback label localization")

{
  // Dictionary stub for de-AT
  const deDict: Record<string, string> = {
    "product.width": "Breite",
    "product.depth": "Tiefe",
    "product.height": "Höhe",
    "product.material": "Material",
    "product.finish": "Oberfläche",
    "product.care": "Pflege",
  }
  const deT = (key: string, fallback?: string) =>
    deDict[key] ?? fallback ?? key
  const localize = (label: string) => resolvePotLabel(deT, label)

  assert(
    deepEqual(
      resolvePotSpecs(
        { width: 20, depth: 15, height: 18, unit: "cm", material: "Acrylic" },
        localize
      ),
      [
        { label: "Höhe", value: "18 cm" },
        { label: "Breite", value: "20 cm" },
        { label: "Tiefe", value: "15 cm" },
        { label: "Material", value: "Acrylic" },
      ]
    ),
    "flat pot fields resolve to translated fallback labels (de-AT)"
  )

  assert(
    deepEqual(
      resolvePotSpecs(
        { width: { value: 40, label: "Szélesség" }, unit: "cm" },
        localize
      ),
      [{ label: "Szélesség", value: "40 cm" }]
    ),
    "backend-provided labels pass through untouched even with a localizer"
  )

  assert(
    resolvePotLabel(deT, "Width") === "Breite" &&
      resolvePotLabel(deT, "Breite") === "Breite" &&
      resolvePotLabel(deT, "Custom label") === "Custom label",
    "resolvePotLabel translates known labels and passes through the rest"
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
