"use client"

import { useParams } from "next/navigation"
import { createContext, useContext } from "react"

import { marketPrefix, stripMarketPrefix } from "@lib/i18n/market"

/**
 * The URL prefix the page was requested under (`en-hu` for `/en-hu/store`).
 *
 * The proxy rewrites `/en-hu/...` to the `hu` route, so the `countryCode`
 * route param is always the bare country. Links need the prefix instead, or
 * every click would drop the visitor back into the market's own language. It
 * is provided by `src/app/[countryCode]/layout.tsx` from the request header.
 */
const MarketPrefixContext = createContext<string | null>(null)

export function MarketPrefixProvider({
  prefix,
  children,
}: {
  prefix: string
  children: React.ReactNode
}) {
  return (
    <MarketPrefixContext value={prefix}>{children}</MarketPrefixContext>
  )
}

/**
 * The current URL prefix, or the bare country when no provider is mounted
 * (the proxy then redirects it to the visitor's language).
 */
export function useMarketPrefix(): string {
  const prefix = useContext(MarketPrefixContext)
  const { countryCode } = useParams() as { countryCode?: string }
  return prefix ?? countryCode ?? ""
}

/**
 * Load the current page in another market or language (`/hu/store` →
 * `/en-hu/store`). A full page load on purpose: the language is read once per
 * request by the root layout, which a client-side navigation would not render
 * again.
 */
export function goToMarket(country: string, locale: string | null) {
  const path = stripMarketPrefix(window.location.pathname)
  window.location.assign(
    `/${marketPrefix(country, locale)}${path}${window.location.search}`
  )
}
