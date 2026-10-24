/**
 * Run:  npx tsx src/lib/util/cms-html.test.ts
 */
import assert from "node:assert/strict"

import { localizeBodyLinks, normalizeBodyHeadings } from "./cms-html"

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

// Root-relative links get the page's market prefix
assert.equal(
  localizeBodyLinks(
    '<p><a href="/products/cherry-blossom-tree">tree</a> and <a class="x" href=\'/store?sort=new#top\'>shop</a></p>',
    "de-at"
  ),
  '<p><a href="/de-at/products/cherry-blossom-tree">tree</a> and <a class="x" href=\'/de-at/store?sort=new#top\'>shop</a></p>'
)
// The home page is the market itself
assert.equal(
  localizeBodyLinks('<a href="/">Home</a>', "en-hu"),
  '<a href="/en-hu">Home</a>'
)
// Already in a market, other sites, files, team cards and anchors stay
const untouched = [
  '<a href="/en-hu/store">a</a>',
  '<a href="/hu/store">a</a>',
  '<a href="https://example.com/store">a</a>',
  '<a href="//cdn.example.com/x">a</a>',
  '<a href="/static/guide.pdf">a</a>',
  '<a href="/team/martin-wolf">a</a>',
  '<a href="#faq">a</a>',
  '<img src="/static/a.jpg">',
].join("")
assert.equal(localizeBodyLinks(untouched, "de-de"), untouched)
console.log("cms-html.test.ts: ok")
