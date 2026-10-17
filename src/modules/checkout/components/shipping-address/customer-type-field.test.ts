/**
 * The checkout form sends the customer type.
 *
 * Run:  npx tsx src/modules/checkout/components/shipping-address/customer-type-field.test.ts
 *
 * `setAddresses` reads `customer_type` from the form and treats a missing value
 * as a private customer: no account is created and no VAT number is checked,
 * however the page looks. When the selector was switched off by commenting it
 * out, its hidden field went with it and every checkout silently became a
 * private guest one. That is also how a sales rep's client is linked, so this
 * keeps a field named `customer_type` in the form's live code.
 */
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import path from "node:path"

const source = readFileSync(path.join(__dirname, "index.tsx"), "utf8")

// What is left when comments (JSX ones included) are removed
const live = source
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "")

assert.match(
  live,
  /<input[^>]*type="hidden"[^>]*name="customer_type"|<input[^>]*name="customer_type"[^>]*type="hidden"/,
  "the address form has no live hidden `customer_type` field: checkout would treat every buyer as private and create no account"
)
assert.match(
  live,
  /name="customer_type"[^>]*value=\{formData\.customer_type\}|value=\{formData\.customer_type\}[^>]*name="customer_type"/,
  "the `customer_type` field must send what the page shows (formData.customer_type)"
)

// And the server still reads it from there
const cart = readFileSync(path.join(__dirname, "../../../../lib/data/cart.ts"), "utf8")
assert.match(cart, /formData\.get\("customer_type"\)/, "setAddresses no longer reads customer_type")

console.log("ok: the checkout form sends customer_type, which setAddresses reads")
