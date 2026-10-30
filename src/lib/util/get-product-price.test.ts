/**
 * Run:  npx tsx src/lib/util/get-product-price.test.ts
 */
import assert from "node:assert/strict"

import { getProductPrice, isPriceOnRequest } from "./get-product-price"

const priced = (id: string, amount: number) => ({
  id,
  calculated_price: {
    calculated_amount: amount,
    original_amount: amount,
    currency_code: "eur",
    calculated_price: { price_list_type: null },
  },
})

const product = (variants: unknown) => ({ id: "prod_1", variants }) as any

// No variant has a price: the Blue Cascade case
assert.equal(isPriceOnRequest(product([{ id: "a" }, { id: "b" }])), true)
assert.equal(
  isPriceOnRequest(product([{ id: "a", calculated_price: null }])),
  true,
  "a variant the market resolved no price for"
)
assert.equal(isPriceOnRequest(product([])), true, "no variants")
assert.equal(isPriceOnRequest(product(undefined)), true, "no variants at all")

// A zero is not a price, whatever the shop meant by it
assert.equal(isPriceOnRequest(product([priced("a", 0)])), true)

// One priced variant is enough for the product to show a price
assert.equal(isPriceOnRequest(product([{ id: "a" }, priced("b", 120)])), false)
assert.equal(isPriceOnRequest(product([priced("a", 120)])), false)

// A zero-price variant does not hide the priced ones from "From <price>"
const mixed = getProductPrice({
  product: product([priced("zero", 0), priced("b", 300), priced("c", 120)]),
})
assert.equal(mixed.cheapestPrice?.calculated_price_number, 120)

// The price of one variant
const one = getProductPrice({
  product: product([{ id: "a" }, priced("b", 120)]),
  variantId: "a",
})
assert.equal(one.variantPrice, null, "a variant without a price has none")

console.log("get-product-price.test.ts: ok")
