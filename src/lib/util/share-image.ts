/**
 * Share images: the picture Facebook, LinkedIn, WhatsApp, X and Slack show
 * when someone posts a link to the shop.
 *
 * Two things made shared links look out of date:
 *  - Social networks cache a preview by the image's URL. A fixed file name
 *    (`/og-default.jpg`, the old `opengraph-image.jpg`) kept its old picture in
 *    their cache after the file was replaced, so every share image here has a
 *    URL that changes when the picture does.
 *  - The pictures editors upload (`/static/<timestamp>-name.avif`, portrait
 *    product photos) are not what the networks want: Facebook does not read
 *    AVIF and crops anything that is not about 1.91 : 1 on its own.
 *
 * So an uploaded picture is served for sharing through `/api/og/...`
 * (`src/app/api/og/[fit]/[version]/[file]/route.ts`), which turns it into a
 * 1200 × 630 JPEG. Its URL is built from the upload's own file name, which the
 * backend never reuses (a new upload gets a new timestamp), so a new picture
 * is a new URL; `SHARE_IMAGE_VERSION` changes every URL at once when the way
 * the JPEG is drawn changes.
 *
 * Pure and dependency-free so it can be tested with `npx tsx`.
 */

/** Size social networks ask for (Facebook, LinkedIn: 1.91 : 1). */
export const SHARE_IMAGE_WIDTH = 1200
export const SHARE_IMAGE_HEIGHT = 630

/** Bump to give every generated share image a new URL. */
export const SHARE_IMAGE_VERSION = "v1"

/**
 * `cover` fills the frame and crops the edges (hero and blog photos, which are
 * landscape already). `contain` shows the whole picture on the shop's cream
 * canvas (portrait product photos, which a crop would cut in half).
 */
export type ShareImageFit = "cover" | "contain"

export type ShareImage = {
  url: string
  width?: number
  height?: number
  alt?: string
  type?: string
}

const FITS: readonly ShareImageFit[] = ["cover", "contain"]

/** Characters a base64url string can hold. */
const BASE64URL = /^[A-Za-z0-9_-]+$/

/** One path segment of an uploaded file, as it appears after `/static/`. */
const isSafeFileName = (name: string) => {
  // The name is put into the backend URL as it is, so judge it as the URL
  // parser will: `%2e%2e` is `..` there and would leave `/static/`.
  let decoded: string
  try {
    decoded = decodeURIComponent(name)
  } catch {
    return false
  }
  return isSafePlainName(name) && isSafePlainName(decoded)
}

const isSafePlainName = (name: string) =>
  name.length > 0 &&
  name.length <= 300 &&
  !name.includes("/") &&
  !name.includes("\\") &&
  !name.includes("?") &&
  !name.includes("#") &&
  name !== "." &&
  name !== ".."

const toBase64Url = (text: string) =>
  Buffer.from(text, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")

const fromBase64Url = (text: string) =>
  Buffer.from(text.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
    "utf8"
  )

/**
 * The uploaded file's name when `url` is a picture the backend serves from
 * `/static/` (relative, or absolute on any host), else null. The name stays
 * percent-encoded exactly as in the URL, because that is how `/static/` is
 * asked for it.
 */
export function staticFileName(url: string | null | undefined): string | null {
  if (!url) return null
  let pathname = url
  if (!url.startsWith("/")) {
    try {
      pathname = new URL(url).pathname
    } catch {
      return null
    }
  }
  const match = /^\/static\/([^/?#]+)$/.exec(pathname.split(/[?#]/)[0])
  if (!match || !isSafeFileName(match[1])) return null
  return match[1]
}

/** Path of the 1200 × 630 JPEG made from an uploaded file. */
export const shareImagePath = (fileName: string, fit: ShareImageFit) =>
  `/api/og/${fit}/${SHARE_IMAGE_VERSION}/${toBase64Url(fileName)}.jpg`

/**
 * The share image for a picture: the generated 1200 × 630 JPEG for an upload,
 * the URL as it is for anything else (a picture on another host, which the
 * route will not fetch). Null without a picture.
 */
export function shareImageFor(
  url: string | null | undefined,
  { fit, alt }: { fit: ShareImageFit; alt?: string | null }
): ShareImage | null {
  if (!url?.trim()) return null
  const name = staticFileName(url.trim())
  const altText = alt?.trim() || undefined
  if (!name) return { url: url.trim(), ...(altText ? { alt: altText } : {}) }
  return {
    url: shareImagePath(name, fit),
    width: SHARE_IMAGE_WIDTH,
    height: SHARE_IMAGE_HEIGHT,
    type: "image/jpeg",
    ...(altText ? { alt: altText } : {}),
  }
}

/**
 * Reads the route's segments back: `{ fit, fileName }`, or null for anything
 * the route did not hand out (an unknown fit or version, a name that is not
 * base64url or that decodes to a path).
 */
export function parseShareImagePath(
  fit: string,
  version: string,
  file: string
): { fit: ShareImageFit; fileName: string } | null {
  if (!FITS.includes(fit as ShareImageFit)) return null
  if (version !== SHARE_IMAGE_VERSION) return null
  if (!file.endsWith(".jpg")) return null
  const encoded = file.slice(0, -".jpg".length)
  if (!encoded || !BASE64URL.test(encoded)) return null
  const fileName = fromBase64Url(encoded)
  if (!isSafeFileName(fileName) || toBase64Url(fileName) !== encoded) {
    return null
  }
  return { fit: fit as ShareImageFit, fileName }
}
