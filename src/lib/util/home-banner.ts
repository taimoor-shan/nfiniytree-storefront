/**
 * The video banner under the Best Sellers on the home page.
 *
 * The store keeps it in its metadata (admin → Settings → Store → "Homepage
 * video banner"; `src/admin/lib/home-banner.ts` in the backend writes the same
 * keys), which `GET /store/site` returns with the store:
 *   home_banner_video           the video file, MP4 or WebM
 *   home_banner_poster          the still image shown while the video loads, and
 *                               instead of the video for visitors who save data
 *                               or ask for less motion. Optional
 *   home_banner_height_desktop  height in px from 1024 px wide up. Empty: the
 *                               video's own proportions (3:1), whole at any width
 *   home_banner_height_mobile   height in px below 1024 px. Empty: 420
 *   home_banner_hidden          "true" keeps the banner off and the rest saved
 *
 * No video, or hidden, means no banner at all, so a shop that never set one
 * renders the page exactly as before (and the storefront and the admin can be
 * deployed in either order).
 */

/** The metadata keys. Keep in step with the backend's `src/admin/lib/home-banner.ts`. */
export const BANNER_KEYS = {
  video: "home_banner_video",
  poster: "home_banner_poster",
  heightDesktop: "home_banner_height_desktop",
  heightMobile: "home_banner_height_mobile",
  hidden: "home_banner_hidden",
} as const

/** A height outside this range is pulled into it: a typo makes neither a sliver nor a wall. */
export const MIN_HEIGHT = 120
export const MAX_HEIGHT = 1600

/** Phones and tablets (below 1024 px) when the admin sets no height. */
export const DEFAULT_MOBILE_HEIGHT = 420

export type HomeBanner = {
  video: string
  poster?: string
  /** px. Absent: follow the video's own proportions. */
  heightDesktop?: number
  /** px. Absent: `DEFAULT_MOBILE_HEIGHT`. */
  heightMobile?: number
}

type StoreMetadata = Record<string, unknown> | null | undefined

/**
 * An address the browser can load: one on the web, or a path on the shop's own
 * origin (`/static/…`, where uploads are served). Anything else (`javascript:`,
 * `data:`, a protocol-relative `//host`) is dropped rather than put in a page.
 * The same rule as `asMediaUrl()` in `product-video.ts`.
 */
const asMediaUrl = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined
  const url = value.trim()
  return /^(https?:\/\/\S|\/(?!\/)\S)/i.test(url) ? url : undefined
}

/** A positive number (or the text of one), kept inside the allowed range. */
const asHeight = (value: unknown): number | undefined => {
  const number =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : NaN

  if (!Number.isFinite(number) || number <= 0) return undefined

  return Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.round(number)))
}

const isOn = (value: unknown): boolean =>
  value === true ||
  (typeof value === "string" && /^(true|1|yes|on)$/i.test(value.trim()))

/** The banner the store's metadata describes, or null when there is nothing to show. */
export function getHomeBanner(metadata: StoreMetadata): HomeBanner | null {
  const video = asMediaUrl(metadata?.[BANNER_KEYS.video])
  if (!video || isOn(metadata?.[BANNER_KEYS.hidden])) return null

  const poster = asMediaUrl(metadata?.[BANNER_KEYS.poster])
  const heightDesktop = asHeight(metadata?.[BANNER_KEYS.heightDesktop])
  const heightMobile = asHeight(metadata?.[BANNER_KEYS.heightMobile])

  return {
    video,
    ...(poster ? { poster } : {}),
    ...(heightDesktop ? { heightDesktop } : {}),
    ...(heightMobile ? { heightMobile } : {}),
  }
}
