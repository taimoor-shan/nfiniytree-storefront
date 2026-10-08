/**
 * Cloudflare Turnstile verification core.
 *
 * Run:  npx tsx src/lib/util/turnstile.test.ts
 *
 * Covers:
 *  1. Without a secret the check is skipped and Cloudflare is never called
 *  2. A missing, empty or oversized token is rejected without calling Cloudflare
 *  3. A token Cloudflare accepts passes; the request carries secret, token and IP
 *  4. A token Cloudflare refuses is rejected
 *  5. Our configuration or Cloudflare at fault counts as unavailable
 *  6. A broken or hung Cloudflare counts as unavailable
 */

import { verifyTurnstile } from "./turnstile"

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
// Stand-ins for Cloudflare
// ---------------------------------------------------------------------------

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify"

type Call = { url: string; body: URLSearchParams }

/** A fetch that records what it was asked and answers with `reply`. */
function fakeFetch(reply: () => Promise<unknown>) {
  const calls: Call[] = []
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    calls.push({ url: String(url), body: init?.body as URLSearchParams })
    return reply()
  }) as unknown as typeof fetch

  return { fetchImpl, calls }
}

/** Cloudflare answering with a JSON body. */
const cloudflareSays = (body: unknown) => async () => ({
  json: async () => body,
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

async function main() {
  section("1. Without a secret the check is skipped")
  {
    const { fetchImpl, calls } = fakeFetch(cloudflareSays({ success: true }))
    const none = await verifyTurnstile("token", { secret: undefined, fetchImpl })
    const empty = await verifyTurnstile("token", { secret: "", fetchImpl })

    assert(none.status === "skipped", "no secret")
    assert(empty.status === "skipped", "an empty secret")
    assert(calls.length === 0, "Cloudflare was not called")
  }

  section("2. A missing, empty or oversized token is rejected")
  for (const [label, token] of [
    ["undefined", undefined],
    ["null", null],
    ["an empty string", ""],
    ["a number", 42],
    ["a token over 2,048 characters", "x".repeat(2049)],
  ] as const) {
    const { fetchImpl, calls } = fakeFetch(cloudflareSays({ success: true }))
    const outcome = await verifyTurnstile(token, { secret: "s", fetchImpl })

    assert(
      outcome.status === "rejected" &&
        outcome.codes.join() === "missing-input-response",
      `${label} is rejected as a missing token`
    )
    assert(calls.length === 0, `${label}: Cloudflare was not called`)
  }

  section("3. A token Cloudflare accepts passes")
  {
    const { fetchImpl, calls } = fakeFetch(cloudflareSays({ success: true }))
    const outcome = await verifyTurnstile("the-token", {
      secret: "the-secret",
      ip: "203.0.113.7",
      fetchImpl,
    })

    assert(outcome.status === "passed", "success: true passes")
    assert(calls.length === 1, "Cloudflare was called once")
    assert(calls[0].url === SITEVERIFY_URL, "the siteverify address")
    assert(calls[0].body.get("secret") === "the-secret", "the secret is sent")
    assert(calls[0].body.get("response") === "the-token", "the token is sent")
    assert(calls[0].body.get("remoteip") === "203.0.113.7", "the visitor IP is sent")

    const noIp = fakeFetch(cloudflareSays({ success: true }))
    await verifyTurnstile("t", { secret: "s", ip: null, fetchImpl: noIp.fetchImpl })
    assert(!noIp.calls[0].body.has("remoteip"), "no IP, no remoteip field")
  }

  section("4. A token Cloudflare refuses is rejected")
  for (const code of [
    "invalid-input-response",
    "timeout-or-duplicate",
    "missing-input-response",
    "some-code-nobody-listed",
  ]) {
    const { fetchImpl } = fakeFetch(
      cloudflareSays({ success: false, "error-codes": [code] })
    )
    const outcome = await verifyTurnstile("t", { secret: "s", fetchImpl })

    assert(
      outcome.status === "rejected" && outcome.codes.join() === code,
      `${code} is rejected`
    )
  }
  {
    const { fetchImpl } = fakeFetch(cloudflareSays({ success: false }))
    const outcome = await verifyTurnstile("t", { secret: "s", fetchImpl })

    assert(
      outcome.status === "rejected" && outcome.codes.length === 0,
      "a refusal that names no code is rejected"
    )
  }

  section("5. Our configuration or Cloudflare at fault counts as unavailable")
  for (const code of [
    "missing-input-secret",
    "invalid-input-secret",
    "bad-request",
    "internal-error",
  ]) {
    const { fetchImpl } = fakeFetch(
      cloudflareSays({ success: false, "error-codes": [code] })
    )
    const outcome = await verifyTurnstile("t", { secret: "s", fetchImpl })

    assert(outcome.status === "unavailable", `${code} is unavailable`)
  }

  section("6. A broken or hung Cloudflare counts as unavailable")
  {
    const down = fakeFetch(async () => {
      throw new Error("getaddrinfo ENOTFOUND challenges.cloudflare.com")
    })
    const outcome = await verifyTurnstile("t", {
      secret: "s",
      fetchImpl: down.fetchImpl,
    })
    assert(
      outcome.status === "unavailable" &&
        outcome.reason === "getaddrinfo ENOTFOUND challenges.cloudflare.com",
      "a network error"
    )

    const html = fakeFetch(async () => ({
      json: async () => {
        throw new SyntaxError("Unexpected token < in JSON at position 0")
      },
    }))
    assert(
      (await verifyTurnstile("t", { secret: "s", fetchImpl: html.fetchImpl }))
        .status === "unavailable",
      "a reply that is not JSON"
    )

    for (const [label, body] of [
      ["an empty object", {}],
      ["null", null],
      ["a success that is not a boolean", { success: "yes" }],
    ] as const) {
      const odd = fakeFetch(cloudflareSays(body))
      assert(
        (await verifyTurnstile("t", { secret: "s", fetchImpl: odd.fetchImpl }))
          .status === "unavailable",
        `${label} as the reply`
      )
    }

    const hanging = ((_url: string, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new Error("The operation was aborted"))
        )
      })) as unknown as typeof fetch
    const hung = await verifyTurnstile("t", {
      secret: "s",
      timeoutMs: 20,
      fetchImpl: hanging,
    })
    assert(hung.status === "unavailable", "a request that hangs past the timeout")
  }
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
