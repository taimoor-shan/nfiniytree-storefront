/**
 * Every language must carry the same keys, and the blog strings and the
 * withdrawal acknowledgement the same `{placeholders}`: a key missing from one
 * file shows the raw key on the page, and a missing placeholder shows a
 * sentence with a hole in it.
 *
 * Run:  npx tsx src/lib/i18n/dictionaries.test.ts
 */
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const DIR = path.join(__dirname, "../../i18n/dictionaries")
const LOCALES = ["en", "de-AT", "de-DE", "hu-HU"]

// Texts that used to be hardcoded English: German or Hungarian that equals the
// English means nobody translated it
const WRITTEN_FOR_EVERY_LANGUAGE = (key: string) =>
  key === "common.variant" ||
  key === "common.notAvailable" ||
  key.startsWith("order.payment.") ||
  key.startsWith("checkout.salutation.") ||
  key === "checkout.withdrawalAcknowledgement"

const load = (locale: string): Record<string, string> =>
  JSON.parse(fs.readFileSync(path.join(DIR, `${locale}.json`), "utf8"))

const placeholders = (text: string) =>
  (text.match(/\{[A-Za-z]+\}/g) ?? []).sort().join(",")

const english = load("en")
const englishKeys = Object.keys(english).sort()

for (const locale of LOCALES.filter((l) => l !== "en")) {
  const dictionary = load(locale)
  const keys = Object.keys(dictionary).sort()

  assert.deepEqual(
    englishKeys.filter((key) => !(key in dictionary)),
    [],
    `${locale} is missing keys that en has`
  )
  assert.deepEqual(
    keys.filter((key) => !(key in english)),
    [],
    `${locale} has keys that en does not`
  )

  for (const key of englishKeys.filter(
    (k) =>
      k === "nav.blog" ||
      k.startsWith("blog.") ||
      k.startsWith("metadata.blog") ||
      k === "checkout.withdrawalAcknowledgement"
  )) {
    assert.equal(
      placeholders(dictionary[key]),
      placeholders(english[key]),
      `${locale} "${key}" must use the same placeholders as en`
    )
    assert.notEqual(dictionary[key].trim(), "", `${locale} "${key}" is empty`)
  }

  for (const key of englishKeys.filter(WRITTEN_FOR_EVERY_LANGUAGE)) {
    assert.notEqual(dictionary[key], english[key], `${locale} "${key}" is still English`)
  }
}

// The checkbox text names the decree through `{decree}`, which is filled from
// `withdrawal.decree`, so its wording lives in one place per language
for (const locale of LOCALES) {
  const dictionary = load(locale)
  assert.ok(
    dictionary["checkout.withdrawalAcknowledgement"].includes("{decree}"),
    `${locale} "checkout.withdrawalAcknowledgement" names the decree`
  )
  assert.notEqual(dictionary["withdrawal.decree"].trim(), "", `${locale} has the decree`)
}

// The salutation options show a label and save a fixed value, so the English
// labels are what the form always said
assert.deepEqual(
  ["ms", "mr", "mx"].map((k) => english[`checkout.salutation.${k}`]),
  ["Ms", "Mr", "Mx"]
)

// The notice and the checkbox name the decree by putting `withdrawal.decree`
// where `{decree}` stands, so the two must not both add the same word (the
// Hungarian decree carries its own article: "a a 45/2014" was on the cart)
for (const locale of LOCALES) {
  const dictionary = load(locale)
  assert.ok(
    dictionary["withdrawal.legalText"].includes("{decree}"),
    `${locale} "withdrawal.legalText" names the decree`
  )

  for (const key of [
    "withdrawal.legalText",
    "checkout.withdrawalAcknowledgement",
  ]) {
    const words = dictionary[key]
      .replace("{decree}", dictionary["withdrawal.decree"])
      .toLowerCase()
      .split(/\s+/)

    for (let i = 1; i < words.length; i++) {
      assert.notEqual(
        words[i],
        words[i - 1],
        `${locale} "${key}" says "${words[i]}" twice in a row`
      )
    }
  }
}

console.log("dictionaries.test.ts: ok")
