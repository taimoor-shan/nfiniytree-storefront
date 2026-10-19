/**
 * The team's business cards: the contact file and the address the proxy serves.
 *
 * Run:  npx tsx src/lib/team/business-card.test.ts
 *
 * Covers:
 *  1. The links built from a card (call, mail, WhatsApp, page, contact file)
 *  2. The vCard: exact content, CRLF endings, escaping, line length
 *  3. Which paths are card pages
 */

import {
  MARTIN_WOLF,
  buildVCard,
  cardDescription,
  cardTitle,
  escapeVCardText,
  fullName,
  mailtoHref,
  pagePath,
  telHref,
  vcardFileName,
  vcardPath,
  whatsappHref,
} from "./business-card"
import { TEAM_CARD_LOCALE, isTeamCardPath } from "./card-path"

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

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const ok = actual === expected
  assert(ok, label)
  if (!ok) {
    console.error(`      expected: ${JSON.stringify(expected)}`)
    console.error(`      actual:   ${JSON.stringify(actual)}`)
  }
}

function section(title: string) {
  console.log(`\n${title}`)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

// Martin's card has no role for now (it is commented out in business-card.ts).
// The same card with one keeps the role paths covered.
const withRole = { ...MARTIN_WOLF, role: "Sales Director" }

section("1. The links built from a card")
assertEqual(fullName(MARTIN_WOLF), "Martin Wolf", "full name")
assertEqual(
  cardTitle(MARTIN_WOLF),
  "Tirol, Österreich",
  "without a role, the title saved to the phone is the place the card shows"
)
assertEqual(
  cardTitle(withRole),
  "Sales Director – Tirol, Österreich",
  "with a role, the title is role and place"
)
assertEqual(
  cardDescription(MARTIN_WOLF),
  "Digitale Visitenkarte von Martin Wolf bei InfinYtree (Tirol): anrufen, eine E-Mail schreiben oder den Kontakt speichern.",
  "the page description without a role"
)
assertEqual(
  cardDescription(withRole),
  "Digitale Visitenkarte von Martin Wolf, Sales Director Tirol bei InfinYtree: anrufen, eine E-Mail schreiben oder den Kontakt speichern.",
  "the page description with a role"
)
assertEqual(telHref(MARTIN_WOLF), "tel:+436648241498", "call link keeps the + and no spaces")
assertEqual(mailtoHref(MARTIN_WOLF), "mailto:martin@infinytree.com", "mail link")
assertEqual(
  whatsappHref(MARTIN_WOLF),
  "https://wa.me/436648241498",
  "WhatsApp link is digits only, no +"
)
assertEqual(pagePath(MARTIN_WOLF), "/team/martin-wolf", "page address")
assertEqual(vcardPath(MARTIN_WOLF), "/team/martin-wolf.vcf", "contact file address")
assertEqual(
  vcardFileName(MARTIN_WOLF),
  "Martin_Wolf_InfinYtree.vcf",
  "the saved file's name"
)

section("2. The vCard")
const vcard = buildVCard(MARTIN_WOLF, "https://infinytree.com")
assertEqual(
  vcard,
  [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "N:Wolf;Martin;;;",
    "FN:Martin Wolf",
    "ORG:InfinYtree",
    "TITLE:Tirol\\, Österreich",
    "TEL;TYPE=WORK,CELL:+436648241498",
    "EMAIL;TYPE=WORK:martin@infinytree.com",
    "URL:https://infinytree.com/",
    "END:VCARD",
    "",
  ].join("\r\n"),
  "exact content: the prepared card without its role, comma escaped, canonical address"
)
assert(vcard.endsWith("END:VCARD\r\n"), "the last line ends in CRLF too")
assert(!/(^|[^\r])\n/.test(vcard), "no bare line feeds")
assert(
  vcard.split("\r\n").every((line) => Buffer.byteLength(line, "utf8") <= 75),
  "no line is longer than 75 bytes, so none needs folding"
)
assert(
  buildVCard(withRole, "https://infinytree.com").includes(
    "\r\nTITLE:Sales Director – Tirol\\, Österreich\r\n"
  ),
  "with a role, the title line carries role and place"
)
assert(!vcard.includes("undefined"), "nothing in the contact file reads 'undefined'")
assert(
  !cardDescription(MARTIN_WOLF).includes("undefined"),
  "nor does the page description"
)

assertEqual(
  escapeVCardText("a,b;c\\d\ne"),
  "a\\,b\\;c\\\\d\\ne",
  "comma, semicolon, backslash and line break are escaped"
)
assertEqual(escapeVCardText("Österreich"), "Österreich", "umlauts stay as they are")

section("3. Which paths are card pages")
assert(isTeamCardPath("/team/martin-wolf"), "/team/martin-wolf")
assert(isTeamCardPath("/team/martin-wolf/"), "a trailing slash is fine")
assert(isTeamCardPath("/team/someone-else"), "any name: an unknown one is a 404 in German, not a market redirect")
assert(!isTeamCardPath("/team"), "/team is not a card")
assert(!isTeamCardPath("/team/"), "/team/ is not a card")
assert(!isTeamCardPath("/team/martin-wolf/extra"), "nothing below a card")
assert(!isTeamCardPath("/team/martin-wolf.vcf"), "the contact file is not a page")
assert(!isTeamCardPath("/hu/team/martin-wolf"), "a market's own /team stays a market route")
assert(!isTeamCardPath("/teams/martin-wolf"), "/teams is another path")
assert(!isTeamCardPath("/store"), "the shop's own routes")
assertEqual(TEAM_CARD_LOCALE, "de-AT", "the cards are German, Austria's dictionary")

// ===========================================================================
console.log(`\n${"─".repeat(40)}`)
console.log(`Passed: ${passed}  Failed: ${failed}`)
if (failed > 0) {
  console.error("SOME TESTS FAILED")
  process.exit(1)
} else {
  console.log("All tests passed.")
}
