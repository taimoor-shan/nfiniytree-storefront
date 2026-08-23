import type { MetadataRoute } from "next"

import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { listPages } from "@lib/data/pages"
import { listProducts } from "@lib/data/products"
import { listCountryCodes } from "@lib/data/regions"
import { COUNTRY_TO_LOCALE } from "@lib/util/country-locale"
import { DEFAULT_COUNTRY_CODE, buildUrl } from "@lib/util/seo"

/**
 * `/sitemap.xml`
 *
 * Replaces the dead `next-sitemap.js` config (package not installed, no
 * `postbuild` script), which meant `/sitemap.xml` returned storefront HTML.
 *
 * Only canonical, indexable URLs go in here. Cart, checkout, account, order
 * and transfer routes are excluded — they are `noindex` at the page level and
 * disallowed in robots.txt, so listing them would contradict both. Filtered and
 * paginated listing URLs are excluded for the same reason: the canonical for
 * `/store?page=3` is `/store`.
 *
 * Every entry is emitted once per market, and each one carries the full
 * hreflang cluster via `alternates.languages` so the country variants are
 * declared in the sitemap as well as in the page head.
 */

/** Paths that exist as real routes for every market. */
const STATIC_PATHS: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1.0, changeFrequency: "daily" },
  { path: "/store", priority: 0.9, changeFrequency: "daily" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
  { path: "/customer-service", priority: 0.6, changeFrequency: "monthly" },
  { path: "/policies/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/policies/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/policies/shipping", priority: 0.3, changeFrequency: "yearly" },
  { path: "/policies/returns", priority: 0.3, changeFrequency: "yearly" },
  { path: "/policies/imprint", priority: 0.3, changeFrequency: "yearly" },
]

/**
 * CMS slugs that are already rendered by a dedicated route. Their content is
 * reachable at `/about`, `/contact`, `/customer-service` and `/policies/*`, so
 * including them again under `/pages/<slug>` would put two URLs for the same
 * content in the sitemap. `home` backs the homepage hero and has no standalone
 * page at all.
 *
 * Keep this in sync with STATIC_PATHS above: any path added there that is also
 * a CMS slug must be listed here, or the same content ships under two URLs.
 */
const CMS_SLUGS_WITH_OWN_ROUTE = new Set([
  "home",
  "about",
  "contact",
  "customer-service",
  "privacy-policy",
  "terms-and-conditions",
  "shipping-policy",
  "returns-and-refunds",
  "imprint",
])

/**
 * Fetch everything the sitemap needs, tolerating a backend that is down at
 * build time. A partial sitemap is far better than a build failure or — worse —
 * a sitemap that silently drops to zero URLs without anyone noticing.
 */
