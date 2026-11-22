/**
 * Share image URLs for link previews.
 *
 * Run:  npx tsx src/lib/util/share-image.test.ts
 *
 * Covers:
 *  1. An upload (relative or absolute) becomes a 1200 × 630 JPEG under /api/og
 *  2. A new upload gets a new URL (social networks cache by image URL)
 *  3. The route reads back exactly what was handed out
 *  4. Anything else is refused: unknown fit or version, paths, bad encoding
 *  5. A picture on another path is passed through untouched; none gives null
 */
import assert from "node:assert/strict"

import {
  parseShareImagePath,
  SHARE_IMAGE_VERSION,
  shareImageFor,
  shareImagePath,
  staticFileName,
} from "./share-image"

let failed = 0
const test = (name: string, fn: () => void) => {
  try {
    fn()
    console.log(`ok - ${name}`)
  } catch (error) {
    failed++
    console.error(`not ok - ${name}\n`, error)
  }
}

const segments = (url: string) => {
  const match = /^\/api\/og\/([^/]+)\/([^/]+)\/([^/]+)$/.exec(url)
  assert.ok(match, url)
  return [match[1], match[2], match[3]] as const
}

test("an upload becomes a 1200 × 630 JPEG", () => {
  const image = shareImageFor("/static/1794392197554-hero.avif", {
    fit: "cover",
    alt: "Hero",
  })
  assert.ok(image)
  assert.match(
    image.url,
    new RegExp(`^/api/og/cover/${SHARE_IMAGE_VERSION}/[A-Za-z0-9_-]+\\.jpg$`)
  )
  assert.equal(image.width, 1200)
  assert.equal(image.height, 630)
  assert.equal(image.type, "image/jpeg")
  assert.equal(image.alt, "Hero")
})

test("an absolute upload URL is read the same as a relative one", () => {
  assert.equal(
    shareImageFor("https://infinytree.com/static/1-a.jpg", { fit: "contain" })
      ?.url,
    shareImageFor("/static/1-a.jpg", { fit: "contain" })?.url
  )
})

test("a new upload is a new URL, and so is another fit", () => {
  const a = shareImagePath("1794392197554-hero.avif", "cover")
  const b = shareImagePath("1794392199999-hero.avif", "cover")
  assert.notEqual(a, b)
  assert.notEqual(a, shareImagePath("1794392197554-hero.avif", "contain"))
})

test("the route reads back what was handed out", () => {
  for (const name of [
    "1794392197554-infinytree-botanicals-artificial.avif",
    "1776921175439-green_0000_green%20tree.jpg",
    "1793390962503-Blue-Cascade-image-2.jpeg",
    "1-Rózsa ő ű.png",
  ]) {
    const [fit, version, file] = segments(shareImagePath(name, "contain"))
    assert.deepEqual(parseShareImagePath(fit, version, file), {
      fit: "contain",
      fileName: name,
    })
  }
})

test("anything else is refused", () => {
  const [, version, file] = segments(shareImagePath("1-a.jpg", "cover"))
  assert.equal(parseShareImagePath("stretch", version, file), null)
  assert.equal(parseShareImagePath("cover", "v0", file), null)
  assert.equal(
    parseShareImagePath("cover", version, file.replace(".jpg", ".png")),
    null
  )
  assert.equal(parseShareImagePath("cover", version, "not+base64.jpg"), null)
  const encode = (text: string) =>
    Buffer.from(text).toString("base64url") + ".jpg"
  assert.equal(parseShareImagePath("cover", version, encode("../secret")), null)
  assert.equal(parseShareImagePath("cover", version, encode("..")), null)
  assert.equal(parseShareImagePath("cover", version, encode("a\\b")), null)
  assert.equal(parseShareImagePath("cover", version, ".jpg"), null)
  for (const dots of [
    "%2e%2e",
    ".%2e",
    "%2e.",
    "%2E%2E",
    "%2e",
    "a%2fb",
    "a%5cb",
  ]) {
    assert.equal(
      parseShareImagePath("cover", version, encode(dots)),
      null,
      dots
    )
    assert.equal(staticFileName(`/static/${dots}`), null, dots)
  }
})

test("only a file directly under /static/ is an upload", () => {
  assert.equal(staticFileName("/static/1-a.jpg"), "1-a.jpg")
  assert.equal(staticFileName("/static/1-a.jpg?x=1"), "1-a.jpg")
  assert.equal(staticFileName("/static/sub/1-a.jpg"), null)
  assert.equal(staticFileName("/og-default-2026-11.jpg"), null)
  assert.equal(staticFileName("not a url"), null)
})

test("other pictures pass through; no picture is null", () => {
  assert.deepEqual(
    shareImageFor("https://cdn.example.com/a.jpg", { fit: "cover", alt: " " }),
    { url: "https://cdn.example.com/a.jpg" }
  )
  assert.equal(shareImageFor(null, { fit: "cover" }), null)
  assert.equal(shareImageFor("  ", { fit: "cover" }), null)
})

if (failed) {
  console.error(`${failed} failed`)
  process.exit(1)
}
