const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, "").split("/")[0] ||
  ""
const backendOrigin = (
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
).replace(/\/$/, "")
const backendUrl =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.replace(/^https?:\/\//, "").split("/")[0] ||
  ""
const isBaseUrlHttps = process.env.NEXT_PUBLIC_BASE_URL?.startsWith("https")
const isBackendHttps =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.startsWith("https")

const remotePatterns = [
  {
    protocol: "http",
    hostname: "localhost",
  },
  ...(baseUrl
    ? [
        // Note: needed to serve images from /public folder
        {
          protocol: isBaseUrlHttps ? "https" : "http",
          hostname: baseUrl,
        },
      ]
    : []),
  ...(backendUrl
    ? [
        // Note: only needed when using local-file for product media.
        // Product media is normally rewritten to a same-origin /static/*
        // path (see src/lib/util/image-url.ts), so this is a fallback for
        // any absolute backend URL that slips through. The protocol is
        // derived from the env var rather than hardcoded to https, which
        // previously made this entry dead for http backends.
        {
          protocol: isBackendHttps ? "https" : "http",
          hostname: backendUrl,
        },
      ]
    : []),
  // Note: can be removed after deleting demo products
  {
    protocol: "https",
    hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
  },
  {
    protocol: "https",
    hostname: "medusa-server-testing.s3.amazonaws.com",
  },
  {
    protocol: "https",
    hostname: "medusa-server-testing.s3.us-east-1.amazonaws.com",
  },
  ...(process.env.NEXT_PUBLIC_MINIO_ENDPOINT
    ? [
        // Note: needed when using MinIO bucket storage for media
        {
          protocol: "https",
          hostname: process.env.NEXT_PUBLIC_MINIO_ENDPOINT,
        },
      ]
    : []),
]

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Image Optimization is on. `unoptimized: true` previously disabled all
    // resizing, format conversion and srcset generation, which meant every
    // product card downloaded the full-resolution Medusa original and every
    // `sizes`/`quality` prop in the codebase was dead code.
    // Requires `sharp`, which ships as a direct optional dependency of
    // `next@16` — so no new dependency is needed here. Note that installing
    // with `--omit=optional` would skip it and silently degrade optimization.
    remotePatterns,
    // 75 = product cards/thumbnails (Next's default), 85 = PDP main gallery
    // image. This list is an allowlist, not a hint: a `q` outside it makes the
    // optimizer return **HTTP 400** (`"q" parameter (quality) of 50 is not
    // allowed`), not a clamped image. That is why the old `quality={50}` had to
    // be removed from `Thumbnail` rather than added here — with optimization
    // enabled it would have 400'd every product image instead of merely
    // logging the warning it produced while `unoptimized: true` was set.
    qualities: [75, 85],
    // AVIF first, WebP fallback. Content negotiation is per-request via Accept.
    formats: ["image/avif", "image/webp"],
    // Medusa serves /static with `Cache-Control: public, max-age=0`, so without
    // this the optimizer would re-fetch and re-encode on its own default
    // interval. Uploaded filenames are timestamp-prefixed and never reused, so
    // a long TTL is safe: replacing an image in the admin produces a new URL.
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  async rewrites() {
    // Serve Medusa's product media from the storefront origin. In production
    // Nginx maps /static to the backend; this rewrite gives local dev and
    // `yarn start` the identical URL shape, so image URLs never contain the
    // backend origin and the optimizer treats them as local images (which
    // also sidesteps Next 16's local-IP blocking for remote images).
    if (!backendOrigin) return []
    return [
      {
        source: "/static/:path*",
        destination: `${backendOrigin}/static/:path*`,
      },
    ]
  },
  async redirects() {
    // Domain canonicalization. `NEXT_PUBLIC_BASE_URL` is the canonical origin,
    // so the `www.` host must 308 to it — one permanent hop, no chain. Skipped
    // unless the canonical origin is an https host, so local development on
    // `localhost:8000` is unaffected.
    //
    // HTTP → HTTPS is deliberately *not* handled here. It belongs at the
    // TLS-terminating layer (Nginx / the platform edge): a Next.js redirect
    // only runs after the plaintext request has already been accepted, which
    // means the URL and any cookies have travelled in the clear. The `headers()`
    // block below sends HSTS so browsers upgrade on their own from the second
    // visit onward — but the edge must still issue the first 301.
    if (!isBaseUrlHttps || !baseUrl || baseUrl.startsWith("www.")) {
      return []
    }

    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: `www.${baseUrl}` }],
        destination: `https://${baseUrl}/:path*`,
        permanent: true, // 308
      },
    ]
  },
  async headers() {
    const securityHeaders = [
      // Crawlers and browsers should never sniff a content type — an HTML
      // response mislabelled as an image is how `robots.txt` returning
      // storefront markup went unnoticed for so long.
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
    ]

    // HSTS is only meaningful — and only safe — on an https origin.
    if (isBaseUrlHttps) {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains",
      })
    }

    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Both are generated per request from the live catalogue. A short
        // shared-cache TTL keeps crawler traffic off the Medusa API without
        // letting a new product wait a day to appear in the sitemap.
        source: "/:file(robots.txt|sitemap.xml)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
