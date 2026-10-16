/**
 * Run:  npx tsx src/lib/i18n/market.test.ts
 */
import assert from "node:assert/strict"

import {
  localeForSegment,
  marketPrefix,
  marketVariants,
  parseMarketSegment,
  stripMarketPrefix,
} from "./market"

// Parsing
assert.deepEqual(parseMarketSegment("hu"), { country: "hu", language: null })
assert.deepEqual(parseMarketSegment("EN-HU"), { country: "hu", language: "en" })
assert.equal(parseMarketSegment("store"), null)
assert.equal(parseMarketSegment("en-hun"), null)
assert.equal(parseMarketSegment(undefined), null)

// Locale per URL
assert.equal(localeForSegment({ country: "hu", language: null }), "hu-HU")
assert.equal(localeForSegment({ country: "at", language: null }), "de-AT")
assert.equal(localeForSegment({ country: "us", language: null }), "en")
assert.equal(localeForSegment({ country: "hu", language: "en" }), "en")
assert.equal(localeForSegment({ country: "hu", language: "de" }), "de-DE")
assert.equal(localeForSegment({ country: "at", language: "de" }), "de-AT")
assert.equal(localeForSegment({ country: "hu", language: "fr" }), null)

// Prefix per locale: the country's own language never gets a language part
assert.equal(marketPrefix("hu", "hu-HU"), "hu")
assert.equal(marketPrefix("hu", "en"), "en-hu")
assert.equal(marketPrefix("hu", ""), "en-hu")
assert.equal(marketPrefix("hu", "de-AT"), "de-hu")
assert.equal(marketPrefix("at", "de-DE"), "at")
assert.equal(marketPrefix("at", "hu-HU"), "hu-at")
assert.equal(marketPrefix("de", "en-US"), "en-de")
assert.equal(marketPrefix("us", "en"), "us")
assert.equal(marketPrefix("hu", "fr-FR"), "hu")

assert.deepEqual(marketVariants("at"), [
  { prefix: "en-at", hreflang: "en-AT" },
  { prefix: "at", hreflang: "de-AT" },
  { prefix: "hu-at", hreflang: "hu-AT" },
])

// Paths
assert.equal(stripMarketPrefix("/en-hu/store"), "/store")
assert.equal(stripMarketPrefix("/hu"), "")
assert.equal(stripMarketPrefix("/hu/products/olive"), "/products/olive")
assert.equal(stripMarketPrefix("/store"), "/store")

console.log("market: all assertions passed")
