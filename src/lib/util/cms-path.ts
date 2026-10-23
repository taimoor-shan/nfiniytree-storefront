/**
 * Which CMS page an address stands for.
 *
 * A page is served at `/<slug>` through a catch-all route, which every
 * unknown address under a market reaches, including crawlers probing for
 * `/wp-login.php`. Only an address that could be a slug is looked up; the rest
 * is a 404 without a call to the backend.
 */

/** `guides/plant-care/olive-trees` is as deep as an address may go. */
export const MAX_CMS_SLUG_DEPTH = 4

const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9_-]*$/

const decode = (segment: string): string => {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

/** The CMS slug for the path segments after the market, or null. */
export function cmsSlugFromSegments(
  segments: string[] | undefined
): string | null {
  if (!segments?.length || segments.length > MAX_CMS_SLUG_DEPTH) {
    return null
  }

  const decoded = segments.map(decode)

  return decoded.every((segment) => SEGMENT.test(segment))
    ? decoded.join("/")
    : null
}
