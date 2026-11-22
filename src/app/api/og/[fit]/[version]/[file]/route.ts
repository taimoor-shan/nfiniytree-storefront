import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"

import { serverBackendUrl } from "@lib/util/backend-url"
import { DEFAULT_OG_IMAGE, getSiteUrl } from "@lib/util/seo"
import {
  parseShareImagePath,
  SHARE_IMAGE_HEIGHT,
  SHARE_IMAGE_WIDTH,
} from "@lib/util/share-image"

/**
 * `GET /api/og/<fit>/<version>/<base64url file name>.jpg`: an uploaded picture
 * as a 1200 × 630 JPEG for link previews (see `src/lib/util/share-image.ts`).
 *
 * Only pictures from the backend's `/static/` are read, so this cannot be used
 * to fetch anything else. The URL names the upload, whose file name is never
 * reused, so the answer is cached for a year: Cloudflare keeps the `.jpg`, and
 * the picture is drawn once. A picture that cannot be read sends the crawler
 * to the default share image, uncached, so a passing outage is not kept.
 */

/** The shop's cream canvas (`DESIGN.md`), behind a `contain` picture. */
const CANVAS = { r: 0xfa, g: 0xf9, b: 0xf5, alpha: 1 }
const MAX_SOURCE_BYTES = 30 * 1024 * 1024
const FETCH_TIMEOUT_MS = 10_000

export const runtime = "nodejs"

/** The body, refused as soon as it is larger than `limit` bytes. */
async function readAtMost(response: Response, limit: number): Promise<Buffer> {
  const declared = Number(response.headers.get("content-length"))
  if (declared > limit) {
    await response.body?.cancel()
    throw new Error("source too large")
  }
  const reader = response.body?.getReader()
  if (!reader) throw new Error("source has no body")
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > limit) {
      await reader.cancel()
      throw new Error("source too large")
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks)
}

export async function GET(
  _request: NextRequest,
  {
    params,
  }: { params: Promise<{ fit: string; version: string; file: string }> }
) {
  const { fit, version, file } = await params
  const parsed = parseShareImagePath(fit, version, file)
  if (!parsed) {
    return new NextResponse("Not found", { status: 404 })
  }

  try {
    const source = await fetch(
      `${serverBackendUrl()}/static/${parsed.fileName}`,
      { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), cache: "no-store" }
    )
    if (!source.ok) throw new Error(`source answered ${source.status}`)
    const type = source.headers.get("content-type") || ""
    if (!type.startsWith("image/")) throw new Error(`source is ${type}`)
    const bytes = await readAtMost(source, MAX_SOURCE_BYTES)

    const jpeg = await sharp(bytes, { failOn: "none" })
      .rotate()
      .resize(SHARE_IMAGE_WIDTH, SHARE_IMAGE_HEIGHT, {
        fit: parsed.fit,
        position: "centre",
        background: CANVAS,
      })
      .flatten({ background: CANVAS })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer()

    return new NextResponse(new Uint8Array(jpeg), {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(jpeg.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.warn(
      `[og] could not make a share image of ${parsed.fileName}: ${
        error instanceof Error ? error.message : error
      }`
    )
    const fallback = new URL(DEFAULT_OG_IMAGE.url, `${getSiteUrl()}/`)
    return NextResponse.redirect(fallback, {
      status: 302,
      headers: { "Cache-Control": "no-store" },
    })
  }
}
