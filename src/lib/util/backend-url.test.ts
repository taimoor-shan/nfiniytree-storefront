/**
 * Which address the server uses to reach Medusa directly.
 *
 * Run:  npx tsx src/lib/util/backend-url.test.ts
 *
 * Covers:
 *  1. The direct address wins over the public one
 *  2. Without it, the public address is used
 *  3. An empty value counts as unset
 *  4. With neither, the local default
 *  5. Trailing slashes are dropped
 */

import { serverBackendUrl } from "./backend-url"

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
// Tests
// ---------------------------------------------------------------------------

section("1. The direct address wins over the public one")
assert(
  serverBackendUrl({
    MEDUSA_BACKEND_URL: "http://localhost:9000",
    NEXT_PUBLIC_MEDUSA_BACKEND_URL: "https://infinytree.com",
  }) === "http://localhost:9000",
  "production: Medusa's own address, not the public domain"
)

section("2. Without it, the public address is used")
assert(
  serverBackendUrl({
    NEXT_PUBLIC_MEDUSA_BACKEND_URL: "http://localhost:9100",
  }) === "http://localhost:9100",
  "development: the one address that is set"
)

section("3. An empty value counts as unset")
assert(
  serverBackendUrl({
    MEDUSA_BACKEND_URL: "",
    NEXT_PUBLIC_MEDUSA_BACKEND_URL: "https://infinytree.com",
  }) === "https://infinytree.com",
  "an empty MEDUSA_BACKEND_URL falls back"
)

section("4. With neither, the local default")
assert(serverBackendUrl({}) === "http://localhost:9000", "http://localhost:9000")

section("5. Trailing slashes are dropped")
assert(
  serverBackendUrl({ MEDUSA_BACKEND_URL: "http://localhost:9000//" }) ===
    "http://localhost:9000",
  "a slash on the direct address"
)
assert(
  serverBackendUrl({ NEXT_PUBLIC_MEDUSA_BACKEND_URL: "https://infinytree.com/" }) ===
    "https://infinytree.com",
  "a slash on the public address"
)

// ===========================================================================
console.log(`\n${"─".repeat(40)}`)
console.log(`Passed: ${passed}  Failed: ${failed}`)
if (failed > 0) {
  console.error("SOME TESTS FAILED")
  process.exit(1)
} else {
  console.log("All tests passed.")
}
