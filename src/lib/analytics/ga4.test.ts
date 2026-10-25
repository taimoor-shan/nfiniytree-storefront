/**
 * Tests for the GA4 helpers: the event payloads and the consent gate.
 *
 * Run:  npx tsx src/lib/analytics/ga4.test.ts
 *
 * Covers:
 *  1. Line items: the product handle is the item ID in every language
 *  2. begin_checkout / purchase: net value after discounts, tax and shipping
 *     apart, the order number as the transaction
 *  3. view_item / add_to_cart: value is price × quantity; no price, no value
 *  4. The consent gate: nothing is sent before the tag runs, waiting events go
 *     out in order once it does, nothing after consent is withdrawn, and a
 *     `once` key holds across calls
 */

// The module reads the measurement ID when it loads, and the gate needs a
// browser: both are set up before the dynamic import below.
process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST123"

const sent: unknown[][] = []
const memoryStorage = () => {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  }
}
const fakeWindow: Record<string, unknown> = {
  gtag: (...args: unknown[]) => void sent.push(args),
  localStorage: memoryStorage(),
  sessionStorage: memoryStorage(),
  location: { hostname: "infinytree.com" },
}
;(globalThis as Record<string, unknown>).window = fakeWindow
;(globalThis as Record<string, unknown>).document = { cookie: "" }

// ---------------------------------------------------------------------------
// Tiny test harness (no framework dependency)
// ---------------------------------------------------------------------------

let passed = 0
let failed = 0

function assert(condition: boolean, label: string) {
  if (condition) {
    passed++
    console.log(`  ✓ ${label}`)
  } else {
    failed++
    console.error(`  ✗ ${label}`)
  }
}

function section(title: string) {
  console.log(`\n${title}`)
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

async function main() {
  const ga = await import("./ga4")

  // ---------------------------------------------------------------------------
  // Tests
  // ---------------------------------------------------------------------------

  section("1. Line items")

  const germanLine = {
    product_title: "Künstlicher Kirschblütenbaum",
    product_handle: "cherry-blossom-tree",
    product: { handle: "cherry-blossom-tree" },
    variant_title: "Golden White",
    unit_price: 2450,
    quantity: 2,
  }
  assert(
    same(ga.lineItemToGa4(germanLine), {
      item_id: "cherry-blossom-tree",
      item_name: "Künstlicher Kirschblütenbaum",
      item_variant: "Golden White",
      price: 2450,
      quantity: 2,
    }),
    "handle as the ID, the title the visitor saw as the name"
  )
  assert(
    ga.lineItemToGa4({ product_id: "prod_1", title: "Rose Royale" }).item_id ===
      "prod_1",
    "falls back to the product ID without a handle"
  )
  assert(
    ga.lineItemToGa4({ product_handle: "x", quantity: 0 }).quantity === 1,
    "a line without a quantity counts once"
  )

  section("2. Checkout and purchase")

  const order = {
    id: "order_01",
    display_id: 1042,
    currency_code: "eur",
    item_subtotal: 4900,
    discount_subtotal: 490,
    tax_total: 1102.5,
    shipping_subtotal: 120,
    items: [germanLine],
  }
  const purchase = ga.purchaseParams(order)
  assert(purchase.transaction_id === "1042", "the order number is the transaction ID")
  assert(purchase.value === 4410, "value: goods after discounts, net (4900 − 490)")
  assert(purchase.tax === 1102.5 && purchase.shipping === 120, "tax and shipping apart")
  assert(purchase.currency === "EUR", "currency in capitals")
  assert(purchase.items.length === 1 && purchase.items[0].price === 2450, "items carried over")
  assert(
    ga.purchaseParams({ ...order, display_id: null }).transaction_id === "order_01",
    "the order ID without an order number"
  )
  const checkout = ga.beginCheckoutParams({
    currency_code: "huf",
    item_subtotal: 329000,
    items: [],
  })
  assert(
    checkout.value === 329000 && checkout.currency === "HUF",
    "begin_checkout: net value, no discount"
  )

  section("3. Product views and add to cart")

  const product = { id: "prod_2", handle: "zen-ficus-bonsai", title: "Zen Ficus Bonsai Tree" }
  const added = ga.productParams(product, { amount: 890, currency_code: "eur" }, { title: "White Pot" }, 3)
  assert(added.value === 2670 && added.currency === "EUR", "value is price × quantity")
  assert(
    same(added.items[0], {
      item_id: "zen-ficus-bonsai",
      item_name: "Zen Ficus Bonsai Tree",
      item_variant: "White Pot",
      price: 890,
      quantity: 3,
    }),
    "the item names the variant"
  )
  const unpriced = ga.productParams(product, { amount: null, currency_code: "eur" })
  assert(
    !("value" in unpriced) && !("currency" in unpriced) && !("price" in unpriced.items[0]),
    "no price: no value or currency (GA4 rejects a value without one)"
  )

  section("4. Consent gate")

  const disable = ga.GA_DISABLE_KEY
  assert(disable === "ga-disable-G-TEST123", "GA's own switch for this property")

  ga.trackEvent("view_item", { n: 1 })
  ga.trackEvent("purchase", { n: 2 }, { key: "purchase:order_01", per: "browser" })
  assert(sent.length === 0, "before the tag runs, nothing is sent")

  fakeWindow[disable] = false
  ga.flushPendingEvents()
  assert(
    same(sent, [["event", "view_item", { n: 1 }], ["event", "purchase", { n: 2 }]]),
    "once the tag runs, the waiting events go out in order"
  )

  ga.trackEvent("purchase", { n: 3 }, { key: "purchase:order_01", per: "browser" })
  assert(sent.length === 2, "a `once` key is not sent twice")

  ga.trackEvent("add_to_cart", { n: 4 })
  assert(sent.length === 3, "with consent, events go out at once")

  ga.revokeAnalytics()
  assert(fakeWindow[disable] === true, "withdrawing consent switches GA off")
  ga.trackEvent("add_to_cart", { n: 5 })
  ga.flushPendingEvents()
  assert(sent.length === 3, "after withdrawal nothing is sent or kept")

  delete fakeWindow[disable]
  for (let i = 0; i < 30; i++) ga.trackEvent("view_item", { i })
  fakeWindow[disable] = false
  ga.flushPendingEvents()
  assert(sent.length === 3 + 20, "at most 20 events wait for an unanswered banner")

  // ===========================================================================
  console.log(`\n${"─".repeat(40)}`)
  console.log(`Passed: ${passed}  Failed: ${failed}`)
  if (failed > 0) {
    console.error("SOME TESTS FAILED")
    process.exit(1)
  } else {
    console.log("All tests passed.")
  }
}

main()
