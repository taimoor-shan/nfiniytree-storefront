/**
 * The payment status of an order, in words the customer reads: they used to
 * be English on every page ("Awaiting Payment" under "Zahlungsstatus:").
 *
 * Run:  npx tsx src/lib/constants.test.ts
 */
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { PAYMENT_STATUS_KEYS, getPaymentStatusLabel } from "./constants"

const DIR = path.join(__dirname, "../i18n/dictionaries")
const LOCALES = ["en", "de-AT", "de-DE", "hu-HU"]

const dictionaries = Object.fromEntries(
  LOCALES.map((locale) => [
    locale,
    JSON.parse(fs.readFileSync(path.join(DIR, `${locale}.json`), "utf8")) as Record<
      string,
      string
    >,
  ])
)
const translator = (locale: string) => (key: string) =>
  dictionaries[locale][key] ?? key

// Every status Medusa gives an order (`StoreOrder["payment_status"]`)
const MEDUSA_STATUSES = [
  "not_paid",
  "awaiting",
  "authorized",
  "partially_authorized",
  "captured",
  "partially_captured",
  "partially_refunded",
  "refunded",
  "canceled",
  "requires_action",
]

for (const status of MEDUSA_STATUSES) {
  assert.ok(PAYMENT_STATUS_KEYS[status], `${status} has wording`)
}

// Each wording exists in every language, and is not English where it should not be
for (const key of Array.from(new Set(Object.values(PAYMENT_STATUS_KEYS)))) {
  for (const locale of LOCALES) {
    const text = dictionaries[locale][key]
    assert.ok(text && text.trim(), `${locale} has "${key}"`)
    if (locale !== "en") {
      assert.notEqual(text, dictionaries.en[key], `${locale} "${key}" is translated`)
    }
  }
}

// English is what it always was
const english = translator("en")
assert.equal(getPaymentStatusLabel("not_paid", english), "Awaiting Payment")
assert.equal(getPaymentStatusLabel("pending", english), "Awaiting Payment")
assert.equal(getPaymentStatusLabel("authorized", english), "Awaiting Payment")
assert.equal(getPaymentStatusLabel("requires_action", english), "Awaiting Payment")
assert.equal(getPaymentStatusLabel("captured", english), "Payment Received")
assert.equal(getPaymentStatusLabel("settled", english), "Payment Confirmed")
assert.equal(getPaymentStatusLabel("refunded", english), "Refunded")
assert.equal(getPaymentStatusLabel("partially_refunded", english), "Partially Refunded")
assert.equal(getPaymentStatusLabel("canceled", english), "Canceled")
assert.equal(getPaymentStatusLabel(undefined, english), "N/A")

// The same status in German and Hungarian
assert.equal(getPaymentStatusLabel("authorized", translator("de-AT")), "Zahlung ausstehend")
assert.equal(getPaymentStatusLabel("captured", translator("de-DE")), "Zahlung eingegangen")
assert.equal(getPaymentStatusLabel("authorized", translator("hu-HU")), "Fizetésre vár")
assert.equal(getPaymentStatusLabel(undefined, translator("de-AT")), "k. A.")

// A status nobody wrote wording for stays readable instead of raw
assert.equal(getPaymentStatusLabel("on_hold", english), "On Hold")

console.log("constants.test.ts: ok")
