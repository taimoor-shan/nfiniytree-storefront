/**
 * The order of a product's options and values set in the admin's "Option
 * order" box: options by `metadata.option_order`, values by their rank.
 *
 * Run:  npx tsx src/lib/util/option-order.test.ts
 */
import assert from "node:assert/strict"
import {
  readOptionOrder,
  sortOptionValues,
  sortProductOptions,
  sortVariantsByOptions,
  withOrderedOptions,
} from "./option-order"

let passed = 0
const test = (name: string, run: () => void) => {
  run()
  passed++
  console.log(`  ✓ ${name}`)
}

const POT = {
  id: "opt_pot",
  values: [
    { value: "Gold", rank: 2 },
    { value: "White", rank: null },
    { value: "Black", rank: 1 },
  ],
}
const PLANT = { id: "opt_plant", values: [{ value: "Rose" }, { value: "White" }] }

console.log("Option order")

test("the saved order is read from a list, or from JSON text", () => {
  assert.deepEqual(readOptionOrder({ option_order: ["a", "b"] }), ["a", "b"])
  assert.deepEqual(readOptionOrder({ option_order: '["a","b"]' }), ["a", "b"])
  assert.deepEqual(readOptionOrder({ option_order: "nonsense" }), [])
  assert.deepEqual(readOptionOrder({ option_order: [1, "a"] }), ["a"])
  assert.deepEqual(readOptionOrder(null), [])
})

test("values by rank, those without one last", () => {
  assert.deepEqual(
    sortOptionValues(POT.values).map((v) => v.value),
    ["Black", "Gold", "White"]
  )
})

test("values with no rank at all keep Medusa's order", () => {
  assert.deepEqual(
    sortOptionValues(PLANT.values).map((v) => v.value),
    ["Rose", "White"]
  )
})

test("options in the saved order, an unlisted one last", () => {
  const extra = { id: "opt_size", values: [] }
  const sorted = sortProductOptions([POT, extra, PLANT], {
    option_order: ["opt_plant", "opt_pot"],
  })
  assert.deepEqual(
    sorted.map((o) => o.id),
    ["opt_plant", "opt_pot", "opt_size"]
  )
  assert.deepEqual(
    sorted[1].values.map((v) => v.value),
    ["Black", "Gold", "White"]
  )
})

test("no saved order keeps Medusa's order of the options", () => {
  assert.deepEqual(
    sortProductOptions([POT, PLANT], {}).map((o) => o.id),
    ["opt_pot", "opt_plant"]
  )
})

test("the product itself is not changed", () => {
  const product = { metadata: { option_order: ["opt_plant"] }, options: [POT, PLANT] }
  const ordered = withOrderedOptions(product)
  assert.deepEqual(ordered.options.map((o) => o.id), ["opt_plant", "opt_pot"])
  assert.deepEqual(product.options.map((o) => o.id), ["opt_pot", "opt_plant"])
  assert.equal(POT.values[0].value, "Gold")
})

test("variants by the first option's values, then the second's", () => {
  const v = (id: string, pot: string, plant: string) => ({
    id,
    options: [
      { option_id: "opt_pot", value: pot },
      { option_id: "opt_plant", value: plant },
    ],
  })
  const variants = [
    v("gold-white", "Gold", "White"),
    v("black-white", "Black", "White"),
    v("gold-rose", "Gold", "Rose"),
    v("odd", "Purple", "Rose"),
  ]
  const options = [
    { id: "opt_pot", values: ["Black", "Gold"] },
    { id: "opt_plant", values: ["Rose", "White"] },
  ]
  assert.deepEqual(
    sortVariantsByOptions(variants, options).map((x) => x.id),
    ["black-white", "gold-rose", "gold-white", "odd"]
  )
})

console.log(`\n${passed} passed`)
