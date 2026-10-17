import { serverBackendUrl } from "./backend-url"

/**
 * Client links: how a sales rep brings a client in.
 *
 * A rep shares the shop with `?ref=CODE` on any page (home, a product, the
 * sign-up page). The proxy remembers the code in a cookie. When the visitor
 * then creates an account, the code goes into the new customer's metadata and
 * the sales commission plugin links the client to the rep. This file holds the
 * pure parts, so the proxy, the server code and the tests share them.
 */

/** The query parameter of a client link */
export const REFERRAL_PARAM = "ref"

/** Remembers which rep's link the visitor followed. A first-party cookie, httpOnly */
export const REFERRAL_COOKIE = "_sales_rep_ref"

/** 30 days: long enough for a business to decide, short enough not to outlive the conversation */
export const REFERRAL_MAX_AGE = 60 * 60 * 24 * 30

/** Where the code goes in a new customer's metadata; the sales commission plugin reads this key */
export const REFERRAL_METADATA_KEY = "sales_rep_ref"

/**
 * The code in what a visitor sent: trimmed, upper case, without the spaces or
 * hyphens a code gets when it is read out or split for display. Null when it
 * isn't shaped like a code, so junk never reaches a lookup, a cookie or the
 * customer's metadata. Mirrors the plugin's own rule.
 */
export const normalizeReferralCode = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null
  }
  const code = value.trim().toUpperCase().replace(/[\s-]/g, "")

  return /^[A-Z0-9]{6,12}$/.test(code) ? code : null
}

export const referralCookieOptions = () => ({
  maxAge: REFERRAL_MAX_AGE,
  httpOnly: true,
  // lax, not strict: a link opened from an email is a navigation from another site
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
})

/** The metadata of a new customer, with the rep's code in it when there is one. */
export const withReferral = (
  metadata: Record<string, unknown> | undefined,
  code: string | null
): Record<string, unknown> | undefined =>
  code ? { ...metadata, [REFERRAL_METADATA_KEY]: code } : metadata

export type ReferrerLookup =
  | { status: "found"; name: string }
  /** No rep has this code, or the rep can't take clients */
  | { status: "unknown" }
  /** The answer could not be had: the backend was down or slow */
  | { status: "unavailable" }

/**
 * Asks Medusa whose link a code is (the plugin's public `GET /sales-links/:code`).
 * Server code only: the public address doesn't route that path to Medusa, so
 * this uses the address the server reaches Medusa on (see `serverBackendUrl`).
 */
export const lookupReferrer = async (
  code: string,
  {
    fetcher = fetch,
    baseUrl = serverBackendUrl(),
    timeoutMs = 2500,
  }: { fetcher?: typeof fetch; baseUrl?: string; timeoutMs?: number } = {}
): Promise<ReferrerLookup> => {
  try {
    const response = await fetcher(
      `${baseUrl}/sales-links/${encodeURIComponent(code)}`,
      { cache: "no-store", signal: AbortSignal.timeout(timeoutMs) }
    )

    if (response.status === 404) {
      return { status: "unknown" }
    }
    if (!response.ok) {
      return { status: "unavailable" }
    }
    // A page of this storefront instead of JSON throws here: the wrong address
    const name = (await response.json())?.link?.rep_name

    return typeof name === "string" && name
      ? { status: "found", name }
      : { status: "unavailable" }
  } catch {
    return { status: "unavailable" }
  }
}

/**
 * What to do with the `ref` of a request: the code to remember, or null to
 * leave the cookie as it is.
 *
 * The first link wins, for as long as it still leads to a rep: a visitor who
 * was brought by one rep isn't taken over by another rep's link. A link that
 * has gone stale (the rep made a new one, or was deactivated) doesn't block a
 * working one. A code no rep has is not remembered, which keeps other sites'
 * `?ref=newsletter` out of the cookie. An account holder has nothing to be
 * linked to, and a lookup that could not be answered gets the benefit of the
 * doubt.
 */
export const referralToRemember = async (
  {
    param,
    current,
    signedIn,
  }: { param: string | null; current: string | null; signedIn: boolean },
  lookup: (code: string) => Promise<ReferrerLookup> = lookupReferrer
): Promise<string | null> => {
  const code = normalizeReferralCode(param)
  if (!code || signedIn || current === code) {
    return null
  }
  if (current && (await lookup(current)).status !== "unknown") {
    return null
  }

  return (await lookup(code)).status === "unknown" ? null : code
}

/** The rep's link: the shop's address with their code. */
export const clientLinkUrl = (baseUrl: string, code: string) =>
  `${baseUrl.replace(/\/+$/, "")}/?${REFERRAL_PARAM}=${code}`

/**
 * A page of the shop with the rep's code added, for a rep who wants to send a
 * product or a category. Only addresses on the shop's own host are accepted, so
 * the tool can't be used to dress up a link to somewhere else.
 */
export const linkToPage = (
  input: string,
  code: string,
  shopUrl: string
): { ok: true; url: string } | { ok: false; reason: "invalid" | "other_site" } => {
  const text = input.trim()
  if (!text) {
    return { ok: false, reason: "invalid" }
  }

  let shop: URL
  let page: URL
  try {
    shop = new URL(shopUrl)
    // A pasted address without the scheme ("infinytree.com/hu/store") is still an address
    page = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`)
  } catch {
    return { ok: false, reason: "invalid" }
  }
  if (!/^https?:$/.test(page.protocol)) {
    return { ok: false, reason: "invalid" }
  }

  const strip = (host: string) => host.toLowerCase().replace(/^www\./, "")
  if (strip(page.hostname) !== strip(shop.hostname)) {
    return { ok: false, reason: "other_site" }
  }

  page.searchParams.set(REFERRAL_PARAM, code)
  // The rep's own browser address is the shop's, whatever the scheme they pasted
  page.protocol = shop.protocol
  page.hostname = shop.hostname
  page.port = shop.port

  return { ok: true, url: page.toString() }
}
