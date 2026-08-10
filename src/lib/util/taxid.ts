/**
 * TaxID.dev VIES VAT verification utility with in-memory caching.
 *
 * Called by the API route (for client-side blur verification) and by the
 * server action (for final checkout verification). A shared in-memory cache
 * prevents duplicate TaxID API calls — the server action hits the cache
 * populated by the earlier blur request in the common case.
 *
 * Cache TTLs match TaxID's own cache policy:
 *   - active:   24 hours (86400 seconds)
 *   - invalid:  1 hour  (3600 seconds)
 *   - service_unavailable: not cached
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VatVerificationStatus =
  | "active"
  | "invalid"
  | "service_unavailable"

export interface TaxIDResult {
  status: VatVerificationStatus
  company_name?: string
  company_address?: string
  country?: string
  request_id?: string
  cached?: boolean
}

import { EU_COUNTRY_CODES } from "./vat"

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

interface CacheEntry {
  result: TaxIDResult
  expiresAt: number
}

const cache = new Map<string, CacheEntry>()

const CACHE_TTL: Record<string, number> = {
  active: 86_400_000, // 24 hours in ms
  invalid: 3_600_000, // 1 hour in ms
}

function cacheKey(country: string, vat: string): string {
  return `${country.toLowerCase()}:${vat.trim().toUpperCase()}`
}

function cacheGet(key: string): TaxIDResult | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return { ...entry.result, cached: true }
}

function cacheSet(key: string, result: TaxIDResult): void {
  const ttl = CACHE_TTL[result.status]
  if (!ttl) return // don't cache service_unavailable
  cache.set(key, { result, expiresAt: Date.now() + ttl })
}

// ---------------------------------------------------------------------------
// Core verification function
// ---------------------------------------------------------------------------

const TAXID_BASE_URL = "https://www.taxid.dev/api/v1"

/**
 * Verify a VAT number against VIES via TaxID.dev.
 *
 * @param country - lowercase ISO-2 country code (e.g. "hu", "de", "at")
 * @param vat    - the full VAT number including country prefix
 * @returns structured verification result
 */
export async function verifyVatWithTaxID(
  country: string,
  vat: string
): Promise<TaxIDResult> {
  const key = cacheKey(country, vat)

  // Check cache first
  const cached = cacheGet(key)
  if (cached) return cached

  // VIES only covers EU-27 member states — skip API call for non-EU countries
  if (!EU_COUNTRY_CODES.has(country.toLowerCase())) {
    return { status: "service_unavailable" }
  }

  const apiKey = process.env.TAXID_API_KEY
  if (!apiKey) {
    console.warn("[taxid] TAXID_API_KEY not set — treating as service_unavailable")
    return { status: "service_unavailable" }
  }

  try {
    const url = `${TAXID_BASE_URL}/validate/${encodeURIComponent(country)}/${encodeURIComponent(vat)}`
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      // Next.js extends fetch with a signal; we don't need one here
    })

    if (response.status === 429) {
      console.warn("[taxid] Rate limit exceeded — treating as service_unavailable")
      return { status: "service_unavailable" }
    }

    if (!response.ok) {
      console.warn(`[taxid] HTTP ${response.status} — treating as service_unavailable`)
      return { status: "service_unavailable" }
    }

    const data = await response.json()

    const result: TaxIDResult = {
      status: mapStatus(data.status ?? data.valid),
      company_name: data.company_name || undefined,
      company_address: data.company_address || undefined,
      country: data.country || country,
      request_id: data.request_id || undefined,
      cached: false,
    }

    cacheSet(key, result)
    return result
  } catch (error) {
    console.warn("[taxid] Network error — treating as service_unavailable:", error)
    return { status: "service_unavailable" }
  }
}

/**
 * Map TaxID API response fields to our internal status.
 * TaxID returns `status` as a string; older responses may use `valid` boolean.
 */
function mapStatus(raw: unknown): VatVerificationStatus {
  if (typeof raw === "string") {
    const s = raw.toLowerCase()
    if (s === "active" || s === "valid") return "active"
    if (s === "invalid") return "invalid"
    if (s === "service_unavailable") return "service_unavailable"
  }
  if (typeof raw === "boolean") {
    return raw ? "active" : "invalid"
  }
  return "service_unavailable"
}
