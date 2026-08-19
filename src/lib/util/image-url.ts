const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""

/**
 * Rewrites an absolute Medusa media URL to a same-origin `/static/...` path.
 *
 * Medusa builds product image URLs from *its own* file-provider config, not the
 * storefront's, so a backend configured with `http://localhost:9000` hands the
 * browser that origin verbatim. In production the browser cannot reach it, and
 * even when it can, the request bypasses the storefront entirely — no image
 * optimization, no shared cache, and a cross-origin connection per image.
 *
 * Making the path relative means:
 *  - the browser only ever talks to the storefront origin (Nginx maps /static
 *    to the backend in production; a Next rewrite does the same locally), and
 *  - `next/image` treats it as a local image, so it is optimized without
 *    needing a `remotePatterns` entry for the backend host.
 *
 * URLs on other hosts (S3, MinIO, a CDN) are returned untouched — those are
 * already publicly reachable and are covered by `remotePatterns`.
 */
export function normalizeImageUrl(url: string): string
export function normalizeImageUrl(
  url: string | null | undefined
): string | null | undefined
export function normalizeImageUrl(
  url: string | null | undefined
): string | null | undefined {
  if (!url) {
    return url
  }

  // Already relative — nothing to do.
  if (url.startsWith("/")) {
    return url
  }

  if (!BACKEND_URL) {
    return url
  }

  let backendHost: string
  let urlHost: string
  let pathname: string

  try {
    backendHost = new URL(BACKEND_URL).host
    const parsed = new URL(url)
    urlHost = parsed.host
    pathname = parsed.pathname + parsed.search
  } catch {
    // Not an absolute URL we can parse — leave it alone.
    return url
  }

  return urlHost === backendHost ? pathname : url
}
