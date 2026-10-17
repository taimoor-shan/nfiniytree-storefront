/**
 * Client links: the codes, the cookie rule, the lookup, and the page-link tool.
 *
 * Run:  npx tsx src/lib/util/referral.test.ts
 */

import { readFileSync } from "node:fs"
import path from "node:path"
import {
  REFERRAL_MAX_AGE,
  REFERRAL_METADATA_KEY,
  clientLinkUrl,
  linkToPage,
  lookupReferrer,
  normalizeReferralCode,
  referralToRemember,
  withReferral,
  type ReferrerLookup,
} from "./referral"

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

const equal = (actual: unknown, expected: unknown, label: string) =>
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${label}${
      JSON.stringify(actual) === JSON.stringify(expected)
        ? ""
        : ` (got ${JSON.stringify(actual)}, wanted ${JSON.stringify(expected)})`
    }`
  )

async function main() {
  console.log("\nthe code in what a visitor sent")
  equal(normalizeReferralCode("K7M2QXP9"), "K7M2QXP9", "a code stays as it is")
  equal(normalizeReferralCode(" k7m2-qxp9 "), "K7M2QXP9", "is trimmed, upper-cased and stripped of hyphens")
  equal(normalizeReferralCode("k7m2 qxp9"), "K7M2QXP9", "and of spaces")
  for (const junk of ["x", "ABCDE", "A".repeat(13), "<script>", "ref=1", "", "   ", null, undefined, 42]) {
    equal(normalizeReferralCode(junk), null, `junk is dropped: ${JSON.stringify(junk)}`)
  }

  console.log("\nthe metadata of a new customer")
  equal(
    withReferral({ customer_type: "business" }, "K7M2QXP9"),
    { customer_type: "business", [REFERRAL_METADATA_KEY]: "K7M2QXP9" },
    "gets the code beside what it had"
  )
  equal(withReferral(undefined, "K7M2QXP9"), { [REFERRAL_METADATA_KEY]: "K7M2QXP9" }, "or on its own")
  equal(withReferral({ a: 1 }, null), { a: 1 }, "is left alone without a code")
  equal(withReferral(undefined, null), undefined, "and stays empty")

  console.log("\nthe lookup")
  const reply = (status: number, body?: unknown, throws?: Error) =>
    (async () => {
      if (throws) throw throws
      return new Response(body === undefined ? null : JSON.stringify(body), { status })
    }) as unknown as typeof fetch
  equal(
    await lookupReferrer("K7M2QXP9", { fetcher: reply(200, { link: { rep_name: "Peter Nagy" } }), baseUrl: "http://x" }),
    { status: "found", name: "Peter Nagy" },
    "a rep's link says whose it is"
  )
  equal(
    await lookupReferrer("K7M2QXP9", { fetcher: reply(404, { code: "link_invalid" }), baseUrl: "http://x" }),
    { status: "unknown" },
    "a 404 means no rep has it"
  )
  equal(
    await lookupReferrer("K7M2QXP9", { fetcher: reply(500), baseUrl: "http://x" }),
    { status: "unavailable" },
    "a server error is no answer"
  )
  equal(
    await lookupReferrer("K7M2QXP9", { fetcher: reply(200, "<html>"), baseUrl: "http://x" }),
    { status: "unavailable" },
    "a web page instead of JSON (the wrong address) is no answer either"
  )
  equal(
    await lookupReferrer("K7M2QXP9", { fetcher: reply(0, undefined, new Error("down")), baseUrl: "http://x" }),
    { status: "unavailable" },
    "a network failure is no answer"
  )
  let asked = ""
  await lookupReferrer("K7M2QXP9", {
    fetcher: (async (url: string) => {
      asked = url
      return new Response(JSON.stringify({ link: { rep_name: "P" } }))
    }) as unknown as typeof fetch,
    baseUrl: "http://localhost:9000",
  })
  equal(asked, "http://localhost:9000/sales-links/K7M2QXP9", "asks the plugin's public route")

  console.log("\nthe cookie rule")
  const answers = (table: Record<string, ReferrerLookup["status"]>) => {
    const asked: string[] = []
    const lookup = async (code: string): Promise<ReferrerLookup> => {
      asked.push(code)
      const status = table[code] ?? "unknown"
      return status === "found" ? { status, name: "Peter Nagy" } : ({ status } as ReferrerLookup)
    }
    return { lookup, asked }
  }
  let t = answers({ AAAAAAAA: "found" })
  equal(
    await referralToRemember({ param: "aaaaaaaa", current: null, signedIn: false }, t.lookup),
    "AAAAAAAA",
    "a working link is remembered, in the form the plugin knows"
  )
  t = answers({})
  equal(
    await referralToRemember({ param: "newsletter", current: null, signedIn: false }, t.lookup),
    null,
    "a code no rep has is not remembered: other sites' ?ref= stays out"
  )
  t = answers({})
  equal(await referralToRemember({ param: "x", current: null, signedIn: false }, t.lookup), null, "junk is not even asked about")
  equal(t.asked.length, 0, "no lookup for junk")
  equal(await referralToRemember({ param: null, current: "AAAAAAAA", signedIn: false }, t.lookup), null, "a page without a link changes nothing")
  t = answers({ AAAAAAAA: "found", BBBBBBBB: "found" })
  equal(
    await referralToRemember({ param: "BBBBBBBB", current: "AAAAAAAA", signedIn: false }, t.lookup),
    null,
    "the first link wins while it still leads to a rep"
  )
  t = answers({ BBBBBBBB: "found" })
  equal(
    await referralToRemember({ param: "BBBBBBBB", current: "AAAAAAAA", signedIn: false }, t.lookup),
    "BBBBBBBB",
    "a stale first link (the rep made a new one) doesn't block a working one"
  )
  t = answers({ AAAAAAAA: "unavailable", BBBBBBBB: "found" })
  equal(
    await referralToRemember({ param: "BBBBBBBB", current: "AAAAAAAA", signedIn: false }, t.lookup),
    null,
    "when the first can't be checked it is kept"
  )
  t = answers({ AAAAAAAA: "found" })
  equal(
    await referralToRemember({ param: "AAAAAAAA", current: "AAAAAAAA", signedIn: false }, t.lookup),
    null,
    "the same link again asks nothing"
  )
  equal(t.asked.length, 0, "no lookup for the same link")
  t = answers({ AAAAAAAA: "found" })
  equal(
    await referralToRemember({ param: "AAAAAAAA", current: null, signedIn: true }, t.lookup),
    null,
    "a signed-in customer has nothing to be linked to"
  )
  t = answers({ AAAAAAAA: "unavailable" })
  equal(
    await referralToRemember({ param: "AAAAAAAA", current: null, signedIn: false }, t.lookup),
    "AAAAAAAA",
    "a new link that can't be checked is remembered"
  )

  console.log("\nthe rep's link")
  equal(clientLinkUrl("https://infinytree.com", "K7M2QXP9"), "https://infinytree.com/?ref=K7M2QXP9", "is the shop with the code")
  equal(clientLinkUrl("https://infinytree.com///", "K7M2QXP9"), "https://infinytree.com/?ref=K7M2QXP9", "without doubled slashes")

  console.log("\nthe link to a page")
  const SHOP = "https://infinytree.com"
  const page = (input: string) => linkToPage(input, "K7M2QXP9", SHOP)
  equal(
    page("https://infinytree.com/hu/products/olive-tree"),
    { ok: true, url: "https://infinytree.com/hu/products/olive-tree?ref=K7M2QXP9" },
    "adds the code to a product"
  )
  equal(
    page("infinytree.com/en-hu/store?sort=price#top"),
    { ok: true, url: "https://infinytree.com/en-hu/store?sort=price&ref=K7M2QXP9#top" },
    "takes an address without the scheme and keeps the query and the anchor"
  )
  equal(
    page("https://www.infinytree.com/hu"),
    { ok: true, url: "https://infinytree.com/hu?ref=K7M2QXP9" },
    "takes the www address of the shop"
  )
  equal(
    page("https://infinytree.com/hu?ref=OTHERREP"),
    { ok: true, url: "https://infinytree.com/hu?ref=K7M2QXP9" },
    "replaces another code with the rep's own"
  )
  equal(page("https://example.com/hu"), { ok: false, reason: "other_site" }, "refuses another site")
  equal(page("https://infinytree.com.evil.example/hu"), { ok: false, reason: "other_site" }, "and one that only starts like the shop")
  equal(page("   "), { ok: false, reason: "invalid" }, "refuses nothing")
  equal(page("javascript:alert(1)"), { ok: false, reason: "invalid" }, "and a script")
  equal(page("hello world"), { ok: false, reason: "invalid" }, "and what isn't an address")
  equal(
    linkToPage("http://localhost:8000/hu/store", "K7M2QXP9", "http://localhost:8000"),
    { ok: true, url: "http://localhost:8000/hu/store?ref=K7M2QXP9" },
    "works on a local shop in development"
  )

  console.log("\nwhat the visitor reads")
  const root = path.resolve(__dirname, "../../..")
  const dictionaries = Object.fromEntries(
    ["en", "de-AT", "de-DE", "hu-HU"].map((language) => [
      language,
      JSON.parse(
        readFileSync(path.join(root, `src/i18n/dictionaries/${language}.json`), "utf8")
      ) as Record<string, string>,
    ])
  )
  const placeholders = (text: string) =>
    Array.from(new Set(Array.from(text.matchAll(/\{(\w+)\}/g)).map((m) => m[1]))).sort()
  for (const key of [
    "account.referrerNotice",
    "account.haveReferralCode",
    "account.referralCode",
    "account.referralCodeHint",
    "account.referralCodeFound",
    "account.referralCodeUnknown",
  ]) {
    for (const [language, dictionary] of Object.entries(dictionaries)) {
      assert(typeof dictionary[key] === "string" && dictionary[key] !== "", `${language} has ${key}`)
      equal(
        placeholders(dictionary[key] ?? ""),
        placeholders(dictionaries.en[key]),
        `${language} ${key} uses the placeholders English does`
      )
    }
  }
  // The portal tells reps how long the first link counts; this is that number
  equal(REFERRAL_MAX_AGE, 30 * 24 * 60 * 60, "the cookie lasts the 30 days the portal says")
  for (const [language, dictionary] of Object.entries(dictionaries)) {
    assert(dictionary["salesPortal.clientLink.rule2"]?.includes("30"), `${language} rule 2 names the 30 days`)
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed ? 1 : 0)
}

main()
