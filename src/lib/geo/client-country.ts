import { NextRequest } from "next/server"

/**
 * Resolve the visitor's ISO-3166-1 alpha-2 country code from edge-provided
 * geo headers. Never trust a client-supplied value.
 *
 * Order:
 *   1. `CF-IPCountry` — Cloudflare sets this on every proxied request. Trust
 *      requires that direct traffic to the origin is blocked at the edge; see
 *      the Cloudflare-only Nginx allowlist noted in `cookies.md` and the PR
 *      description. Without that allowlist, the header is spoofable.
 *   2. `x-vercel-ip-country` — Vercel-set fallback. Dead on self-hosted, kept
 *      so the helper still does the right thing if the storefront is ever
 *      moved back to Vercel.
 *
 * Returns the lowercased ISO-2 code, or `null` if no usable value was found.
 * Invalid values (anything outside `/^[A-Z]{2}$/i`, and the `XX` sentinel
 * Cloudflare uses when it cannot determine the country) are rejected and the
 * helper falls back to the next signal.
 */
export function getRequestCountry(request: NextRequest): string | null {
  const headers = request.headers

  const cf = headers.get("cf-ipcountry")
  if (cf && isValidIso2(cf)) {
    return cf.toLowerCase()
  }

  const vercel = headers.get("x-vercel-ip-country")
  if (vercel && isValidIso2(vercel)) {
    return vercel.toLowerCase()
  }

  // Dev-only: `x-dev-country` lets you exercise the geo path locally without
  // Cloudflare in the loop. Only honored when NODE_ENV !== "production" so it
  // cannot be abused in prod. Use: `curl -H "x-dev-country: DE" http://localhost:8000/`.
  if (process.env.NODE_ENV !== "production") {
    const dev = headers.get("x-dev-country")
    if (dev && isValidIso2(dev)) {
      return dev.toLowerCase()
    }
  }

  return null
}

/**
 * ISO-3166-1 alpha-2 country code shape. Rejects `XX` (Cloudflare's
 * "unknown" sentinel) and anything longer than two letters.
 */
function isValidIso2(value: string): boolean {
  return /^[A-Z]{2}$/i.test(value) && value.toUpperCase() !== "XX"
}
