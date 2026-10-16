/**
 * Run:  npx tsx src/lib/util/category-seo.test.ts
 */
import assert from "node:assert/strict"

import { getCategorySeo, toParagraphs } from "./category-seo"

// Per-language values, including one stored as a JSON string by the admin UI.
const category = {
  description: "Fallback copy",
  metadata: {
    seo_title: { en: "Artificial olive trees", "hu-HU": "Mű olajfák" },
    seo_description: '{"en": "Olive trees that look real", "de-AT": "Olivenbäume wie echt"}',
    seo_text: "  ",
  },
}

assert.deepEqual(getCategorySeo(category, "hu-HU"), {
  title: "Mű olajfák",
  description: "Olive trees that look real",
  // Blank seo_text falls back to the category description.
  text: "Fallback copy",
})
assert.equal(getCategorySeo(category, "de-AT").description, "Olivenbäume wie echt")

// Plain strings and missing metadata.
assert.deepEqual(getCategorySeo({ metadata: { seo_title: "Palms" } }, "en"), {
  title: "Palms",
  description: undefined,
  text: undefined,
})
assert.deepEqual(getCategorySeo({ description: null, metadata: null }, "en"), {
  title: undefined,
  description: undefined,
  text: undefined,
})

assert.deepEqual(toParagraphs("One\nline\n\n  Two  \n\n\n"), ["One\nline", "Two"])

console.log("category-seo: all assertions passed")
