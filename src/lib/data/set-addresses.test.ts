/**
 * The checkout address step: who is asked for a password, who gets an account.
 *
 * Run:  npx tsx src/lib/data/set-addresses.test.ts
 *
 * The form shows the password fields only to a visitor who is not signed in
 * (`!customer` in `shipping-address/index.tsx`), but business is the default
 * customer type, so every submit says `customer_type=b2b`. `setAddresses` used
 * to take that as "this visitor needs a new account" and enforce the password
 * rule even for a signed-in customer, who has no password field to fill: the
 * returning customer was stopped at the address step with "At least 8
 * characters, including digits and letters".
 *
 * A visitor who is not signed in cannot be recognised by the form, so one whose
 * email already has an account is shown the password fields too. Medusa then
 * refuses the registration (401, "Identity with email already exists") and the
 * visitor used to see that English sentence under the continue button.
 *
 * This runs the real `setAddresses` against stand-ins for everything outside
 * it (Medusa, the cookies, `next/*`, the VAT lookup), so nothing leaves the
 * machine and no customer, cart or order is touched.
 *
 * Covers:
 *  1. A signed-in customer goes on to delivery: no password asked, no second
 *     account, whatever the customer type or a stale "create account" box
 *  2. A first-time customer is still asked for a password and gets the account
 *  3. A first-time private customer may still check out as a guest
 *  4. A signed-out visitor whose email already has an account is told, in their
 *     language, to log in: no second account, and other failures keep their text
 *  5. The sign-up page's error text says the same
 */

import Module from "node:module"
import path from "node:path"
import { FetchError } from "@medusajs/js-sdk"
import { translate } from "../i18n/dictionaries"

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
// Stand-ins for everything outside `setAddresses`
// ---------------------------------------------------------------------------

class Redirected extends Error {
  constructor(public url: string) {
    super("NEXT_REDIRECT")
  }
}

type Recorded = {
  registrationAttempts: any[]
  accountsCreated: any[]
  customerUpdates: any[]
  cartUpdates: any[]
  addressesSaved: any[]
}

const recorded: Recorded = {
  registrationAttempts: [],
  accountsCreated: [],
  customerUpdates: [],
  cartUpdates: [],
  addressesSaved: [],
}

// Who `retrieveCustomer()` finds: null is a visitor who is not signed in
let signedIn: Record<string, unknown> | null = null

// The language `getLocale()` reports, and how registration ends: null lets it
// through, an error makes it fail the way the SDK's `auth.register` does
let currentLocale = "en"
let registrationFailure: Error | null = null

