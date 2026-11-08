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
 * The other half of the same trap: in a production build Next replaces the
 * message of any error a Server Action THROWS with "An error occurred in the
 * Server Components render. The specific message is omitted in production
 * builds…" (and a digest). A mistyped code is an everyday event, not a fault,
 * and it used to be thrown, so on the live shop the promo box could only say
 * that. `next dev` shows the real message, which is why it was never seen. So
 * a refusal is RETURNED, as `{ ok: false, error }`, with a sentence in the
 * visitor's language: a returned value reaches the browser unchanged.
 *
 * This runs the real `applyPromotions` against stand-ins for everything outside
 * it (Medusa, the cookies, `next/*`), so nothing leaves the machine.
 *
 * Covers:
 *  1. The code goes to Medusa on the visitor's cart, as `promo_codes`
 *  2. The page is re-rendered afterwards, so the discount shows without a reload
 *  3. Removing a code (the list without it) re-renders the page too
 *  4. A code Medusa refuses comes back as an error to show, never thrown
 *  5. That error is in the visitor's language, not Medusa's English
 *  6. Any other failure says so generically (and the details go to the log)
 *  7. With no cart there is nothing to apply the code to
 *  8. A code the shop knows but cannot use on this cart says so, not silence
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

// The visitor's cart cookie, their language, and how Medusa answers the update
let cartId: string | undefined = "cart_test"
let locale = "en"
let medusaFailure: Error | null = null
// The promotions Medusa reports on the cart it sends back, given the codes
// asked for; `undefined` is an answer that carries no such list at all
let medusaPromotions: ((codes: string[]) => { code: string }[]) | undefined

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
    getLocale: async () => locale,
  },
  [path.join(dataDir, "../config.ts")]: {
    sdk: {
      store: {
        cart: {
          update: async (id: string, data: { promo_codes?: string[] }) => {
            recorded.cartUpdates.push({ cartId: id, data })
            if (medusaFailure) throw medusaFailure
            return {
              cart: {
                id,
                ...(medusaPromotions
                  ? { promotions: medusaPromotions(data.promo_codes ?? []) }
                  : {}),
              },
            }
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
const { translate } = require("@lib/i18n/dictionaries") as typeof import("@lib/i18n/dictionaries")

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function reset(
  options: {
    cart?: string | undefined
    locale?: string
    medusaFails?: Error
    medusaPromotions?: typeof medusaPromotions
  } = {}
) {
  recorded.cartUpdates = []
  recorded.nextCalls = []
  cartId = "cart" in options ? options.cart : "cart_test"
  locale = options.locale ?? "en"
  medusaFailure = options.medusaFails ?? null
  medusaPromotions = options.medusaPromotions
}

type Outcome = {
  /** What the action returned */
  result?: { ok: true } | { ok: false; error: string }
  /** The error it threw: a production build hides its message, so it must not */
  thrown?: Error
}

async function run(codes: string[]): Promise<Outcome> {
  try {
    return { result: await applyPromotions(codes) }
  } catch (error) {
    return { thrown: error as Error }
  }
}

/** The error text the visitor is shown, if the action refused */
const shown = (outcome: Outcome): string | undefined =>
  outcome.result && !outcome.result.ok ? outcome.result.error : undefined

// The cart page shows the new totals only when this happens after the update
const rerendersPage = () => recorded.nextCalls.includes("refresh")

// The stand-in Medusa applies every code it is given
const appliesAll = (codes: string[]) => codes.map((code) => ({ code }))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

async function main() {
  const invalidMessage = await translate("checkout.promoCodeInvalid", "en")
  const notApplicableMessage = await translate(
    "checkout.promoCodeNotApplicable",
    "en"
  )
  const genericMessage = await translate("account.errorOccurred", "en")

  // A missing key would come back as the key itself, and every later check
  // would then compare the key with itself
  assert(
    invalidMessage !== "checkout.promoCodeInvalid" &&
      notApplicableMessage !== "checkout.promoCodeNotApplicable",
    "the two new sentences exist in the dictionary"
  )

  section("1. The code goes to Medusa on the visitor's cart")
  reset()
  let outcome = await run(["SUMMER20"])
  assert(
    outcome.thrown === undefined && outcome.result?.ok === true,
    "applying a code succeeds"
  )
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
  outcome = await run([])
  assert(
    outcome.thrown === undefined && outcome.result?.ok === true,
    "removing the last code succeeds"
  )
  assert(
    recorded.cartUpdates.length === 1 &&
      JSON.stringify(recorded.cartUpdates[0].data) ===
        JSON.stringify({ promo_codes: [] }),
    "an empty list goes to Medusa"
  )
  assert(rerendersPage(), "and the page comes back without the discount")

  section("4. A code Medusa refuses comes back as an error to show, never thrown")
  const refusal = () =>
    new FetchError(
      "The promotion code NOSUCHCODE is invalid",
      "Bad Request",
      400
    )
  reset({ medusaFails: refusal() })
  outcome = await run(["NOSUCHCODE"])
  assert(
    outcome.thrown === undefined,
    "the action does not throw: a production build would hide what it said behind \"An error occurred in the Server Components render\""
  )
  assert(
    outcome.result?.ok === false,
    "it answers that the code was not applied"
  )
  assert(
    shown(outcome) === invalidMessage,
    "with a sentence for the visitor: the code is not valid"
  )
  assert(
    !(shown(outcome) ?? "").includes("promotion code NOSUCHCODE is invalid"),
    "not Medusa's own technical wording"
  )

  section("5. The error is in the visitor's language")
  for (const language of ["de-DE", "de-AT", "hu-HU"]) {
    reset({ locale: language, medusaFails: refusal() })
    outcome = await run(["NOSUCHCODE"])
    assert(
      shown(outcome) === (await translate("checkout.promoCodeInvalid", language)),
      `${language}: the dictionary's sentence`
    )
    assert(
      shown(outcome) !== invalidMessage,
      `${language}: and not the English one`
    )
  }

  section("6. Any other failure says so generically; the details go to the log")
  const loggedErrors: string[] = []
  const consoleError = console.error
  console.error = (...args: unknown[]) => {
    loggedErrors.push(args.map(String).join(" "))
  }
  try {
    reset({
      medusaFails: new FetchError("Database connection lost", "Server Error", 500),
    })
    outcome = await run(["SUMMER20"])
    assert(outcome.thrown === undefined, "an unexpected failure is not thrown either")
    assert(
      shown(outcome) === genericMessage,
      "the visitor reads the generic sentence"
    )
    assert(
      !(shown(outcome) ?? "").includes("Database connection lost"),
      "and nothing of the technical text"
    )
    assert(
      loggedErrors.some((line) => line.includes("Database connection lost")),
      "which is in the server log for whoever looks"
    )
    assert(!rerendersPage(), "nothing changed on the cart, so nothing is re-rendered")

    // A plain network error is no FetchError at all
    reset({ medusaFails: new Error("fetch failed") })
    outcome = await run(["SUMMER20"])
    assert(
      outcome.thrown === undefined && shown(outcome) === genericMessage,
      "a network error is handled the same way"
    )

    // A refusal like the one in section 4 is a typo, not a fault: no log noise
    loggedErrors.length = 0
    reset({ medusaFails: refusal() })
    await run(["NOSUCHCODE"])
    assert(loggedErrors.length === 0, "a mistyped code is not logged as an error")
  } finally {
    console.error = consoleError
  }

  section("7. With no cart there is nothing to apply the code to")
  loggedErrors.length = 0
  console.error = (...args: unknown[]) => {
    loggedErrors.push(args.map(String).join(" "))
  }
  try {
    reset({ cart: undefined })
    outcome = await run(["SUMMER20"])
  } finally {
    console.error = consoleError
  }
  assert(outcome.thrown === undefined, "it does not throw")
  assert(
    shown(outcome) === genericMessage,
    "it tells the visitor something went wrong"
  )
  assert(recorded.cartUpdates.length === 0, "and Medusa is not called")
  assert(
    loggedErrors.some((line) => line.includes("no cart cookie")),
    "and the log says why"
  )

  section("8. A code the shop knows but cannot use on this cart says so")
  // Medusa answers 200 and just leaves the code off the cart when no item of it
  // can be discounted, or a rule of the promotion (minimum spend, region…) is
  // not met. The visitor used to get silence and take the code for broken.
  reset({ medusaPromotions: () => [] })
  outcome = await run(["SUMMER20"])
  assert(outcome.thrown === undefined, "no throw")
  assert(
    shown(outcome) === notApplicableMessage,
    "the code is missing from the cart Medusa sent back: the visitor is told it does not apply"
  )
  assert(
    rerendersPage(),
    "and the page is still re-rendered: the cart did change hands with Medusa"
  )

  reset({ medusaPromotions: appliesAll })
  outcome = await run(["SUMMER20"])
  assert(
    outcome.result?.ok === true && shown(outcome) === undefined,
    "a code that is on the cart Medusa sent back is simply applied"
  )

  reset({ medusaPromotions: (codes) => appliesAll(codes.filter((c) => c !== "SECOND")) })
  outcome = await run(["FIRST", "SECOND"])
  assert(
    shown(outcome) === notApplicableMessage,
    "one code out of two that did not make it is enough to say so"
  )

  reset({ medusaPromotions: undefined })
  outcome = await run(["SUMMER20"])
  assert(
    outcome.result?.ok === true,
    "an answer without a list of promotions proves nothing: no false alarm"
  )

  reset({ medusaPromotions: () => [] })
  outcome = await run([])
  assert(
    outcome.result?.ok === true,
    "removing the last code leaves an empty list, and that is the point"
  )
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
