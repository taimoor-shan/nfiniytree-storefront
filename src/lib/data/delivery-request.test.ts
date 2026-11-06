/**
 * "Request a delivery quote": what the checkout sends for a country on request.
 *
 * Run:  npx tsx src/lib/data/delivery-request.test.ts
 *
 * The client asked for the email to be optional here: a quote can be answered
 * by phone. So the request needs an email or a phone, at least one, and the
 * sales rep link the visitor followed goes along, so the owner can credit the
 * rep when the quote becomes an order.
 *
 * Runs the real `requestDeliveryQuote` against stand-ins for Medusa, the
 * cookies and the locale, so nothing leaves the machine.
 */

import Module from "node:module"
import path from "node:path"
import { translate } from "../i18n/dictionaries"

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

// What reached Medusa, and the rep code the visitor's cookie holds
let sent: { path: string; body: Record<string, unknown> }[] = []
let referralCode: string | null = null

const dataDir = __dirname
const stubbedFiles: Record<string, unknown> = {
  [path.join(dataDir, "../config.ts")]: {
    sdk: {
      client: {
        fetch: async (requestPath: string, init: { body: Record<string, unknown> }) => {
          sent.push({ path: requestPath, body: init.body })
          return { success: true, id: "dreq_test" }
        },
      },
    },
  },
  [path.join(dataDir, "cookies.ts")]: {
    getCartId: async () => "cart_test",
  },
  [path.join(dataDir, "locale-actions.ts")]: {
    getLocale: async () => "en",
  },
  [path.join(dataDir, "referral.ts")]: {
    getReferralCode: async () => referralCode,
  },
}

const stubbedPackages: Record<string, unknown> = {
  "server-only": {},
  "next/headers": {
    cookies: async () => ({ get: () => undefined, set() {} }),
    headers: async () => new Headers(),
  },
}

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

const { requestDeliveryQuote } = require("./delivery-request") as typeof import("./delivery-request")

// What the address step posts for Greece
const greece: Record<string, string> = {
  email: "anna@example.gr",
  "shipping_address.first_name": "Anna",
  "shipping_address.last_name": "Papadopoulou",
  "shipping_address.company": "Olive Interiors",
  "shipping_address.address_1": "Ermou 10",
  "shipping_address.postal_code": "10563",
  "shipping_address.city": "Athens",
  "shipping_address.country_code": "gr",
  "shipping_address.phone": "+30 210 1234567",
  customer_type: "b2b",
}

const submit = async (fields: Record<string, string>, code: string | null = null) => {
  sent = []
  referralCode = code
  const formData = new FormData()
  for (const [name, value] of Object.entries(fields)) formData.set(name, value)
  return requestDeliveryQuote({ status: "idle" }, formData)
}

async function main() {
  console.log("\nAn email or a phone is enough")

  let state = await submit(greece)
  assert(state.status === "sent", "a request with both is sent")
  assert(sent[0]?.body.email === "anna@example.gr", "with the email")

  state = await submit({ ...greece, email: "" })
  assert(state.status === "sent", `a request with only a phone is sent (got ${JSON.stringify(state)})`)
  assert(sent.length === 1 && !("email" in sent[0].body && sent[0].body.email), "and no email goes to Medusa")
  assert(
    state.status === "sent" && state.email === "" && state.phone === "+30 210 1234567",
    "the confirmation knows to call, not to email"
  )

  state = await submit({ ...greece, email: "anna@example.gr", "shipping_address.phone": "" })
  assert(state.status === "sent", "a request with only an email is sent, as before")

  state = await submit({ ...greece, email: "", "shipping_address.phone": "" })
  assert(
    state.status === "error" &&
      state.message === (await translate("checkout.deliveryRequest.contactNeeded", "en")),
    "neither: they are asked for one of the two"
  )
  assert(sent.length === 0, "and nothing is sent")

  state = await submit({ ...greece, "shipping_address.city": "" })
  assert(state.status === "error", "a missing part of the address is still refused")
  assert(sent.length === 0, "before anything is sent")

  console.log("\nThe sales rep link goes along")

  await submit(greece, "K7M2QX9P")
  assert(sent[0]?.body.sales_rep_ref === "K7M2QX9P", "the code the visitor followed is sent")

  await submit(greece, null)
  assert(sent[0]?.body.sales_rep_ref === undefined, "no link, no code")
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
