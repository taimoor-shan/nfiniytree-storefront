/**
 * The discount an order page shows: its codes, its net amount and its label.
 *
 * Run:  npx tsx src/lib/util/discount.test.ts
 */
import assert from "node:assert/strict"
import {
  discountLabel,
  getDiscountCodes,
  getNetDiscount,
  type DiscountSource,
} from "./discount"

// A line (or shipping method) as the store API returns it: the codes sit on its adjustments
const line = (...codes: Array<string | null | undefined>) => ({
  adjustments: codes.map((code) => ({ code })),
})

let passed = 0
const test = (name: string, run: () => void) => {
  run()
  passed++
  console.log(`  ✓ ${name}`)
}

console.log("The codes behind a discount")

test("lists each code once, in the order the lines show it", () => {
  const order: DiscountSource = {
    items: [line("WELCOME"), line("WELCOME", "VIP"), line()],
  }

  assert.deepEqual(getDiscountCodes(order), ["WELCOME", "VIP"])
})

test("reads the shipping methods too, after the products", () => {
  const order: DiscountSource = {
    items: [line("A")],
    shipping_methods: [line("FREESHIP", "A")],
  }

  assert.deepEqual(getDiscountCodes(order), ["A", "FREESHIP"])
})

test("is empty when nothing was discounted", () => {
  const order: DiscountSource = {
    items: [{}, { adjustments: [] }, { adjustments: null }],
  }

  assert.deepEqual(getDiscountCodes(order), [])
})

test("skips an adjustment that has no code", () => {
  const order: DiscountSource = {
    items: [{ adjustments: [{ code: null }, { code: undefined }, { code: "" }, { code: "   " }, null] }],
  }

  assert.deepEqual(getDiscountCodes(order), [])
})

test("trims the code", () => {
  assert.deepEqual(getDiscountCodes({ items: [line("  Real007 ")] }), ["Real007"])
})

test("copes with an order that is missing or has no lines", () => {
  assert.deepEqual(getDiscountCodes(null), [])
  assert.deepEqual(getDiscountCodes(undefined), [])
  assert.deepEqual(getDiscountCodes({}), [])
})

console.log("The discount's amount")

test("is the net discount, the one that fits beside the net rows", () => {
  // A Hungarian order with a 20% code: 1 385 454 counts the VAT on the discount
  const order: DiscountSource = {
    discount_total: 1385454.43,
    discount_subtotal: 1090909,
  }
  assert.equal(getNetDiscount(order), 1090909)

  // 5 454 545 + 20 000 - 1 090 909 + 1 183 582 = 5 567 218, the order's total
  const itemSubtotal = 5454545
  const shipping = 20000
  const tax = 1183581.72
  const total = 5567217.72
  assert.equal(
    Math.round(itemSubtotal + shipping - getNetDiscount(order) + tax),
    Math.round(total)
  )
})

test("falls back to the discount with VAT when the answer carries no net one", () => {
  assert.equal(getNetDiscount({ discount_total: 1385454.43 }), 1385454.43)
  assert.equal(
    getNetDiscount({ discount_subtotal: null, discount_total: 600 }),
    600
  )
})

test("keeps a net discount of zero: no discount is an answer too", () => {
  assert.equal(getNetDiscount({ discount_subtotal: 0, discount_total: 0 }), 0)
})

test("is zero for an order that has none, or none at all", () => {
  assert.equal(getNetDiscount({}), 0)
  assert.equal(getNetDiscount(null), 0)
  assert.equal(getNetDiscount(undefined), 0)
})

console.log("The discount's label")

test("names the code", () => {
  assert.equal(discountLabel("Discount", ["Real007"]), "Discount (Real007)")
})

test("names every code of an order that used several", () => {
  assert.equal(discountLabel("Rabatt", ["A", "B"]), "Rabatt (A, B)")
})

test("is the plain word when no code explains the reduction", () => {
  assert.equal(discountLabel("Discount"), "Discount")
  assert.equal(discountLabel("Discount", []), "Discount")
  assert.equal(discountLabel("Discount", null), "Discount")
})

console.log(`\n${passed} passed`)
