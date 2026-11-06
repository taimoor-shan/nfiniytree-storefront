import "server-only"
import { cookies as nextCookies } from "next/headers"
import { DELIVERY_COUNTRY_COOKIE } from "@lib/util/delivery-on-request"

export const getAuthHeaders = async (): Promise<
  { authorization: string } | Record<string, never>
> => {
  try {
    const cookies = await nextCookies()
    const token = cookies.get("_medusa_jwt")?.value

    if (!token) {
      return {}
    }

    return { authorization: `Bearer ${token}` }
  } catch {
    return {}
  }
}

export const setAuthToken = async (token: string) => {
  const cookies = await nextCookies()
  cookies.set("_medusa_jwt", token, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export const removeAuthToken = async () => {
  const cookies = await nextCookies()
  cookies.set("_medusa_jwt", "", {
    maxAge: -1,
  })
}

export const getCartId = async () => {
  const cookies = await nextCookies()
  return cookies.get("_medusa_cart_id")?.value
}

export const setCartId = async (cartId: string) => {
  const cookies = await nextCookies()
  cookies.set("_medusa_cart_id", cartId, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export const removeCartId = async () => {
  const cookies = await nextCookies()
  cookies.set("_medusa_cart_id", "", {
    maxAge: -1,
  })
}

export const setSelectedCountry = async (countryCode: string) => {
  const cookies = await nextCookies()
  cookies.set("selected-country", countryCode, {
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

/**
 * The country on request the visitor chose in the popup or the header (a
 * European country the shop has no region for). The header names it and the
 * checkout opens as a quote request for it; see `DELIVERY_COUNTRY_COOKIE`.
 */
export const getDeliveryCountry = async (): Promise<string | null> => {
  try {
    const cookies = await nextCookies()
    const value = cookies.get(DELIVERY_COUNTRY_COOKIE)?.value?.toLowerCase()
    return value && /^[a-z]{2}$/.test(value) ? value : null
  } catch {
    return null
  }
}

export const setDeliveryCountry = async (countryCode: string) => {
  const cookies = await nextCookies()
  cookies.set(DELIVERY_COUNTRY_COOKIE, countryCode.toLowerCase(), {
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })
}

export const clearDeliveryCountry = async () => {
  const cookies = await nextCookies()
  cookies.set(DELIVERY_COUNTRY_COOKIE, "", { maxAge: -1, path: "/" })
}

// The sales portal has its own cookie: a sales rep and a shop customer are
// different actors and must never share a session.
const SALES_REP_JWT_COOKIE = "_sales_rep_jwt"

export const getSalesRepAuthHeaders = async (): Promise<
  { authorization: string } | Record<string, never>
> => {
  try {
    const cookies = await nextCookies()
    const token = cookies.get(SALES_REP_JWT_COOKIE)?.value

    return token ? { authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

export const setSalesRepAuthToken = async (token: string) => {
  const cookies = await nextCookies()
  cookies.set(SALES_REP_JWT_COOKIE, token, {
    // Medusa's default JWT lifetime is one day
    maxAge: 60 * 60 * 24,
    httpOnly: true,
    // lax, not strict: a rep following a link from an email stays signed in
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })
}

export const removeSalesRepAuthToken = async () => {
  const cookies = await nextCookies()
  cookies.set(SALES_REP_JWT_COOKIE, "", { maxAge: -1, path: "/" })
}
