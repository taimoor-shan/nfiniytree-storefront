/**
 * Run:  npx tsx src/lib/util/product-copy.test.ts
 */
import assert from "node:assert/strict"

import { getProductSeo, getShortDescription } from "./product-copy"

const SEO_TITLE =
  "Blue Cascade | One-of-a-Kind Artificial Floral Arrangement | InfinYtree"
const SEO_DESCRIPTION =
  "Discover Blue Cascade, a one-of-a-kind large-scale artificial floral arrangement designed to bring bold elegance and lasting impact to exceptional interiors."

// Plain text, as the product was created
const plain = {
  metadata: {
    short_description: "A one-of-a-kind floral composition.",
    seo_title: SEO_TITLE,
    seo_description: SEO_DESCRIPTION,
  },
}
assert.equal(
  getShortDescription(plain, "en"),
  "A one-of-a-kind floral composition."
)
assert.deepEqual(getProductSeo(plain, "en"), {
  title: SEO_TITLE,
  description: SEO_DESCRIPTION,
})

// Plain text is the same in every language
assert.equal(getProductSeo(plain, "hu-HU").title, SEO_TITLE)

// One text per language, entered as JSON in the admin
const perLanguage = {
  metadata: {
    short_description: JSON.stringify({
      en: "A floral composition.",
      "de-AT": "Eine Blumenkomposition.",
    }),
    seo_title: JSON.stringify({ en: "English title", "de-AT": "Deutscher Titel" }),
  },
}
assert.equal(getShortDescription(perLanguage, "de-AT"), "Eine Blumenkomposition.")
assert.equal(getShortDescription(perLanguage, "en"), "A floral composition.")
assert.equal(
  getShortDescription(perLanguage, "hu-HU"),
  "A floral composition.",
  "a language without a text falls back to English"
)
assert.equal(getProductSeo(perLanguage, "de-AT").title, "Deutscher Titel")
assert.equal(getProductSeo(perLanguage, "de-AT").description, undefined)

// Nothing set: existing products keep their title and description
for (const product of [{}, { metadata: null }, { metadata: {} }]) {
  assert.equal(getShortDescription(product, "en"), undefined)
  assert.deepEqual(getProductSeo(product, "en"), {
    title: undefined,
    description: undefined,
  })
}

// Blank text counts as nothing, and text is trimmed
const blank = { metadata: { short_description: "   ", seo_title: "  Title  " } }
assert.equal(getShortDescription(blank, "en"), undefined)
assert.equal(getProductSeo(blank, "en").title, "Title")

console.log("product-copy.test.ts: ok")
