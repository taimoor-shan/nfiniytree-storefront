/**
 * Centralised cache configuration for the storefront.
 *
 * Replaces the old "tag-cookieId" pattern (from cookies.ts) with plain,
 * predictable cache tags that can be invalidated from anywhere via
 * next/cache's `revalidateTag()`.
 *
 * Every CMS-managed fetch gets:
 *   - `tags: [constant]`   → targeted invalidation
 *   - `revalidate: {TTL}`  → safety net (auto-expires even if webhook missed)
 *
 * User-specific data (carts, orders, customers) uses `cache: "no-store"`.
 */

// ---------------------------------------------------------------------------
// Cache tag constants
// ---------------------------------------------------------------------------
export const CACHE_TAGS = {
  locales: "locales",
  pages: "pages",
  products: "products",
  categories: "categories",
  collections: "collections",
  store: "store",
  variants: "variants",
  regions: "regions",
  paymentProviders: "payment_providers",
} as const

// ---------------------------------------------------------------------------
// TTL fallback in seconds (Next.js `revalidate` option)
// ---------------------------------------------------------------------------
const CMS_TTL = 300 // 5 minutes for CMS-managed content (safety net)
const STATIC_TTL = 3600 // 1 hour for truly static data

export const TTL = {
  cms: CMS_TTL,
  static: STATIC_TTL,
} as const

// ---------------------------------------------------------------------------
// Helper: build Next.js fetch cache options
// ---------------------------------------------------------------------------

/**
 * Returns `{ tags, revalidate }` suitable for the `next` option of `fetch`.
 *
 * In development (`NODE_ENV !== "production"`) returns an empty object so
 * that caching is effectively disabled and changes are visible immediately.
 *
 * @param tag    - One of the CACHE_TAGS constants
 * @param ttl    - revalidate TTL in seconds (default: CMS_TTL = 300)
 */
export function getCacheOptions(
  tag: string,
  ttl: number = CMS_TTL
): { tags: string[]; revalidate: number } {
  const revalidate = process.env.NODE_ENV !== "production" ? 1 : ttl
  return { tags: [tag], revalidate }
}