const dataDir = __dirname
const stubbedFiles: Record<string, unknown> = {
  [path.join(dataDir, "customer.ts")]: {
    retrieveCustomer: async () => signedIn,
    updateCustomer: async (body: unknown) => {
      recorded.customerUpdates.push(body)
    },
    // The real one registers first and lets the SDK's error through untouched,
    // so a failed registration creates nothing
    createCustomerAccount: async (input: unknown) => {
      recorded.registrationAttempts.push(input)
      if (registrationFailure) throw registrationFailure
      recorded.accountsCreated.push(input)
    },
  },
  [path.join(dataDir, "cookies.ts")]: {
    getAuthHeaders: async () => ({}),
    getCartId: async () => "cart_test",
    setCartId: async () => {},
    removeCartId: async () => {},
    setSelectedCountry: async () => {},
  },
  [path.join(dataDir, "locale-actions.ts")]: {
    getLocale: async () => currentLocale,
  },
  [path.join(dataDir, "../config.ts")]: {
    sdk: {
      store: {
        cart: {
          update: async (cartId: string, data: unknown) => {
            recorded.cartUpdates.push({ cartId, data })
            return { cart: { id: cartId } }
          },
        },
        customer: {
          createAddress: async (payload: unknown) => {
            recorded.addressesSaved.push(payload)
            return {}
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
    refresh() {},
    revalidateTag() {},
    revalidatePath() {},
  },
  "next/navigation": {
    redirect(url: string) {
      throw new Redirected(url)
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

const { setAddresses } = require("./cart") as typeof import("./cart")
const { localizeError } = require("./localize-error") as typeof import("./localize-error")

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// What the address step posts. Business is the default customer type and the
// selector is switched off, so the hidden `customer_type` field says b2b.
const addressFields: Record<string, string> = {
  email: "buyer@example.test",
  salutation: "MR",
  "shipping_address.first_name": "Test",
  "shipping_address.last_name": "Buyer",
  "shipping_address.company": "Test GmbH",
  "shipping_address.address_1": "Teststrasse 1",
  "shipping_address.address_2": "",
  "shipping_address.postal_code": "1010",
  "shipping_address.city": "Wien",
  "shipping_address.country_code": "at",
  "shipping_address.province": "",
  "shipping_address.phone": "",
  same_as_billing: "on",
}
const business = { ...addressFields, customer_type: "b2b", vat_number: "ATU12345678" }
const privateBuyer = { ...addressFields, customer_type: "b2c" }
const password = { password: "test-pass-1234", password_repeat: "test-pass-1234" }

const returningCustomer = {
  id: "cus_returning",
  email: "buyer@example.test",
  first_name: "Test",
  last_name: "Buyer",
  company_name: "Test GmbH",
  metadata: { customer_type: "b2b", vat_number: "ATU12345678" },
  addresses: [],
}

type Outcome = { error: string } | { redirectedTo: string }

async function submit(
  fields: Record<string, string>,
  customer: Record<string, unknown> | null,
  options: { locale?: string; registrationFails?: Error } = {}
): Promise<Outcome> {
  signedIn = customer
  currentLocale = options.locale ?? "en"
  registrationFailure = options.registrationFails ?? null
  recorded.registrationAttempts = []
  recorded.accountsCreated = []
  recorded.customerUpdates = []
  recorded.cartUpdates = []
  recorded.addressesSaved = []

  const formData = new FormData()
  for (const [name, value] of Object.entries(fields)) formData.set(name, value)

  try {
    // On failure it returns the message; on success it redirects (throws)
    return { error: String(await setAddresses(null, formData)) }
  } catch (error) {
    if (error instanceof Redirected) return { redirectedTo: error.url }
    throw error
  }
}

const toDelivery = { redirectedTo: "/at/checkout?step=delivery" }
const sameOutcome = (a: Outcome, b: Outcome) =>
  JSON.stringify(a) === JSON.stringify(b)

async function main() {
  const passwordRule = await translate("checkout.passwordRule", "en")
  const passwordsDiffer = await translate("account.passwordsDoNotMatch", "en")

  // =========================================================================
  section("1. A signed-in customer goes on to delivery")
  // =========================================================================

  let outcome = await submit(business, returningCustomer)
  assert(
    sameOutcome(outcome, toDelivery),
    `a business customer, who has no password field, reaches delivery (got ${JSON.stringify(outcome)})`
  )
  assert(
    !("error" in outcome && outcome.error === passwordRule),
    "and is not shown the password rule"
  )
  assert(recorded.accountsCreated.length === 0, "no second account is created")
  assert(recorded.registrationAttempts.length === 0, "and registration is not even tried")
  assert(recorded.customerUpdates.length === 1, "the customer's record is still synced with the form")
  assert(
    recorded.cartUpdates.length === 1 &&
      recorded.cartUpdates[0].data.email === "buyer@example.test",
    "the cart gets the address and email"
  )

  outcome = await submit(privateBuyer, { ...returningCustomer, metadata: { customer_type: "b2c" } })
  assert(sameOutcome(outcome, toDelivery), "a private customer reaches delivery")
  assert(recorded.accountsCreated.length === 0, "and no account is created")

  // A form opened as a guest, with "create account" ticked, and sent after
  // signing in from another tab
  outcome = await submit({ ...privateBuyer, create_customer_account: "on" }, returningCustomer)
  assert(sameOutcome(outcome, toDelivery), "a form sent with \"create account\" ticked does not stop them either")
  assert(recorded.accountsCreated.length === 0, "and creates no second account")

  // =========================================================================
  section("2. A first-time customer is asked for a password and gets the account")
  // =========================================================================

  outcome = await submit({ ...business, ...password }, null)
  assert(sameOutcome(outcome, toDelivery), `a business customer with a good password reaches delivery (got ${JSON.stringify(outcome)})`)
  assert(recorded.accountsCreated.length === 1, "exactly one account is created")
  assert(
    recorded.accountsCreated[0]?.email === "buyer@example.test" &&
      recorded.accountsCreated[0]?.password === password.password,
    "with the email and the password they typed"
  )
  assert(
    recorded.accountsCreated[0]?.metadata?.customer_type === "b2b",
    "and the customer type from the form's hidden field"
  )
  assert(recorded.addressesSaved.length === 1, "their address is saved in the address book")
  assert(recorded.customerUpdates.length === 0, "nobody to sync before the account exists")

  outcome = await submit(business, null)
  assert(
    sameOutcome(outcome, { error: passwordRule }),
    "no password: the password rule stops them"
  )
  assert(
    recorded.accountsCreated.length === 0 && recorded.cartUpdates.length === 0,
    "before anything is created or saved"
  )

  for (const [label, weak] of [
    ["that is too short", "abc123"],
    ["without a digit", "only-letters-here"],
    ["without a letter", "1234567890"],
  ] as const) {
    outcome = await submit({ ...business, password: weak, password_repeat: weak }, null)
    assert(sameOutcome(outcome, { error: passwordRule }), `a password ${label} is refused`)
  }

  outcome = await submit({ ...business, password: password.password, password_repeat: "another-pass-1" }, null)
  assert(
    sameOutcome(outcome, { error: passwordsDiffer }),
    "two different passwords are refused"
  )
  assert(recorded.accountsCreated.length === 0, "and no account is created")

  outcome = await submit({ ...privateBuyer, create_customer_account: "on" }, null)
  assert(
    sameOutcome(outcome, { error: passwordRule }),
    "a private customer who ticks \"create account\" must give a password"
  )

  outcome = await submit({ ...privateBuyer, create_customer_account: "on", ...password }, null)
  assert(sameOutcome(outcome, toDelivery), "and gets the account with one")
  assert(recorded.accountsCreated.length === 1, "exactly one")

  // =========================================================================
  section("3. A first-time private customer may still check out as a guest")
  // =========================================================================

  outcome = await submit(privateBuyer, null)
  assert(sameOutcome(outcome, toDelivery), "no password asked")
  assert(recorded.accountsCreated.length === 0, "and no account created")

  // =========================================================================
  section("4. A signed-out visitor whose email already has an account is told to log in")
  // =========================================================================

  // What `sdk.auth.register` throws for it: the SDK's own error class, with the
  // status Medusa answers (401, as for every registration failure) and its
  // sentence, which is all that tells this failure apart from the others
  const accountExists = () =>
    new FetchError("Identity with email already exists", "Unauthorized", 401)
  const KEY = "account.emailAlreadyRegistered"
  const english = await translate(KEY, "en")

  for (const locale of ["en", "de-AT", "de-DE", "hu-HU"]) {
    const text = await translate(KEY, locale)
    outcome = await submit({ ...business, ...password }, null, {
      locale,
      registrationFails: accountExists(),
    })
    assert(text !== KEY, `${locale}: the dictionary has the message`)
    assert(
      sameOutcome(outcome, { error: text }),
      `${locale}: the visitor is shown it (got ${JSON.stringify(outcome)})`
    )
    if (locale !== "en") {
      assert(text !== english, `${locale}: and it is translated, not English`)
    }
  }

  outcome = await submit({ ...business, ...password }, null, {
    registrationFails: accountExists(),
  })
  assert(
    !("error" in outcome && outcome.error.includes("Identity with email already exists")),
    "Medusa's English sentence is not shown"
  )
  assert(recorded.registrationAttempts.length === 1, "registration is tried once")
  assert(recorded.accountsCreated.length === 0, "no second account is created")
  assert(recorded.addressesSaved.length === 0, "nothing is saved to an address book after it fails")
  assert(recorded.customerUpdates.length === 0, "nor to a customer record")

  outcome = await submit({ ...privateBuyer, create_customer_account: "on", ...password }, null, {
    registrationFails: accountExists(),
  })
  assert(
    sameOutcome(outcome, { error: english }),
    "a private customer who ticked \"create account\" is told the same"
  )
  assert(recorded.accountsCreated.length === 0, "and gets no second account")

  // Only this failure is translated: another one must not be taken for it
  for (const failure of [
    new FetchError("Password should be a string", "Unauthorized", 401),
    new FetchError("Internal Server Error", "Internal Server Error", 500),
  ]) {
    outcome = await submit({ ...business, ...password }, null, { registrationFails: failure })
    assert(
      sameOutcome(outcome, { error: failure.message }),
      `"${failure.message}" (${failure.status}) keeps its own text`
    )
  }

  // =========================================================================
  section("5. The sign-up page says the same")
  // =========================================================================

  // `signup()` turns every registration failure into text with `localizeError`
  currentLocale = "en"
  assert((await localizeError(accountExists())) === english, "an existing account is told to log in")
  currentLocale = "de-DE"
  assert(
    (await localizeError(accountExists())) === (await translate(KEY, "de-DE")),
    "in the visitor's language"
  )
  currentLocale = "en"
  assert(
    (await localizeError(new Error("Invalid email or password"))) ===
      (await translate("account.invalidCredentials", "en")),
    "a wrong password keeps its own text"
  )
  assert(
    (await localizeError(new Error("boom"))) === (await translate("account.errorOccurred", "en")),
    "anything else gets the generic one"
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
