import "server-only"
import { portalSdk } from "@lib/config"
import { MISROUTED_HINT } from "@lib/util/backend-url"
import {
  PortalBalances,
  PortalClient,
  PortalInvite,
  PortalMonth,
  PortalOrder,
  PortalPayout,
  PortalRecruits,
  PortalRep,
  PortalStatement,
} from "@/types/sales-portal"
import { getSalesRepAuthHeaders } from "./cookies"

/**
 * Reads from the Medusa sales-commission plugin's /sales-portal API, with the
 * signed-in rep's own token. Everything here is private to that rep, so
 * nothing is cached.
 */
export type PortalResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "signed_out" | "no_access" | "not_found" | "error" }

const PERIOD = /^\d{4}-(0[1-9]|1[0-2])$/

/** What to log for a failed call. A reply that isn't JSON means the wrong address. */
const failure = (error: any) =>
  error instanceof SyntaxError
    ? `${error.message}. ${MISROUTED_HINT}`
    : error?.message ?? error

const portalFetch = async <T>(
  path: string,
  query?: Record<string, string | number | undefined>
): Promise<PortalResult<T>> => {
  const headers = await getSalesRepAuthHeaders()

  if (!("authorization" in headers)) {
    return { ok: false, reason: "signed_out" }
  }

  try {
    const data = await portalSdk.client.fetch<T>(path, {
      method: "GET",
      headers,
      query,
      cache: "no-store",
    })

    return { ok: true, data }
  } catch (error: any) {
    // 401: the token expired or is invalid. 403: the rep's access was ended
    // or the rep was deactivated.
    if (error?.status === 401) return { ok: false, reason: "signed_out" }
    if (error?.status === 403) return { ok: false, reason: "no_access" }
    if (error?.status === 404) {
      // A signed-in rep always has a profile, so a 404 there means the request
      // never reached the plugin
      if (path === "/sales-portal/me") {
        console.error(`[sales-portal] ${path} returned 404: ${MISROUTED_HINT}`)
      }
      return { ok: false, reason: "not_found" }
    }

    console.error(`[sales-portal] ${path} failed:`, failure(error))
    return { ok: false, reason: "error" }
  }
}

/** A month from the URL, or undefined for the current one. */
const validPeriod = (period?: string) =>
  period && PERIOD.test(period) ? period : undefined

export const getPortalMe = () =>
  portalFetch<{ sales_rep: PortalRep }>("/sales-portal/me")

export const getPortalStatement = (period?: string) =>
  portalFetch<PortalStatement>("/sales-portal/statement", {
    period: validPeriod(period),
  })

/** What the rep is owed across every month, what is pending, and the next payout day. */
export const getPortalBalances = () =>
  portalFetch<PortalBalances>("/sales-portal/balance")

/** The reps this rep invited, how far along each is, and what Level 2 earns from each. */
export const getPortalRecruits = () =>
  portalFetch<PortalRecruits>("/sales-portal/recruits")

export const getPortalClients = (period?: string) =>
  portalFetch<{ period: string; clients: PortalClient[] }>(
    "/sales-portal/clients",
    { period: validPeriod(period) }
  )

export const getPortalMonths = () =>
  portalFetch<{ statements: PortalMonth[]; count: number }>(
    "/sales-portal/statements"
  )

export const getPortalClientOrders = (customerId: string, offset = 0) =>
  portalFetch<{
    client_name: string
    orders: PortalOrder[]
    count: number
    offset: number
    limit: number
  }>(`/sales-portal/clients/${encodeURIComponent(customerId)}/orders`, {
    offset,
  })

export const getPortalPayouts = () =>
  portalFetch<{ payouts: PortalPayout[] }>("/sales-portal/payouts")

const INVITE_TOKEN = /^[A-Za-z0-9_-]{43}$/

/**
 * What a candidate sees on their invite page. Public: the personal link is the
 * credential, so there is no sign-in. An unknown, mistyped or withdrawn link
 * comes back as not found.
 */
export const getInvite = async (
  token: string
): Promise<
  | { ok: true; data: PortalInvite }
  | { ok: false; reason: "not_found" | "error" }
> => {
  if (!INVITE_TOKEN.test(token)) {
    return { ok: false, reason: "not_found" }
  }

  try {
    const { invite } = await portalSdk.client.fetch<{ invite: PortalInvite }>(
      `/sales-invites/${token}`,
      { method: "GET", cache: "no-store" }
    )

    return { ok: true, data: invite }
  } catch (error: any) {
    if (error?.status === 404) return { ok: false, reason: "not_found" }

    console.error("[sales-portal] invite lookup failed:", failure(error))
    return { ok: false, reason: "error" }
  }
}
