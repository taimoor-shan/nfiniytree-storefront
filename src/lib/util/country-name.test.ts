/**
 * Country names in the visitor's language: the address form's country list
 * used to show Medusa's English names ("Austria") on German and Hungarian
 * pages.
 *
 * Run:  npx tsx src/lib/util/country-name.test.ts
 */
import assert from "node:assert/strict"
import type { HttpTypes } from "@medusajs/types"
import { getAddressCountryName, getCountryName } from "./country-name"
import { getCountryOptions } from "./regions"

// Each language names the countries its own way
assert.equal(getCountryName("at", "de-AT", "Austria"), "Österreich")
assert.equal(getCountryName("AT", "de-DE", "Austria"), "Österreich")
assert.equal(getCountryName("de", "de-AT", "Germany"), "Deutschland")
assert.equal(getCountryName("hu", "de-DE", "Hungary"), "Ungarn")
assert.equal(getCountryName("at", "hu-HU", "Austria"), "Ausztria")
assert.equal(getCountryName("hu", "hu-HU", "Hungary"), "Magyarország")

// English is Medusa's own text, exactly as the admin has it
assert.equal(getCountryName("at", "en", "Austria"), "Austria")
assert.equal(getCountryName("cz", "en", "Czech Republic"), "Czech Republic")
assert.equal(getCountryName("at", null, "Austria"), "Austria")
assert.equal(getCountryName("at", "", "Austria"), "Austria")

// Anything it cannot name keeps Medusa's name
assert.equal(getCountryName(null, "de-AT", "Nowhere"), "Nowhere")
assert.equal(getCountryName("", "de-AT", "Nowhere"), "Nowhere")
assert.equal(getCountryName("qq", "de-AT", "Qqland"), "Qqland")
assert.equal(getCountryName("not-a-code", "de-AT", "Qqland"), "Qqland")

// An address stores only the code: it is named in every language, English too
assert.equal(getAddressCountryName("at", "de-AT"), "Österreich")
assert.equal(getAddressCountryName("AT", "de-DE"), "Österreich")
assert.equal(getAddressCountryName("hu", "de-DE"), "Ungarn")
assert.equal(getAddressCountryName("at", "hu-HU"), "Ausztria")
assert.equal(getAddressCountryName("hu", "en"), "Hungary")
assert.equal(getAddressCountryName("at", null), "Austria")
assert.equal(getAddressCountryName("de", ""), "Germany")

// Nothing to name: no country at all, or a code nobody knows, shown as it is
assert.equal(getAddressCountryName(null, "de-AT"), "")
assert.equal(getAddressCountryName(undefined, "en"), "")
assert.equal(getAddressCountryName("", "de-AT"), "")
assert.equal(getAddressCountryName("qq", "de-AT"), "QQ")
assert.equal(getAddressCountryName("not-a-code", "en"), "NOT-A-CODE")

// The list: named and sorted in the visitor's language
const regions = [
  {
    id: "reg_europe",
    countries: [
      { iso_2: "at", display_name: "Austria" },
      { iso_2: "de", display_name: "Germany" },
    ],
  },
  { id: "reg_hungary", countries: [{ iso_2: "hu", display_name: "Hungary" }] },
] as unknown as HttpTypes.StoreRegion[]

const labels = (locale?: string | null) =>
  getCountryOptions(regions, locale).map((o) => `${o.country}:${o.label}`)

assert.deepEqual(labels(), ["at:Austria", "de:Germany", "hu:Hungary"])
assert.deepEqual(labels("en"), ["at:Austria", "de:Germany", "hu:Hungary"])
assert.deepEqual(labels("de-AT"), [
  "de:Deutschland",
  "at:Österreich",
  "hu:Ungarn",
])
assert.deepEqual(labels("hu-HU"), [
  "at:Ausztria",
  "hu:Magyarország",
  "de:Németország",
])

// The value a form posts and the region it belongs to do not change
assert.deepEqual(
  getCountryOptions(regions, "de-AT").map((o) => [o.country, o.region]),
  [
    ["de", "reg_europe"],
    ["at", "reg_europe"],
    ["hu", "reg_hungary"],
  ]
)

console.log("country-name.test.ts: ok")
