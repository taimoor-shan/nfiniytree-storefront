/**
 * Dates shown to the visitor: in their language, and the same day on the
 * server and in the browser.
 *
 * Run:  npx tsx src/lib/util/date.test.ts
 */
import assert from "node:assert/strict"
import { formatDate } from "./date"

const ORDERED = "2026-10-31T10:00:00.000Z"

// The long form, one language at a time
assert.equal(formatDate(ORDERED, "en"), "31 October 2026")
assert.equal(formatDate(ORDERED, "de-AT"), "31. Oktober 2026")
assert.equal(formatDate(ORDERED, "de-DE"), "31. Oktober 2026")
assert.equal(formatDate(ORDERED, "hu-HU"), "2026. október 31.")

// No language chosen is English, as for the blog
assert.equal(formatDate(ORDERED, null), "31 October 2026")
assert.equal(formatDate(ORDERED, ""), "31 October 2026")

// An unknown locale code is shown in English rather than failing
assert.equal(formatDate(ORDERED, "xx-bad-!!"), "31 October 2026")

// A Date works as well as the ISO string Medusa sends
assert.equal(formatDate(new Date(ORDERED), "de-AT"), "31. Oktober 2026")

// The shop's time zone, not the server's: just before midnight in UTC the
// order is already on the next day in Budapest, wherever this runs
assert.equal(formatDate("2026-10-31T23:30:00.000Z", "en"), "1 November 2026")

// The short form of the order timeline
const short = { month: "short", day: "numeric" } as const
assert.equal(formatDate(ORDERED, "en", short), "31 Oct")
assert.match(formatDate(ORDERED, "de-AT", short), /^31\. Okt/)
assert.match(formatDate(ORDERED, "hu-HU", short), /okt/)

// Nothing to show
assert.equal(formatDate(null, "en"), "")
assert.equal(formatDate(undefined, "en"), "")
assert.equal(formatDate("", "en"), "")
assert.equal(formatDate("not a date", "en"), "")

console.log("date.test.ts: ok")
