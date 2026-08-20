/**
 * Regression tests for country-based money formatting.
 *
 * Run:  npx tsx src/lib/util/money.test.ts
 *
 * Covers:
 *  1. Country determines the formatting locale (de/at/hu/fr/es/nl/pl/it)
 *  2. HUF keeps 0 decimals (Medusa decimal_digits = 0)
 *  3. Currency fallback when the country is unknown
 *  4. Missing currency_code fallback preserved
 *  5. Explicit `locale` override wins over country
 *  6. Cart/order shipping-country helpers
 */

import { convertToLocale } from "./money"
import {
  getCartCountryCode,
  getFormattingLocale,
  getOrderCountryCode,
} from "./country-locale"

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

function section(title: string) {
  console.log(`\n${title}`)
}

// Normalise NBSP/U+202F group separators so assertions stay readable.
type FormatParams = Parameters<typeof convertToLocale>[0]
const fmt = (params: FormatParams) =>
  convertToLocale(params).replace(/[  ]/g, " ")

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

// -- Case 1: country determines the formatting locale ------------------------
section("1. Country determines the formatting locale (EUR)")

assert(
  fmt({ amount: 2750, currency_code: "EUR", countryCode: "de" }) ===
    "2.750,00 €",
  "de → de-DE: 2.750,00 €"
)
assert(
  fmt({ amount: 2750, currency_code: "EUR", countryCode: "at" }) ===
    "€ 2.750,00",
  "at → de-AT: € 2.750,00"
)
assert(
  fmt({ amount: 2750, currency_code: "EUR", countryCode: "hu" }) ===
    "2750,00 EUR",
  "hu + EUR → hu-HU: 2750,00 EUR"
)
assert(
  fmt({ amount: 2750, currency_code: "EUR", countryCode: "fr" }) ===
    "2 750,00 €",
  "fr → fr-FR: 2 750,00 €"
)
assert(
  fmt({ amount: 2750, currency_code: "EUR", countryCode: "es" }) ===
    "2750,00 €",
  "es → es-ES: 2750,00 €"
)
assert(
  fmt({ amount: 2750, currency_code: "EUR", countryCode: "nl" }) ===
    "€ 2.750,00",
  "nl → nl-NL: € 2.750,00"
)
assert(
  fmt({ amount: 2750, currency_code: "EUR", countryCode: "pl" }) ===
    "2750,00 €",
  "pl → pl-PL: 2750,00 €"
)
assert(
  fmt({ amount: 2750, currency_code: "EUR", countryCode: "it" }) ===
    "2750,00 €",
  "it → it-IT: 2750,00 €"
)
assert(
  fmt({ amount: 19.99, currency_code: "EUR", countryCode: "de" }) ===
    "19,99 €",
  "de: fractional amount keeps comma decimals"
)
assert(
  fmt({ amount: 2750000, currency_code: "EUR", countryCode: "de" }) ===
    "2.750.000,00 €",
  "de: 5+ digit amounts group with dots"
)

// -- Case 2: HUF keeps 0 decimals --------------------------------------------
section("2. HUF zero-decimal (Medusa decimal_digits = 0)")

assert(
  fmt({ amount: 2750, currency_code: "HUF", countryCode: "hu" }) ===
    "2750 Ft",
  "hu + HUF: 2750 Ft (no decimals; hu only groups from 5 digits)"
)
assert(
  fmt({ amount: 27500, currency_code: "HUF", countryCode: "hu" }) ===
    "27 500 Ft",
  "hu + HUF: 5-digit amounts group: 27 500 Ft"
)
assert(
  fmt({ amount: 2750, currency_code: "JPY", countryCode: "us" }) === "¥2,750",
  "JPY keeps Intl-native zero decimals"
)

// -- Case 3: fallbacks --------------------------------------------------------
section("3. Fallback chain: country → currency → en-US")

assert(
  fmt({ amount: 2750, currency_code: "EUR" }) === "€2,750.00",
  "no country, EUR → en-IE: €2,750.00"
)
assert(
  fmt({ amount: 2750, currency_code: "HUF" }) === "2750 Ft",
  "no country, HUF → hu-HU currency fallback"
)
assert(
  fmt({ amount: 2750, currency_code: "USD", countryCode: "zz" }) ===
    "$2,750.00",
  "unknown country → currency fallback (usd → en-US)"
)
assert(
  getFormattingLocale({ countryCode: "de" }) === "de-DE",
  "getFormattingLocale: de → de-DE"
)
assert(
  getFormattingLocale({ countryCode: "DE" }) === "de-DE",
  "getFormattingLocale: case-insensitive country lookup"
)
assert(
  getFormattingLocale({ countryCode: "cy" }) === "el-CY",
  "getFormattingLocale: cy → el-CY (EU-27 coverage)"
)
assert(
  getFormattingLocale({ currency_code: "EUR" }) === "en-IE",
  "getFormattingLocale: unknown country falls back to currency"
)
assert(
  getFormattingLocale({}) === "en-US",
  "getFormattingLocale: empty input → en-US"
)

// -- Case 4: missing currency / explicit locale ------------------------------
section("4. Missing currency and explicit locale escape hatch")

assert(
  convertToLocale({ amount: 2750, currency_code: "" }) === "2750",
  "empty currency_code returns the raw amount (preserved behaviour)"
)
assert(
  fmt({
    amount: 2750,
    currency_code: "EUR",
    countryCode: "de",
    locale: "fr-FR",
  }) === "2 750,00 €",
  "explicit locale overrides country"
)

// -- Case 5: cart/order shipping-country helpers -----------------------------
section("5. Cart/order shipping-country helpers")

assert(
  getCartCountryCode({ shipping_address: { country_code: "de" } }) === "de",
  "getCartCountryCode reads shipping_address.country_code"
)
assert(
  getCartCountryCode({}) === undefined,
  "getCartCountryCode: missing shipping_address → undefined"
)
assert(
  getCartCountryCode({ shipping_address: null }) === undefined,
  "getCartCountryCode: null shipping_address → undefined"
)
assert(getCartCountryCode(null) === undefined, "getCartCountryCode: null → undefined")
assert(
  getOrderCountryCode({ shipping_address: { country_code: "hu" } }) === "hu",
  "getOrderCountryCode reads the order's own shipping country"
)

// ===========================================================================
console.log(`\n${"─".repeat(40)}`)
console.log(`Passed: ${passed}  Failed: ${failed}`)
if (failed > 0) {
  console.error("SOME TESTS FAILED")
  process.exit(1)
} else {
  console.log("All tests passed.")
}
