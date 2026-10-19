/**
 * Run:  npx tsx src/lib/i18n/market.test.ts
 */
import assert from "node:assert/strict"

import {
  localeForSegment,
  marketPrefix,
  marketVariants,
  matchLocale,
  parseMarketSegment,
  preferredMarketPrefix,
  stripMarketPrefix,
} from "./market"

// Parsing
assert.deepEqual(parseMarketSegment("hu"), { country: "hu", language: null })
assert.deepEqual(parseMarketSegment("EN-HU"), { country: "hu", language: "en" })
assert.equal(parseMarketSegment("store"), null)
assert.equal(parseMarketSegment("en-hun"), null)
assert.equal(parseMarketSegment(undefined), null)

// Locale per URL: only a URL with a supported language is served
for (const country of ["hu", "at", "de"]) {
  assert.equal(localeForSegment({ country, language: "en" }), "en")
  assert.equal(
    localeForSegment({ country, language: "de" }),
    country === "at" ? "de-AT" : "de-DE"
  )
  // A bare country or an unsupported language is redirected, not served
  assert.equal(localeForSegment({ country, language: null }), null)
  assert.equal(localeForSegment({ country, language: "hu" }), null)
}

// Prefix: always language plus country, both languages in all three countries
for (const country of ["hu", "at", "de"]) {
  assert.equal(marketPrefix(country, "en"), `en-${country}`)
  assert.equal(marketPrefix(country, ""), `en-${country}`)
  assert.equal(marketPrefix(country, "de-AT"), `de-${country}`)
  assert.equal(marketPrefix(country, "de-DE"), `de-${country}`)
}
assert.equal(marketPrefix("de", "de-DE"), "de-de")
// A language the URL cannot carry falls back to the country's usual one
assert.equal(marketPrefix("hu", "hu-HU"), "en-hu")
assert.equal(marketPrefix("at", "fr-FR"), "de-at")

// No language in the URL: the visitor's pick, else the country's usual one
assert.equal(preferredMarketPrefix("hu", undefined), "en-hu")
assert.equal(preferredMarketPrefix("at", undefined), "de-at")
assert.equal(preferredMarketPrefix("de", null), "de-de")
assert.equal(preferredMarketPrefix("de", ""), "en-de")
assert.equal(preferredMarketPrefix("hu", "de-AT"), "de-hu")

assert.deepEqual(marketVariants("at"), [
  { prefix: "en-at", hreflang: "en-AT" },
  { prefix: "de-at", hreflang: "de-AT" },
])

// German saved in one variant serves every German market
assert.equal(matchLocale("de-DE", ["de-AT"]), "de-AT")
assert.equal(matchLocale("de-AT", ["de-DE", "de-AT"]), "de-AT")
assert.equal(matchLocale("de-DE", ["de-DE", "de-AT"]), "de-DE")
assert.equal(matchLocale("de-DE", []), "de-DE")
assert.equal(matchLocale("de-DE", null), "de-DE")
assert.equal(matchLocale("de-DE", ["en-US"]), "de-DE")

// Paths
assert.equal(stripMarketPrefix("/en-hu/store"), "/store")
assert.equal(stripMarketPrefix("/hu"), "")
assert.equal(stripMarketPrefix("/de-de/products/olive"), "/products/olive")
assert.equal(stripMarketPrefix("/store"), "/store")

console.log("market: all assertions passed")
