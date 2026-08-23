import type { MetadataRoute } from "next"

import { getSiteUrl } from "@lib/util/seo"

/**
 * `/robots.txt`
 *
 * This replaces a `next-sitemap.js` config that was never wired up: the
 * `next-sitemap` package was not installed and there was no `postbuild` script
 * to run it, so `/robots.txt` and `/sitemap.xml` fell through to the
 * `[countryCode]` dynamic segment and returned storefront HTML with a 200.
 * Crawlers treated that as "no robots file and no sitemap".
 *
 * Next's native `robots.ts` convention takes precedence over dynamic segments,
 * so the route is now served correctly with `content-type: text/plain`.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // Transactional funnel: no crawl value, and indexing it exposes
          // per-session state. Each of these is also `noindex` at the page
          // level, because robots.txt only stops crawling — a URL that is
          // merely disallowed can still be indexed from an external link.
          "/*/cart",
          "/*/checkout",
          "/*/account",
          "/*/account/*",
          "/*/order/*",
          // Internal search / filtered listings: infinite parameter space,
          // all of it duplicating the canonical category and store pages.
          "/*?sortBy=",
          "/*?page=",
          "/*?q=",
          // Next.js internals and the storefront's own API routes.
          "/api/",
          "/_next/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    // Declared explicitly so crawlers that discover a `www.` or `http://` URL
    // are told which origin the content really lives on.
    host: siteUrl,
  }
}
