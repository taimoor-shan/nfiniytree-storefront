/**
 * Run:  npx tsx src/lib/i18n/country-language.test.ts
 */
import assert from "node:assert/strict"

import { defaultLocaleForCountry } from "./country-language"

assert.equal(defaultLocaleForCountry("hu"), "hu-HU")
assert.equal(defaultLocaleForCountry("at"), "de-AT")
assert.equal(defaultLocaleForCountry("DE"), "de-DE")
// Markets without a dictionary keep the English default.
assert.equal(defaultLocaleForCountry("us"), null)
assert.equal(defaultLocaleForCountry(""), null)
assert.equal(defaultLocaleForCountry(undefined), null)

console.log("country-language: all assertions passed")
