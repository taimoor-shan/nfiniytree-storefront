/**
 * Run:  npx tsx src/lib/util/cms-html.test.ts
 */
import assert from "node:assert/strict"

import { normalizeBodyHeadings } from "./cms-html"

// A leading h1 that repeats the title is dropped
assert.equal(
  normalizeBodyHeadings("<h1>Plant Care</h1><p>Water weekly.</p>", "Plant care"),
  "<p>Water weekly.</p>"
)
// ...even with markup inside and different case/spacing
assert.equal(
  normalizeBodyHeadings(
    '  <h1 class="x"><strong>PLANT  CARE</strong></h1>\n<p>Hi</p>',
    "Plant care"
  ),
  "<p>Hi</p>"
)

// A leading h1 that says something else stays, as an h2
assert.equal(
  normalizeBodyHeadings("<h1>Watering</h1><p>Weekly.</p>", "Plant care"),
  "<h2>Watering</h2><p>Weekly.</p>"
)

// Later h1s are demoted, attributes kept
assert.equal(
  normalizeBodyHeadings('<p>Intro</p><h1 id="a">Part one</h1>', "Plant care"),
  '<p>Intro</p><h2 id="a">Part one</h2>'
)

// h2 and below are untouched
const fine = "<h2>Light</h2><h3>Indoors</h3><p>Text</p>"
assert.equal(normalizeBodyHeadings(fine, "Plant care"), fine)

// A tag that only starts with "h1" is not a heading
assert.equal(
  normalizeBodyHeadings("<h12>odd</h12>", "x"),
  "<h12>odd</h12>"
)

console.log("cms-html.test.ts: ok")
