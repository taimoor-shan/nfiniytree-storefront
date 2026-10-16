import "server-only"

import { headers } from "next/headers"

import { MARKET_HEADER, parseMarketSegment } from "@lib/i18n/market"

/**
 * The URL prefix of the current request (`en-hu` for `/en-hu/store`), for
 * building links and redirects that keep the visitor in their language.
 *
 * Falls back to the bare country when the request did not come through a
 * market URL, or when the prefix belongs to another country (a redirect to a
 * different market).
 */
/**
 * The URL prefix of the current request as the proxy set it, or null outside
 * a market URL. For server actions that are not told the country.
 */
export async function getRequestMarketPrefix(): Promise<string | null> {
  try {
    const prefix = (await headers()).get(MARKET_HEADER)
    return prefix && parseMarketSegment(prefix) ? prefix : null
  } catch {
    return null
  }
}

export async function getMarketPrefix(countryCode: string): Promise<string> {
  const country = countryCode.toLowerCase()

  try {
    const prefix = (await headers()).get(MARKET_HEADER)
    if (prefix && parseMarketSegment(prefix)?.country === country) {
      return prefix
    }
  } catch {
    // Outside a request (build time): no prefix to keep.
  }

  return country
}
