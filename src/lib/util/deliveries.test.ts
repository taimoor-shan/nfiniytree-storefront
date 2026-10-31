/**
 * Which deliveries a cart needs: one per shipping profile (pallet, carton).
 *
 * Run:  npx tsx src/lib/util/deliveries.test.ts
 */
import assert from "node:assert/strict"
import {
  deliveryComplete,
  groupDeliveries,
  methodForGroup,
  missingProfileIds,
  requiredProfileIds,
  type DeliveryCart,
  type DeliveryItem,
  type DeliveryOption,
} from "./deliveries"

const PALLET = "sp_pallet"
const CARTON = "sp_carton"
const DEFAULT = "sp_default"

const item = (
  title: string,
  quantity: number,
  profile: string | null,
  extra: Partial<DeliveryItem> = {}
): DeliveryItem => ({
  title: "One",
  product_title: title,
  quantity,
  variant: { product: { shipping_profile: profile ? { id: profile } : null } },
  ...extra,
})

const option = (id: string, profile: string): DeliveryOption => ({
  id,
  shipping_profile_id: profile,
})

const OPTIONS = [
  option("so_pallet_eu", PALLET),
  option("so_carton_eu", CARTON),
  option("so_standard", DEFAULT),
  option("so_express", DEFAULT),
]

const method = (optionId: string, profile: string | null) => ({
  shipping_option_id: optionId,
  shipping_option: profile ? { shipping_profile_id: profile } : null,
})

let passed = 0
const test = (name: string, run: () => void) => {
  run()
  passed++
  console.log(`  ✓ ${name}`)
}

console.log("Which deliveries a cart needs")

test("a cart of pallet products needs one delivery, with only the pallet option", () => {
  const cart: DeliveryCart = {
    items: [item("Bonsai Tree", 1, PALLET), item("Cherry Blossom", 2, PALLET)],
  }

  const groups = groupDeliveries(cart, OPTIONS)

  assert.equal(groups.length, 1)
  assert.equal(groups[0].profileId, PALLET)
  assert.deepEqual(
    groups[0].options.map((o) => o.id),
    ["so_pallet_eu"]
  )
  assert.deepEqual(groups[0].products, [
    { title: "Bonsai Tree", quantity: 1 },
    { title: "Cherry Blossom", quantity: 2 },
  ])
})

test("pallet and carton products need two deliveries, in the order the products were added", () => {
  const cart: DeliveryCart = {
    items: [item("Magnolia", 2, CARTON), item("Bonsai Tree", 1, PALLET)],
  }

  const groups = groupDeliveries(cart, OPTIONS)

  assert.deepEqual(
    groups.map((g) => [g.profileId, g.options.map((o) => o.id)]),
    [
      [CARTON, ["so_carton_eu"]],
      [PALLET, ["so_pallet_eu"]],
    ]
  )
  assert.deepEqual(requiredProfileIds(cart), [CARTON, PALLET])
})

test("a profile with several options lists them all, for the customer to choose from", () => {
  const cart: DeliveryCart = { items: [item("Garden Gnome", 1, DEFAULT)] }

  const [group] = groupDeliveries(cart, OPTIONS)

  assert.deepEqual(
    group.options.map((o) => o.id),
    ["so_standard", "so_express"]
  )
})

test("a profile nothing delivers is still a group, with no options", () => {
  const cart: DeliveryCart = { items: [item("Bonsai Tree", 1, PALLET)] }

  const [group] = groupDeliveries(cart, [option("so_carton_eu", CARTON)])

  assert.equal(group.profileId, PALLET)
  assert.deepEqual(group.options, [])
})

test("items that do not ship need no delivery", () => {
  const cart: DeliveryCart = {
    items: [
      item("Bonsai Tree", 1, PALLET),
      item("Gift card", 1, CARTON, { requires_shipping: false }),
    ],
  }

  assert.deepEqual(requiredProfileIds(cart), [PALLET])
  assert.deepEqual(groupDeliveries(cart, OPTIONS)[0].products, [
    { title: "Bonsai Tree", quantity: 1 },
  ])
})

test("a cart that does not say its profiles falls back to one delivery over every option", () => {
  const cart: DeliveryCart = { items: [item("Bonsai Tree", 1, null)] }

  const groups = groupDeliveries(cart, OPTIONS)

  assert.equal(groups.length, 1)
  assert.equal(groups[0].key, "all")
  assert.equal(groups[0].profileId, null)
  assert.equal(groups[0].options.length, OPTIONS.length)
})

test("the delivery of a group is the cart's method for that profile", () => {
  const cart: DeliveryCart = {
    items: [item("Bonsai Tree", 1, PALLET), item("Magnolia", 2, CARTON)],
    shipping_methods: [method("so_carton_eu", CARTON)],
  }
  const [pallet, carton] = groupDeliveries(cart, OPTIONS)

  assert.equal(methodForGroup(cart.shipping_methods, pallet), undefined)
  assert.equal(
    methodForGroup(cart.shipping_methods, carton)?.shipping_option_id,
    "so_carton_eu"
  )
})

test("a method is found by its option even when its profile was not fetched", () => {
  const cart: DeliveryCart = {
    items: [item("Bonsai Tree", 1, PALLET)],
    shipping_methods: [method("so_pallet_eu", null)],
  }
  const [group] = groupDeliveries(cart, OPTIONS)

  assert.equal(
    methodForGroup(cart.shipping_methods, group)?.shipping_option_id,
    "so_pallet_eu"
  )
})

test("the fallback group takes the cart's last method, as before", () => {
  const methods = [method("a", null), method("b", null)]
  const [group] = groupDeliveries({ items: [item("X", 1, null)] }, OPTIONS)

  assert.equal(methodForGroup(methods, group)?.shipping_option_id, "b")
})

test("the delivery is complete once every profile in the cart has a method", () => {
  const items = [item("Bonsai Tree", 1, PALLET), item("Magnolia", 2, CARTON)]

  assert.equal(deliveryComplete({ items }), false)
  assert.equal(
    deliveryComplete({ items, shipping_methods: [method("so_pallet_eu", PALLET)] }),
    false
  )
  assert.deepEqual(
    missingProfileIds({
      items,
      shipping_methods: [method("so_pallet_eu", PALLET)],
    }),
    [CARTON]
  )
  assert.equal(
    deliveryComplete({
      items,
      shipping_methods: [
        method("so_pallet_eu", PALLET),
        method("so_carton_eu", CARTON),
      ],
    }),
    true
  )
})

test("a method left from products no longer in the cart does not satisfy the new ones", () => {
  const cart: DeliveryCart = {
    items: [item("Magnolia", 2, CARTON)],
    shipping_methods: [method("so_pallet_eu", PALLET)],
  }

  assert.equal(deliveryComplete(cart), false)
})

test("a cart that does not say its profiles is complete with any method, as before", () => {
  const items = [item("Bonsai Tree", 1, null)]

  assert.equal(deliveryComplete({ items }), false)
  assert.equal(
    deliveryComplete({ items, shipping_methods: [method("x", null)] }),
    true
  )
})

console.log(`\n${passed} passed`)
