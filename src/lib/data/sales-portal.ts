import "server-only"
import { sdk } from "@lib/config"
import {
  PortalClient,
  PortalLine,
  PortalMonth,
  PortalOrder,
  PortalPayout,
  PortalRep,
  PortalTotals,
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

const portalFetch = async <T>(
  path: string,
  query?: Record<string, string | number | undefined>
): Promise<PortalResult<T>> => {
  const headers = await getSalesRepAuthHeaders()

  if (!("authorization" in headers)) {
    return { ok: false, reason: "signed_out" }
  }

  try {
    const data = await sdk.client.fetch<T>(path, {
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
    if (error?.status === 404) return { ok: false, reason: "not_found" }

    console.error(`[sales-portal] ${path} failed:`, error?.message ?? error)
    return { ok: false, reason: "error" }
  }
}

/** A month from the URL, or undefined for the current one. */
const validPeriod = (period?: string) =>
  period && PERIOD.test(period) ? period : undefined

export const getPortalMe = () =>
  portalFetch<{ sales_rep: PortalRep }>("/sales-portal/me")

export const getPortalStatement = (period?: string) =>
  portalFetch<{ period: string; lines: PortalLine[]; totals: PortalTotals[] }>(
    "/sales-portal/statement",
    { period: validPeriod(period) }
  )

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
