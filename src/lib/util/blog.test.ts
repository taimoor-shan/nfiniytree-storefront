/**
 * Run:  npx tsx src/lib/util/blog.test.ts
 */
import assert from "node:assert/strict"

import {
  fillTemplate,
  formatPostDate,
  intlLocale,
  parsePageNumber,
} from "./blog"

// Locale for Intl
assert.equal(intlLocale("en"), "en-GB")
assert.equal(intlLocale(null), "en-GB")
assert.equal(intlLocale("de-AT"), "de-AT")

// Dates, in the shop's time zone and the visitor's language
assert.equal(formatPostDate("2026-10-23T10:00:00.000Z", "en"), "23 October 2026")
assert.equal(
  formatPostDate("2026-10-23T10:00:00.000Z", "de-AT"),
  "23. Oktober 2026"
)
// 22:30 UTC is already the next day in Budapest (summer time, UTC+2, runs to 25 October 2026)
assert.equal(formatPostDate("2026-10-23T22:30:00.000Z", "en"), "24 October 2026")
assert.equal(formatPostDate(null, "en"), "")
assert.equal(formatPostDate(undefined, "en"), "")
assert.equal(formatPostDate("not a date", "en"), "")
// A locale Intl rejects must not break the page
assert.equal(formatPostDate("2026-10-23T10:00:00.000Z", "x"), "23 October 2026")

// Placeholders
assert.equal(
  fillTemplate("{minutes} min read", { minutes: 4 }),
  "4 min read"
)
assert.equal(
  fillTemplate("{a} and {a}", { a: "x" }),
  "x and x",
  "every occurrence is replaced"
)
assert.equal(fillTemplate("no placeholders", { a: 1 }), "no placeholders")

// Page numbers from the query string
assert.equal(parsePageNumber(undefined), 1)
assert.equal(parsePageNumber(""), 1)
assert.equal(parsePageNumber("abc"), 1)
assert.equal(parsePageNumber("0"), 1)
assert.equal(parsePageNumber("-3"), 1)
assert.equal(parsePageNumber("2"), 2)
assert.equal(parsePageNumber("2.9"), 2)

console.log("blog.test.ts: ok")
