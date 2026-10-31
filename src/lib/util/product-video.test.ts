/**
 * The product video in the gallery: what a product's metadata gives, and where
 * the video sits among the images.
 *
 * Run:  npx tsx src/lib/util/product-video.test.ts
 */
import assert from "node:assert/strict"
import {
  VIDEO_SLIDE_ID,
  buildGallerySlides,
  getProductVideo,
  type GalleryImage,
} from "./product-video"

let passed = 0
const test = (name: string, run: () => void) => {
  run()
  passed++
  console.log(`  ✓ ${name}`)
}

const VIDEO = "https://media.example.com/blue-cascade.mp4"
const POSTER = "https://media.example.com/blue-cascade-still.jpg"

console.log("What the product's metadata gives")

test("no metadata, no video", () => {
  assert.equal(getProductVideo({}), undefined)
  assert.equal(getProductVideo({ metadata: null }), undefined)
  assert.equal(getProductVideo({ metadata: {} }), undefined)
})

test("the video and its still image", () => {
  assert.deepEqual(
    getProductVideo({ metadata: { video_url: VIDEO, video_poster: POSTER } }),
    { url: VIDEO, poster: POSTER }
  )
})

test("the still image is optional", () => {
  assert.deepEqual(getProductVideo({ metadata: { video_url: VIDEO } }), {
    url: VIDEO,
  })
})

test("a still image alone is not a video", () => {
  assert.equal(getProductVideo({ metadata: { video_poster: POSTER } }), undefined)
})

test("blanks are trimmed away", () => {
  assert.deepEqual(
    getProductVideo({
      metadata: { video_url: `  ${VIDEO}\n`, video_poster: "   " },
    }),
    { url: VIDEO }
  )
  assert.equal(getProductVideo({ metadata: { video_url: "   " } }), undefined)
})

test("a file the shop serves itself is accepted", () => {
  assert.deepEqual(
    getProductVideo({
      metadata: {
        video_url: "/static/1730000000000-blue-cascade.mp4",
        video_poster: "/static/1730000000001-still.jpg",
      },
    }),
    {
      url: "/static/1730000000000-blue-cascade.mp4",
      poster: "/static/1730000000001-still.jpg",
    }
  )
})

test("an address that is not a web address is dropped", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:video/mp4;base64,AAAA",
    "//evil.example.com/video.mp4",
    "ftp://example.com/video.mp4",
    "blue-cascade.mp4",
    "https://",
  ]) {
    assert.equal(getProductVideo({ metadata: { video_url: url } }), undefined, url)
  }
})

test("a bad still image costs only the still image", () => {
  assert.deepEqual(
    getProductVideo({
      metadata: { video_url: VIDEO, video_poster: "javascript:alert(1)" },
    }),
    { url: VIDEO }
  )
})

test("values that are not text are ignored", () => {
  for (const value of [42, true, { en: VIDEO }, [VIDEO]]) {
    assert.equal(getProductVideo({ metadata: { video_url: value } }), undefined)
  }
})

console.log("Where the video sits among the images")

const images = (count: number): GalleryImage[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `img_${i + 1}`,
    url: `https://media.example.com/photo-${i + 1}.jpg`,
  }))

const ids = (slides: ReturnType<typeof buildGallerySlides>) =>
  slides.map((slide) => slide.id)

test("without a video the gallery is just the images", () => {
  const slides = buildGallerySlides(images(3))
  assert.deepEqual(ids(slides), ["img_1", "img_2", "img_3"])
  assert.ok(slides.every((slide) => slide.kind === "image"))
})

test("main image, second image, video", () => {
  assert.deepEqual(ids(buildGallerySlides(images(2), { url: VIDEO })), [
    "img_1",
    "img_2",
    VIDEO_SLIDE_ID,
  ])
})

test("with more images the video still comes third", () => {
  assert.deepEqual(ids(buildGallerySlides(images(5), { url: VIDEO })), [
    "img_1",
    "img_2",
    VIDEO_SLIDE_ID,
    "img_3",
    "img_4",
    "img_5",
  ])
})

test("with fewer than two images the video comes last", () => {
  assert.deepEqual(ids(buildGallerySlides(images(1), { url: VIDEO })), [
    "img_1",
    VIDEO_SLIDE_ID,
  ])
  assert.deepEqual(ids(buildGallerySlides([], { url: VIDEO })), [VIDEO_SLIDE_ID])
})

test("the video slide carries its file", () => {
  const video = buildGallerySlides(images(2), { url: VIDEO, poster: POSTER })[2]
  assert.deepEqual(video, {
    kind: "video",
    id: VIDEO_SLIDE_ID,
    url: VIDEO,
    poster: POSTER,
  })
})

test("without a still image the first image stands in", () => {
  const video = buildGallerySlides(images(3), { url: VIDEO })[2]
  assert.equal(video.kind, "video")
  assert.equal(video.kind === "video" && video.poster, "https://media.example.com/photo-1.jpg")
})

test("the first image with an address stands in", () => {
  const slides = buildGallerySlides(
    [
      { id: "img_1", url: null },
      { id: "img_2", url: "https://media.example.com/photo-2.jpg" },
    ],
    { url: VIDEO }
  )
  const video = slides.at(-1)
  assert.equal(
    video?.kind === "video" && video.poster,
    "https://media.example.com/photo-2.jpg"
  )
})

test("no still image and no images: a play button on a plain background", () => {
  const video = buildGallerySlides([], { url: VIDEO })[0]
  assert.equal(video.kind === "video" && video.poster, null)
})

test("an image without an address keeps its place", () => {
  const slides = buildGallerySlides(
    [
      { id: "img_1", url: "https://media.example.com/photo-1.jpg" },
      { id: "img_2" },
      { id: "img_3", url: "https://media.example.com/photo-3.jpg" },
    ],
    { url: VIDEO }
  )
  assert.deepEqual(ids(slides), ["img_1", "img_2", VIDEO_SLIDE_ID, "img_3"])
  assert.equal(slides[1].kind === "image" && slides[1].url, null)
})

test("the images given are left as they were", () => {
  const given = images(3)
  const before = JSON.stringify(given)
  buildGallerySlides(given, { url: VIDEO })
  assert.equal(JSON.stringify(given), before)
})

console.log(`\n${passed} passed`)
