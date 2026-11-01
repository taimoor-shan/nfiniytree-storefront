/**
 * Run:  npx tsx src/lib/util/product-copy.test.ts
 */
import assert from "node:assert/strict"

import {
  getLongDescription,
  getProductSeo,
  getShortDescription,
} from "./product-copy"

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

// The long description: HTML from the admin's Long description box
const LONG_EN = "<p>Hand-made <strong>silk</strong> petals.</p>"
const LONG_DE = "<p>Handgefertigte <strong>Seiden</strong>blüten.</p>"
const LONG_HU = "<p>Kézzel készített selyemszirmok.</p>"

// Plain HTML is the same in every language, and is not mistaken for JSON
const longPlain = { metadata: { long_description: LONG_EN } }
for (const locale of ["en", "de-AT", "de-DE", "hu-HU"]) {
  assert.equal(getLongDescription(longPlain, locale), LONG_EN)
}

// One text per language, as the admin saves it: German and Hungarian once, for
// every market of the language
const longPerLanguage = {
  metadata: {
    long_description: JSON.stringify({ en: LONG_EN, de: LONG_DE, hu: LONG_HU }),
  },
}
assert.equal(getLongDescription(longPerLanguage, "en"), LONG_EN)
assert.equal(getLongDescription(longPerLanguage, "de-AT"), LONG_DE)
assert.equal(getLongDescription(longPerLanguage, "de-DE"), LONG_DE)
assert.equal(getLongDescription(longPerLanguage, "hu-HU"), LONG_HU)
assert.equal(
  getLongDescription(longPerLanguage, "fr-FR"),
  LONG_EN,
  "a language without a text falls back to English"
)

// ...or per market, as the product scripts write other copy
const longPerMarket = {
  metadata: {
    long_description: JSON.stringify({
      en: LONG_EN,
      "de-AT": "<p>Servus</p>",
      "de-DE": LONG_DE,
    }),
  },
}
assert.equal(getLongDescription(longPerMarket, "de-AT"), "<p>Servus</p>")
assert.equal(getLongDescription(longPerMarket, "de-DE"), LONG_DE)
assert.equal(getLongDescription(longPerMarket, "hu-HU"), LONG_EN)

// ...or as an object, if it was saved through the API
assert.equal(
  getLongDescription(
    { metadata: { long_description: { en: LONG_EN, de: LONG_DE } } },
    "de-AT"
  ),
  LONG_DE
)

// It is a separate text: the short description and the product's own
// description are not it
assert.equal(
  getLongDescription({ metadata: { short_description: "Short." } }, "en"),
  undefined
)
assert.equal(getShortDescription(longPlain, "en"), undefined)

// Nothing set, or only what an emptied editor leaves behind, is no text
for (const product of [
  {},
  { metadata: null },
  { metadata: {} },
  { metadata: { long_description: "" } },
  { metadata: { long_description: "   " } },
  { metadata: { long_description: "<p></p>" } },
  { metadata: { long_description: "<p>&nbsp;</p><p> </p>" } },
  { metadata: { long_description: "<p><br></p>" } },
  { metadata: { long_description: JSON.stringify({ en: "<p></p>" }) } },
  { metadata: { long_description: 42 } },
]) {
  assert.equal(getLongDescription(product, "en"), undefined)
}

// ...but markup that shows something without text counts
assert.equal(
  getLongDescription({ metadata: { long_description: '<img src="/a.jpg">' } }, "en"),
  '<img src="/a.jpg">'
)
assert.equal(
  getLongDescription({ metadata: { long_description: "  <hr>  " } }, "en"),
  "<hr>"
)

console.log("product-copy.test.ts: ok")
