/**
 * The variant a product page opens on: the one the buy box preselects, and so
 * the one the gallery opens on. The server works it out for the first render
 * and the browser for the preselection, from the same product, so the two
 * always agree and the gallery never flashes from one plant to another.
 *
 * Run:  npx tsx src/lib/util/default-variant.test.ts
 */
import assert from "node:assert/strict"
import {
  getDefaultChoice,
  isVariantAvailable,
  optionsAsKeymap,
} from "./default-variant"

let passed = 0
const test = (name: string, run: () => void) => {
  run()
  passed++
  console.log(`  ✓ ${name}`)
}

const POD = "opt_pod"
const PLANT = "opt_plant"

const inStock = { manage_inventory: true, inventory_quantity: 5 }
const soldOut = {
  manage_inventory: true,
  inventory_quantity: 0,
  allow_backorder: false,
}

const priced = (amount: number) => ({
  calculated_price: {
    calculated_amount: amount,
    original_amount: amount,
    currency_code: "eur",
    calculated_price: { price_list_type: null },
  },
})

const variant = (
  id: string,
  choices: Record<string, string>,
  extra: Record<string, unknown> = {}
) => ({
  id,
  options: Object.entries(choices).map(([option_id, value]) => ({
    option_id,
    value,
  })),
  ...extra,
})

const product = (variants?: unknown) => ({ id: "prod_1", variants }) as any

console.log("What a variant's options are, and whether it can be bought")

test("a variant's options as option id → value", () => {
  assert.deepEqual(
    optionsAsKeymap(variant("v", { [POD]: "Gold", [PLANT]: "Green" }).options as any),
    { [POD]: "Gold", [PLANT]: "Green" }
  )
  assert.equal(optionsAsKeymap(null), undefined)
})

test("stock that is not tracked, a backorder or a unit in stock can be bought", () => {
  assert.equal(isVariantAvailable({ manage_inventory: false } as any), true)
  assert.equal(
    isVariantAvailable({ ...soldOut, allow_backorder: true } as any),
    true
  )
  assert.equal(isVariantAvailable(inStock as any), true)
})

test("tracked stock that is gone cannot", () => {
  assert.equal(isVariantAvailable(soldOut as any), false)
  assert.equal(
    isVariantAvailable({ manage_inventory: true } as any),
    false,
    "no quantity at all"
  )
})

console.log("\nThe variant the page opens on")

test("the first variant that can be bought", () => {
  const maple = product([
    variant("black", { [POD]: "Black" }, { ...priced(100), ...soldOut }),
    variant("gold", { [POD]: "Gold" }, { ...priced(100), ...inStock }),
    variant("white", { [POD]: "White" }, { ...priced(100), ...inStock }),
  ])
  assert.deepEqual(getDefaultChoice(maple), { [POD]: "Gold" })
})

test("both options of a two-option variant", () => {
  const plant = product([
    variant("a", { [POD]: "Gold", [PLANT]: "Green" }, { ...priced(100), ...inStock }),
    variant("b", { [POD]: "Gold", [PLANT]: "Variegated" }, { ...priced(100), ...inStock }),
  ])
  assert.deepEqual(getDefaultChoice(plant), { [POD]: "Gold", [PLANT]: "Green" })
})

test("the first variant when none can be bought but the piece has a price", () => {
  const gone = product([
    variant("black", { [POD]: "Black" }, { ...priced(100), ...soldOut }),
    variant("gold", { [POD]: "Gold" }, { ...priced(100), ...soldOut }),
  ])
  assert.deepEqual(getDefaultChoice(gone), { [POD]: "Black" })
})

test("a single variant", () => {
  const single = product([
    variant("only", { [POD]: "Default" }, { ...priced(100), ...soldOut }),
  ])
  assert.deepEqual(getDefaultChoice(single), { [POD]: "Default" })
})

test("none when the price depends on the variant: the shopper picks first", () => {
  const ranged = product([
    variant("small", { [POD]: "Small" }, { ...priced(100), ...inStock }),
    variant("large", { [POD]: "Large" }, { ...priced(300), ...inStock }),
  ])
  assert.deepEqual(getDefaultChoice(ranged), {})
})

test("none when there is no price and nothing in stock: the sign-up is for the product", () => {
  const nothing = product([
    variant("a", { [POD]: "Gold" }, soldOut),
    variant("b", { [POD]: "Black" }, soldOut),
  ])
  assert.deepEqual(getDefaultChoice(nothing), {})
})

test("the first variant when there is no price but the stock is not tracked", () => {
  const request = product([
    variant("a", { [POD]: "Gold" }, { manage_inventory: false }),
    variant("b", { [POD]: "Black" }, { manage_inventory: false }),
  ])
  assert.deepEqual(getDefaultChoice(request), { [POD]: "Gold" })
})

test("none for a product without variants", () => {
  assert.deepEqual(getDefaultChoice(product([])), {})
  assert.deepEqual(getDefaultChoice(product(undefined)), {})
})

console.log(`\n${passed} passed`)
