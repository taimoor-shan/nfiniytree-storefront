import "server-only"
import { cookies as nextCookies } from "next/headers"

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