async function safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    console.error(
      `[sitemap] Failed to load ${label}: ${
        error instanceof Error ? error.message : "unknown error"
      }. Continuing without it.`
    )
    return fallback
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const discovered = await listCountryCodes()

  // If the backend is unreachable we still emit the default market rather than
  // an empty sitemap, so the file stays valid XML with real URLs in it.
  const countryCodes = discovered.length ? discovered : [DEFAULT_COUNTRY_CODE]

  const defaultCode = countryCodes.includes(DEFAULT_COUNTRY_CODE)
    ? DEFAULT_COUNTRY_CODE
    : countryCodes[0]

  /**
   * The hreflang cluster for one path, in the shape `MetadataRoute.Sitemap`
   * expects (`xhtml:link rel="alternate"` entries in the output).
   */
  const alternatesFor = (path: string) => {
    const languages: Record<string, string> = {}

    for (const code of countryCodes) {
      const hreflang = COUNTRY_TO_LOCALE[code]
      if (!hreflang) continue
      languages[hreflang] = buildUrl(code, path)
    }
    languages["x-default"] = buildUrl(defaultCode, path)

    return Object.keys(languages).length > 1 ? { languages } : undefined
  }

  const entry = (
    path: string,
    countryCode: string,
    opts: {
      priority?: number
      changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"]
      lastModified?: string | Date
    } = {}
  ): MetadataRoute.Sitemap[number] => ({
    url: buildUrl(countryCode, path),
    lastModified: opts.lastModified,
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates: alternatesFor(path),
  })

  // --- Products ------------------------------------------------------------
  // Handles are region-independent, so one listing for the default market is
  // enough to enumerate them for all markets.
  const products = await safe(
    "products",
    async () => {
      const collected: { handle: string; updated_at?: string | null }[] = []
      let page = 1

      // Paginate rather than trusting a single large `limit` — Medusa caps it.
      for (;;) {
        const { response, nextPage } = await listProducts({
          pageParam: page,
          countryCode: defaultCode,
          queryParams: { limit: 100, fields: "handle,updated_at" },
        })

        collected.push(
          ...response.products
            .filter((p) => !!p.handle)
            .map((p) => ({ handle: p.handle!, updated_at: p.updated_at }))
        )

        if (!nextPage) break
        page = nextPage
        // Hard stop so a pagination bug on the backend can never turn a build
        // into an infinite loop.
        if (page > 100) break
      }

      return collected
    },
    []
  )

  // --- Categories ----------------------------------------------------------
  const categories = await safe(
    "categories",
    () => listCategories({ fields: "handle,updated_at", limit: 200 }),
    [] as Awaited<ReturnType<typeof listCategories>>
  )

  // --- Collections ---------------------------------------------------------
  const collections = await safe(
    "collections",
    () => listCollections({ fields: "handle,updated_at", limit: "200" }).then((r) => r.collections),
    [] as Awaited<ReturnType<typeof listCollections>>["collections"]
  )

  // --- CMS pages -----------------------------------------------------------
  // `limit: 200` was rejected outright — the backend caps `limit` at 100 and
  // returns "Value for field 'limit' too big" — so `safe()` swallowed the
  // throw and every CMS page silently vanished from the sitemap. Paginated at
  // the cap instead, driven by the `count` the endpoint reports.
  const cmsPages = await safe(
    "CMS pages",
    async () => {
      const collected: Awaited<ReturnType<typeof listPages>>["pages"] = []
      const limit = 100

      for (let offset = 0; ; offset += limit) {
        const { pages, count } = await listPages({ limit, offset })

        collected.push(...pages)

        if (!pages.length || collected.length >= (count ?? 0)) break
        // Same guard as the product loop: a bad `count` must not spin forever.
        if (offset > limit * 100) break
      }

      return collected
    },
    [] as Awaited<ReturnType<typeof listPages>>["pages"]
  )

  const routes: MetadataRoute.Sitemap = []

  for (const countryCode of countryCodes) {
    for (const { path, priority, changeFrequency } of STATIC_PATHS) {
      routes.push(entry(path, countryCode, { priority, changeFrequency }))
    }

    for (const product of products) {
      routes.push(
        entry(`/products/${product.handle}`, countryCode, {
          priority: 0.8,
          changeFrequency: "weekly",
          lastModified: product.updated_at ?? undefined,
        })
      )
    }

    for (const category of categories) {
      if (!category.handle) continue
      routes.push(
        entry(`/categories/${category.handle}`, countryCode, {
          priority: 0.7,
          changeFrequency: "weekly",
          lastModified: category.updated_at ?? undefined,
        })
      )
    }

    for (const collection of collections) {
      if (!collection.handle) continue
      routes.push(
        entry(`/collections/${collection.handle}`, countryCode, {
          priority: 0.7,
          changeFrequency: "weekly",
          lastModified: collection.updated_at ?? undefined,
        })
      )
    }

    // The CMS stores one record per locale, so the same slug comes back more
    // than once (`about` and `returns-and-refunds` each appear twice today).
    // The storefront URL carries no locale — language is a cookie — so all of
    // those records resolve to a single URL, and emitting one entry per record
    // would repeat that URL inside the sitemap.
    const seenSlugs = new Set<string>()

    for (const page of cmsPages) {
      // Drafts and non-public pages are not reachable, and anything with its
      // own route is already covered by STATIC_PATHS.
      if (page.status !== "published" || page.is_public === false) continue
      if (!page.slug || CMS_SLUGS_WITH_OWN_ROUTE.has(page.slug)) continue
      if (seenSlugs.has(page.slug)) continue
      seenSlugs.add(page.slug)

      routes.push(
        entry(`/pages/${page.slug}`, countryCode, {
          priority: 0.5,
          changeFrequency: "monthly",
        })
      )
    }
  }

  return routes
}
