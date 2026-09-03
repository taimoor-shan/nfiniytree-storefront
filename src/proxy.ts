import { HttpTypes } from "@medusajs/types"
import { NextRequest, NextResponse } from "next/server"
import { CACHE_TAGS } from "./lib/data/cache"
import { getRequestCountry } from "./lib/geo/client-country"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
}

async function getRegionMap() {
  const { regionMap, regionMapUpdated } = regionMapCache

  if (!BACKEND_URL) {
    throw new Error(
      "Middleware.ts: Error fetching regions. Did you set up regions in your Medusa Admin and define a NEXT_PUBLIC_MEDUSA_BACKEND_URL environment variable? Note that the variable is no longer named NEXT_PUBLIC_NEXT_PUBLIC_MEDUSA_BACKEND_URL."
    )
  }

  if (
    !regionMap.keys().next().value ||
    regionMapUpdated < Date.now() - 3600 * 1000
  ) {
    // Fetch regions from Medusa. We can't use the JS client here because middleware is running on Edge and the client needs a Node environment.
    const { regions } = await fetch(`${BACKEND_URL}/store/regions`, {
      headers: {
        "x-publishable-api-key": PUBLISHABLE_API_KEY!,
      },
      next: {
        revalidate: 3600,
        tags: [CACHE_TAGS.regions],
      },
      cache: "force-cache",
    }).then(async (response) => {
      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.message)
      }

      return json
    })

    if (!regions?.length) {
      throw new Error(
        "No regions found. Please set up regions in your Medusa Admin."
      )
    }

    // Create a map of country codes to regions.
    regions.forEach((region: HttpTypes.StoreRegion) => {
      region.countries?.forEach((c) => {
        regionMapCache.regionMap.set(c.iso_2 ?? "", region)
      })
    })

    regionMapCache.regionMapUpdated = Date.now()
  }

  return regionMapCache.regionMap
}

/**
 * Fetches regions from Medusa and sets the region cookie.
 */
async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion>
) {
  try {
    let countryCode

    // Cloudflare `CF-IPCountry` is the primary geo source on self-hosted.
    // Returns `null` for `XX`/invalid/unsupported values, in which case we
    // fall through to `DEFAULT_REGION`. Trusting this header requires the
    // Cloudflare-only Nginx allowlist documented in `cookies.md`; without it
    // the header is spoofable.
    const geoCountry = getRequestCountry(request)?.toLowerCase()

    const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase()

    const selectedCountryCookie = request.cookies
      .get("selected-country")
      ?.value?.toLowerCase()

    if (urlCountryCode && regionMap.has(urlCountryCode)) {
      countryCode = urlCountryCode
    } else if (selectedCountryCookie && regionMap.has(selectedCountryCookie)) {
      countryCode = selectedCountryCookie
    } else if (geoCountry && regionMap.has(geoCountry)) {
      countryCode = geoCountry
    } else if (regionMap.has(DEFAULT_REGION)) {
      countryCode = DEFAULT_REGION
    } else if (regionMap.keys().next().value) {
      countryCode = regionMap.keys().next().value
    }

    return countryCode
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Middleware.ts: Error getting the country code. Did you set up regions in your Medusa Admin and define a NEXT_PUBLIC_MEDUSA_BACKEND_URL environment variable? Note that the variable is no longer named NEXT_PUBLIC_NEXT_PUBLIC_MEDUSA_BACKEND_URL."
      )
    }
  }
}

/**
 * Paths that must never be rewritten into a country-prefixed URL, and must
 * never depend on the Medusa backend being reachable.
 *
 * `robots.txt` and `sitemap.xml` are served by `src/app/robots.ts` and
 * `src/app/sitemap.ts`. They were previously handled only by the generic
 * "contains a dot" check, which ran *after* `getRegionMap()` — so a backend
 * outage turned both of them into 500s and told every crawler the site had no
 * robots file and no sitemap.
 */
const CRAWLER_FILES = new Set([
  "/robots.txt",
  "/sitemap.xml",
  "/favicon.ico",
  "/manifest.json",
  "/llms.txt",
])

/**
 * Is this path segment shaped like an ISO-2 country code?
 *
 * Used to tell an *unsupported market* (`/us`, `/gb`) apart from an
 * unprefixed route (`/store`, `/about`). No real route in this storefront is
 * two letters long, so a two-letter first segment is always a market attempt.
 */
const isCountryCodeShaped = (segment: string | undefined) =>
  !!segment && /^[a-z]{2}$/.test(segment)

