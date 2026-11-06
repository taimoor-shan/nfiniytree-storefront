/**
 * The European countries the checkout takes delivery requests for.
 *
 * Run:  npx tsx src/lib/util/delivery-on-request.test.ts
 */
import assert from "node:assert/strict"
import type { HttpTypes } from "@medusajs/types"
import {
  EUROPEAN_COUNTRIES,
  checkoutStartCountry,
  chooserStartCountry,
  isDeliveryOnRequest,
  onRequestCountryOptions,
  onRequestMarket,
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

// A visitor whose country is on request is shown euro prices: the market they
// are in when it sells in euro…
const huf = { id: "reg_huf", currency_code: "huf", countries: [{ iso_2: "hu" }] }
const priced = [
  { id: "reg_eur", currency_code: "eur", countries: [{ iso_2: "at" }, { iso_2: "de" }] },
  huf,
] as unknown as HttpTypes.StoreRegion[]
assert.equal(onRequestMarket(priced, "de"), "de")
assert.equal(onRequestMarket(priced, "AT"), "at")
// … else Austria, never forints
assert.equal(onRequestMarket(priced, "hu"), "at")
assert.equal(onRequestMarket(priced, null), "at")
// Germany when Austria sells in no euro region, then any euro country
const regionsOf = (...list: unknown[]) => list as unknown as HttpTypes.StoreRegion[]
assert.equal(
  onRequestMarket(regionsOf({ id: "r", currency_code: "eur", countries: [{ iso_2: "de" }] }, huf), "hu"),
  "de"
)
assert.equal(
  onRequestMarket(regionsOf({ id: "r", currency_code: "EUR", countries: [{ iso_2: "nl" }] }, huf), "hu"),
  "nl"
)
// No euro region at all: the visitor stays where they are
assert.equal(onRequestMarket(regionsOf(huf), "hu"), "hu")

// The country chooser (popup, header) starts on a country on request the
// visitor chose, else where they are when that is on request, else the market
assert.equal(chooserStartCountry({ market: "at", chosen: "fr", geo: "it", regions: priced }), "fr")
assert.equal(chooserStartCountry({ market: "at", chosen: null, geo: "IT", regions: priced }), "it")
assert.equal(chooserStartCountry({ market: "at", chosen: null, geo: "hu", regions: priced }), "at")
assert.equal(chooserStartCountry({ market: "at", chosen: null, geo: "us", regions: priced }), "at")
assert.equal(chooserStartCountry({ market: "de", chosen: "zz", geo: null, regions: priced }), "de")

// The checkout opens as a quote request for a country on request the visitor
// chose, until they have an address of their own in the cart
const empty = { country_code: "at" }
const filled = { country_code: "at", first_name: "Anna", address_1: "Ring 1" }
assert.equal(checkoutStartCountry({ chosen: "fr", cartAddress: empty, regions: priced }), "fr")
assert.equal(checkoutStartCountry({ chosen: "FR", cartAddress: null, regions: priced }), "fr")
assert.equal(checkoutStartCountry({ chosen: "fr", cartAddress: filled, regions: priced }), null)
assert.equal(checkoutStartCountry({ chosen: "at", cartAddress: empty, regions: priced }), null)
assert.equal(checkoutStartCountry({ chosen: null, cartAddress: empty, regions: priced }), null)

console.log("delivery-on-request: all assertions passed")
