/**
 * The home page's video banner: what the store's metadata gives.
 *
 * Run:  npx tsx src/lib/util/home-banner.test.ts
 */
import assert from "node:assert/strict"
import {
  BANNER_KEYS,
  DEFAULT_MOBILE_HEIGHT,
  MAX_HEIGHT,
  MIN_HEIGHT,
  getHomeBanner,
} from "./home-banner"

let passed = 0
const test = (name: string, run: () => void) => {
  run()
  passed++
  console.log(`  ✓ ${name}`)
}

const VIDEO = "https://media.example.com/banner.mp4"
const POSTER = "https://media.example.com/banner.jpg"

console.log("The keys the admin writes")

test("the store's metadata keys are the ones the admin box saves", () => {
  assert.deepEqual(BANNER_KEYS, {
    video: "home_banner_video",
    poster: "home_banner_poster",
    heightDesktop: "home_banner_height_desktop",
    heightMobile: "home_banner_height_mobile",
    hidden: "home_banner_hidden",
  })
})

console.log("When there is a banner")

test("no metadata, no banner, so the page is as it was", () => {
  assert.equal(getHomeBanner(undefined), null)
  assert.equal(getHomeBanner(null), null)
  assert.equal(getHomeBanner({}), null)
  assert.equal(getHomeBanner({ some_other_key: "x" }), null)
})

test("a still image or a height without a video is no banner", () => {
  assert.equal(getHomeBanner({ home_banner_poster: POSTER }), null)
  assert.equal(getHomeBanner({ home_banner_height_desktop: "640" }), null)
  assert.equal(getHomeBanner({ home_banner_video: "   " }), null)
})

test("the video alone is enough, and nothing else is invented", () => {
  assert.deepEqual(getHomeBanner({ home_banner_video: VIDEO }), {
    video: VIDEO,
  })
})

test("everything the admin sets comes through", () => {
  assert.deepEqual(
    getHomeBanner({
      home_banner_video: VIDEO,
      home_banner_poster: POSTER,
      home_banner_height_desktop: "700",
      home_banner_height_mobile: "380",
    }),
    {
      video: VIDEO,
      poster: POSTER,
      heightDesktop: 700,
      heightMobile: 380,
    }
  )
})

test("a path on the shop's own origin works (where uploads are served)", () => {
  assert.deepEqual(
    getHomeBanner({
      home_banner_video: "/static/1700000000000-banner.mp4",
      home_banner_poster: "/static/1700000000000-banner.jpg",
    }),
    {
      video: "/static/1700000000000-banner.mp4",
      poster: "/static/1700000000000-banner.jpg",
    }
  )
})

test("text is trimmed, and the rest of the store's metadata is ignored", () => {
  assert.deepEqual(
    getHomeBanner({
      home_banner_video: `  ${VIDEO}  `,
      home_banner_poster: ` ${POSTER}\n`,
      seo_title: "InfinYtree",
    }),
    { video: VIDEO, poster: POSTER }
  )
})

console.log("Hiding it")

test("hidden keeps the banner off while the rest stays saved", () => {
  for (const hidden of ["true", "TRUE", " true ", "1", "yes", true]) {
    assert.equal(
      getHomeBanner({ home_banner_video: VIDEO, home_banner_hidden: hidden }),
      null,
      String(hidden)
    )
  }
})

test("anything else leaves it on, including the empty text that clears the key", () => {
  for (const hidden of ["", "false", "0", "no", false, null, undefined, 0]) {
    assert.deepEqual(
      getHomeBanner({ home_banner_video: VIDEO, home_banner_hidden: hidden }),
      { video: VIDEO },
      String(hidden)
    )
  }
})

console.log("Addresses")

test("what is not a loadable address is dropped, not put in a page", () => {
  for (const bad of [
    "javascript:alert(1)",
    "data:video/mp4;base64,AAAA",
    "//evil.example.com/a.mp4",
    "ftp://media.example.com/a.mp4",
    "banner.mp4",
    "https://",
    42,
    {},
    ["https://media.example.com/a.mp4"],
  ]) {
    assert.equal(getHomeBanner({ home_banner_video: bad }), null, String(bad))
  }
})

test("a bad still image is dropped and the video still plays", () => {
  assert.deepEqual(
    getHomeBanner({
      home_banner_video: VIDEO,
      home_banner_poster: "javascript:alert(1)",
    }),
    { video: VIDEO }
  )
})

console.log("Heights")

test("a number or the text of one both work", () => {
  assert.deepEqual(
    getHomeBanner({
      home_banner_video: VIDEO,
      home_banner_height_desktop: 640,
      home_banner_height_mobile: " 420 ",
    }),
    { video: VIDEO, heightDesktop: 640, heightMobile: 420 }
  )
})

test("a height is kept inside the allowed range", () => {
  assert.equal(
    getHomeBanner({ home_banner_video: VIDEO, home_banner_height_desktop: 5 })
      ?.heightDesktop,
    MIN_HEIGHT
  )
  assert.equal(
    getHomeBanner({
      home_banner_video: VIDEO,
      home_banner_height_mobile: 99999,
    })?.heightMobile,
    MAX_HEIGHT
  )
})

test("a decimal is rounded", () => {
  assert.equal(
    getHomeBanner({
      home_banner_video: VIDEO,
      home_banner_height_desktop: "640.6",
    })?.heightDesktop,
    641
  )
})

test("empty, zero, negative or not a number means no height, so the default applies", () => {
  for (const height of ["", "  ", "0", 0, "-50", -50, "abc", NaN, Infinity, null, {}]) {
    assert.deepEqual(
      getHomeBanner({
        home_banner_video: VIDEO,
        home_banner_height_desktop: height,
        home_banner_height_mobile: height,
      }),
      { video: VIDEO },
      String(height)
    )
  }
})

test("the defaults the component falls back to are sane", () => {
  assert.ok(DEFAULT_MOBILE_HEIGHT >= MIN_HEIGHT)
  assert.ok(DEFAULT_MOBILE_HEIGHT <= MAX_HEIGHT)
})

console.log(`\n${passed} passed`)
