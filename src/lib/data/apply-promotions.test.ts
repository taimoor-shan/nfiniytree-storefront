/**
 * Applying and removing a promotion code on the cart page.
 *
 * Run:  npx tsx src/lib/data/apply-promotions.test.ts
 *
 * Medusa applies the code to the cart, but the page the visitor is looking at
 * only shows it when the Server Action's response carries a fresh render of
 * that page. In Next 16 `refresh()` does that and `revalidateTag(tag, "max")`
 * does not: with a cache profile the tag only goes stale-while-revalidate, and
 * Next deliberately does not mark the path as revalidated "so that server
 * actions don't pull their own writes". `applyPromotions` used to end with
 * `revalidateTag(products, "max")`, so a code that WAS applied showed up only
 * after a manual reload and looked as if nothing had happened. The other cart
 * actions switched to `refresh()` for this reason (see `updateCart`).
 *
 * This runs the real `applyPromotions` against stand-ins for everything outside
 * it (Medusa, the cookies, `next/*`), so nothing leaves the machine.
 *
 * Covers:
 *  1. The code goes to Medusa on the visitor's cart, as `promo_codes`
 *  2. The page is re-rendered afterwards, so the discount shows without a reload
 *  3. Removing a code (the list without it) re-renders the page too
 *  4. A code Medusa refuses reaches the form as an error, with Medusa's reason
 *  5. With no cart there is nothing to apply the code to
 */

import Module from "node:module"
import path from "node:path"
import { FetchError } from "@medusajs/js-sdk"

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

// ---------------------------------------------------------------------------
// Stand-ins for everything outside `applyPromotions`
// ---------------------------------------------------------------------------

type Recorded = {
  cartUpdates: { cartId: string; data: any }[]
  /** What the action asked Next to do, in order: "refresh" or "revalidateTag:<tag>" */
  nextCalls: string[]
}

const recorded: Recorded = { cartUpdates: [], nextCalls: [] }

// The visitor's cart cookie, and how Medusa answers the update
let cartId: string | undefined = "cart_test"
let medusaFailure: Error | null = null

const dataDir = __dirname
const stubbedFiles: Record<string, unknown> = {
  [path.join(dataDir, "cookies.ts")]: {
    getAuthHeaders: async () => ({}),
    getCartId: async () => cartId,
    setCartId: async () => {},
    removeCartId: async () => {},
    setSelectedCountry: async () => {},
    setDeliveryCountry: async () => {},
    clearDeliveryCountry: async () => {},
  },
  [path.join(dataDir, "customer.ts")]: {
    retrieveCustomer: async () => null,
    updateCustomer: async () => {},
    createCustomerAccount: async () => {},
  },
  [path.join(dataDir, "checkout-account.ts")]: {
    emailHasAccount: async () => false,
    attachCartToAccount: async () => {},
  },
  [path.join(dataDir, "locale-actions.ts")]: {
    getLocale: async () => "en",
  },
  [path.join(dataDir, "../config.ts")]: {
    sdk: {
      store: {
        cart: {
          update: async (id: string, data: unknown) => {
            recorded.cartUpdates.push({ cartId: id, data })
            if (medusaFailure) throw medusaFailure
            return { cart: { id } }
          },
        },
      },
    },
  },
  // The VIES lookup is a network call
  [path.join(dataDir, "../util/taxid.ts")]: {
    verifyVatWithTaxID: async () => ({
      status: "active",
      company_name: "Test GmbH",
      request_id: "req_test",
    }),
  },
}

const stubbedPackages: Record<string, unknown> = {
  "server-only": {},
  "next/cache": {
    refresh() {
      recorded.nextCalls.push("refresh")
    },
    revalidateTag(tag: string) {
      recorded.nextCalls.push(`revalidateTag:${tag}`)
    },
    revalidatePath(path: string) {
      recorded.nextCalls.push(`revalidatePath:${path}`)
    },
  },
  "next/navigation": {
    redirect(url: string) {
      throw new Error(`unexpected redirect to ${url}`)
    },
  },
  "next/headers": {
    cookies: async () => ({ get: () => undefined, set() {} }),
    headers: async () => new Headers(),
  },
}

// Imports are hoisted, so `cart.ts` is required below, once this is in place
const nodeModule = Module as any
const loadModule = nodeModule._load
nodeModule._load = function (request: string, parent: unknown, isMain: boolean) {
  if (request in stubbedPackages) return stubbedPackages[request]
  let file: string | undefined
  try {
    file = nodeModule._resolveFilename(request, parent, isMain)
  } catch {
    // not a file we know: the real loader reports it
  }
  if (file && file in stubbedFiles) return stubbedFiles[file]
  return loadModule.call(this, request, parent, isMain)
}

const { applyPromotions } = require("./cart") as typeof import("./cart")

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function reset(options: { cart?: string | undefined; medusaFails?: Error } = {}) {
  recorded.cartUpdates = []
  recorded.nextCalls = []
  cartId = "cart" in options ? options.cart : "cart_test"
  medusaFailure = options.medusaFails ?? null
}

/** Runs the action, and returns the error it threw, if any */
async function run(codes: string[]): Promise<Error | null> {
  try {
    await applyPromotions(codes)
    return null
  } catch (error) {
    return error as Error
  }
}

// The cart page shows the new totals only when this happens after the update
const rerendersPage = () => recorded.nextCalls.includes("refresh")

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

async function main() {
  section("1. The code goes to Medusa on the visitor's cart")
  reset()
  let error = await run(["SUMMER20"])
  assert(error === null, "applying a code does not fail")
  assert(
    recorded.cartUpdates.length === 1 &&
      recorded.cartUpdates[0].cartId === "cart_test" &&
      JSON.stringify(recorded.cartUpdates[0].data) ===
        JSON.stringify({ promo_codes: ["SUMMER20"] }),
    "as `promo_codes` on the cart in the cookie"
  )

  section("2. The page is re-rendered, so the discount shows without a reload")
  assert(
    rerendersPage(),
    "the action asks Next for a fresh render (`refresh()`): a stale-while-revalidate `revalidateTag` does not"
  )

  section("3. Removing a code re-renders the page too")
  reset()
  error = await run([])
  assert(error === null, "removing the last code does not fail")
  assert(
    recorded.cartUpdates.length === 1 &&
      JSON.stringify(recorded.cartUpdates[0].data) ===
        JSON.stringify({ promo_codes: [] }),
    "an empty list goes to Medusa"
  )
  assert(rerendersPage(), "and the page comes back without the discount")

  section("4. A code Medusa refuses reaches the form as an error")
  reset({
    medusaFails: new FetchError(
      "The promotion code NOSUCHCODE is invalid",
      "Bad Request",
      400
    ),
  })
  error = await run(["NOSUCHCODE"])
  assert(
    error instanceof Error &&
      error.message.includes("The promotion code NOSUCHCODE is invalid"),
    "with Medusa's reason in the message, for the form to show"
  )

  section("5. With no cart there is nothing to apply the code to")
  reset({ cart: undefined })
  error = await run(["SUMMER20"])
  assert(
    error instanceof Error && error.message === "No existing cart found",
    "it says so"
  )
  assert(recorded.cartUpdates.length === 0, "and Medusa is not called")
}

main()
  .then(() => {
    console.log(`\n${"─".repeat(40)}`)
    console.log(`Passed: ${passed}  Failed: ${failed}`)
    if (failed > 0) {
      console.error("SOME TESTS FAILED")
      process.exit(1)
    } else {
      console.log("All tests passed.")
    }
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
