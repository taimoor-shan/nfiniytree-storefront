/**
 * The European countries the checkout takes delivery requests for.
 *
 * Run:  npx tsx src/lib/util/delivery-on-request.test.ts
 */
import assert from "node:assert/strict"
import type { HttpTypes } from "@medusajs/types"
import {
  EUROPEAN_COUNTRIES,
  isDeliveryOnRequest,
  onRequestCountryOptions,
} from "./delivery-on-request"

const regions = [
  { id: "reg_eur", countries: [{ iso_2: "at" }, { iso_2: "de" }] },
  { id: "reg_huf", countries: [{ iso_2: "hu" }] },
] as unknown as HttpTypes.StoreRegion[]

// The countries of the regions are ordinary checkout countries
assert.equal(isDeliveryOnRequest("at", regions), false)
assert.equal(isDeliveryOnRequest("HU", regions), false)

// Every other European country is on request
assert.equal(isDeliveryOnRequest("gr", regions), true)
assert.equal(isDeliveryOnRequest("GB", regions), true)
assert.equal(isDeliveryOnRequest("ch", regions), true)

// Outside Europe, or nothing chosen, is not
assert.equal(isDeliveryOnRequest("us", regions), false)
assert.equal(isDeliveryOnRequest("", regions), false)
assert.equal(isDeliveryOnRequest(null, regions), false)

// The list leaves the region countries out and is sorted by name
const en = onRequestCountryOptions(regions, "en")
assert.equal(en.length, EUROPEAN_COUNTRIES.length - 3)
assert.ok(!en.some((o) => ["at", "de", "hu"].includes(o.value)))
assert.deepEqual(
  en.slice(0, 2).map((o) => o.label),
  ["Belgium", "Bulgaria"]
)
assert.equal(en.find((o) => o.value === "gr")?.label, "Greece")

// … in the visitor's language
const de = onRequestCountryOptions(regions, "de-AT")
assert.equal(de.find((o) => o.value === "gr")?.label, "Griechenland")
assert.equal(de[0].label, "Belgien")

// A country that gets a region leaves the list by itself
const withGreece = [
  ...regions,
  { id: "reg_gr", countries: [{ iso_2: "gr" }] },
] as unknown as HttpTypes.StoreRegion[]
assert.equal(isDeliveryOnRequest("gr", withGreece), false)

console.log("delivery-on-request: all assertions passed")
