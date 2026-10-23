/**
 * Every language must carry the same keys, and the blog strings the same
 * `{placeholders}`: a key missing from one file shows the raw key on the page,
 * and a missing placeholder shows a sentence with a hole in it.
 *
 * Run:  npx tsx src/lib/i18n/dictionaries.test.ts
 */
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const DIR = path.join(__dirname, "../../i18n/dictionaries")
const LOCALES = ["en", "de-AT", "de-DE", "hu-HU"]

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
    (k) => k === "nav.blog" || k.startsWith("blog.") || k.startsWith("metadata.blog")
  )) {
    assert.equal(
      placeholders(dictionary[key]),
      placeholders(english[key]),
      `${locale} "${key}" must use the same placeholders as en`
    )
    assert.notEqual(dictionary[key].trim(), "", `${locale} "${key}" is empty`)
  }
}

console.log("dictionaries.test.ts: ok")