/**
 * Proxy to handle region selection and onboarding status.
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Served before anything else: these responses must not be region-dependent
  // and must survive a backend outage.
  if (CRAWLER_FILES.has(pathname)) {
    return NextResponse.next()
  }

  // Any path with a file extension is a static asset or a generated file, not
  // a storefront route. Checked up front so it costs no network call.
  if (pathname.includes(".")) {
    return NextResponse.next()
  }

  let regionMap: Map<string, HttpTypes.StoreRegion>

  try {
    regionMap = await getRegionMap()
  } catch (error) {
    // A backend outage used to surface as an unhandled throw, which Next turns
    // into a 500 for *every* route. Falling back to the configured default
    // region keeps the storefront navigable (and keeps crawlers from recording
    // a site-wide server error) while the backend recovers.
    console.error(
      `[proxy] Could not load regions: ${
        error instanceof Error ? error.message : "unknown error"
      }. Falling back to the default region.`
    )

    const firstSegment = pathname.split("/")[1]?.toLowerCase()
    if (firstSegment === DEFAULT_REGION) {
      return NextResponse.next()
    }

    return redirectToCountry(request, DEFAULT_REGION)
  }

  const countryCode = await getCountryCode(request, regionMap)

  // Exact match on the first path segment. This used to be `.includes()`, a
  // substring test — so with a `hu` region selected, any path whose first
  // segment merely *contained* "hu" (`/human-touch`, `/hu-guide`) was served
  // as though it already carried a country code, skipping the redirect and
  // rendering against an unresolvable region.
  const firstSegment = pathname.split("/")[1]?.toLowerCase()
  const urlHasCountryCode = !!firstSegment && regionMap.has(firstSegment)

  if (urlHasCountryCode) {
    return NextResponse.next()
  }

  if (countryCode) {
    // An unsupported market (`/us`, `/gb`) must have its country segment
    // *replaced*, not prefixed. Prefixing produced `/us` → `/hu/us`, which
    // 404s — a two-hop chain ending in an error, on URLs a crawler can reach
    // from any stale link or mistyped market. Replacing it lands on the real
    // equivalent page (`/us/store` → `/hu/store`) and terminates in a 200.
    const strippedPath = isCountryCodeShaped(firstSegment)
      ? pathname.slice(firstSegment!.length + 1) || "/"
      : pathname

    return redirectToCountry(request, countryCode, strippedPath)
  }

  // Handle case where no valid country code exists (empty regions)
  return new NextResponse(
    "No valid regions configured. Please set up regions with countries in your Medusa Admin.",
    { status: 500 }
  )
}

/**
 * Redirect an unprefixed path into a market.
 *
 * Deliberately 307 and not 308/301: the target is chosen from the visitor's
 * cookie and geo-IP, so it is genuinely per-user. A permanent redirect would be
 * cached by the browser and by any shared CDN, pinning one visitor's market
 * onto everyone else's `/` — and Google advises against permanent redirects for
 * geo-based routing. Indexation is handled instead by the self-referencing
 * canonical on each country URL plus the `x-default` hreflang, so the
 * unprefixed URL never needs to be the indexed one.
 *
 * Two things stop the repeated-redirect behaviour that was observed on
 * cookie-less requests:
 *  - the chosen market is written to the `selected-country` cookie, so the next
 *    request already resolves without a round trip through `/`;
 *  - `Cache-Control: no-store` plus an explicit `Vary` prevents a CDN from
 *    caching or cross-serving the per-visitor redirect.
 *
 * `targetPath` defaults to the request path; callers pass an explicit value to
 * strip an unsupported country segment rather than prefix it.
 */
function redirectToCountry(
  request: NextRequest,
  countryCode: string,
  targetPath?: string
) {
  const pathname = targetPath ?? request.nextUrl.pathname
  const redirectPath = pathname === "/" ? "" : pathname
  const queryString = request.nextUrl.search || ""

  const response = NextResponse.redirect(
    `${request.nextUrl.origin}/${countryCode}${redirectPath}${queryString}`,
    307
  )

  response.cookies.set("selected-country", countryCode, {
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })

  response.headers.set("Cache-Control", "no-store")
  response.headers.set("Vary", "Cookie, CF-IPCountry")

  return response
}

export const config = {
  matcher: [
    // `robots.txt` and `sitemap.xml` are excluded here as well as inside the
    // proxy, so they are never even dispatched through it.
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
