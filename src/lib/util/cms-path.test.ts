/**
 * Run:  npx tsx src/lib/util/cms-path.test.ts
 */
import assert from "node:assert/strict"

import { cmsSlugFromSegments, MAX_CMS_SLUG_DEPTH } from "./cms-path"

// A slug, flat or nested
assert.equal(cmsSlugFromSegments(["plant-care"]), "plant-care")
assert.equal(
  cmsSlugFromSegments(["guides", "plant-care"]),
  "guides/plant-care"
)
assert.equal(cmsSlugFromSegments(["Privacy_Policy-2"]), "Privacy_Policy-2")

// Segments arrive percent-encoded
assert.equal(cmsSlugFromSegments(["plant%2Dcare"]), "plant-care")

// Not an address a page can have
assert.equal(cmsSlugFromSegments(undefined), null)
assert.equal(cmsSlugFromSegments([]), null)
assert.equal(cmsSlugFromSegments(["wp-login.php"]), null, "no dots")
assert.equal(cmsSlugFromSegments(["..", "etc"]), null, "no traversal")
assert.equal(cmsSlugFromSegments(["a b"]), null, "no spaces")
assert.equal(cmsSlugFromSegments(["a%2Fb"]), null, "no encoded slash")
assert.equal(cmsSlugFromSegments(["-leading-hyphen"]), null)
assert.equal(cmsSlugFromSegments(["bad%ZZ"]), null, "undecodable input")
assert.equal(cmsSlugFromSegments([""]), null)

// Depth
const ok = Array.from({ length: MAX_CMS_SLUG_DEPTH }, (_, i) => `s${i}`)
assert.equal(cmsSlugFromSegments(ok), ok.join("/"))
assert.equal(cmsSlugFromSegments([...ok, "one-too-many"]), null)

console.log("cms-path.test.ts: ok")
