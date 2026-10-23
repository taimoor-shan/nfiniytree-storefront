import { normalizeImageUrl } from "./image-url"
import { getSiteUrl } from "./seo"

/**
 * Absolute, publicly fetchable URL for a media asset.
 *
 * `normalizeImageUrl` deliberately returns a same-origin `/static/...` path so
 * the browser never talks to the Medusa host directly. Structured data has the
 * opposite requirement: Google fetches these URLs out of band and cannot
 * resolve a relative path, so the site origin is put in front.
 */
export const toAbsoluteUrl = (
  url: string | null | undefined
): string | null => {
  if (!url) return null

  const normalized = normalizeImageUrl(url)

  if (!normalized) return null
  if (/^https?:\/\//i.test(normalized)) return normalized

  return `${getSiteUrl()}${normalized.startsWith("/") ? "" : "/"}${normalized}`
}
