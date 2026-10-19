"use server"

import { sdk } from "@lib/config"
import { revalidateTag } from "next/cache"
import { cookies as nextCookies, headers as nextHeaders } from "next/headers"
import { LOCALE_HEADER, matchLocale } from "@lib/i18n/market"
import { getAuthHeaders, getCartId } from "./cookies"
import { CACHE_TAGS } from "./cache"
import { listLocales } from "./locales"

const LOCALE_COOKIE_NAME = "_medusa_locale"

/**
 * Gets the current locale: the language in the URL (`/en-hu` → `en`,
 * `/de-hu` → `de-DE`, set by the proxy, see `src/lib/i18n/market.ts`), else
 * the visitor's cookie for requests outside a market URL.
 *
 * German comes in two variants (`de-AT`, `de-DE`). When Medusa only offers
 * the other one, that one is used, so products, categories and pages keep
 * their German text instead of falling back to English.
 */
export const getLocale = async (): Promise<string | null> => {
  let locale: string | null
  try {
    locale =
      (await nextHeaders()).get(LOCALE_HEADER) ??
      (await nextCookies()).get(LOCALE_COOKIE_NAME)?.value ??
      null
  } catch {
    return null
  }

  if (!locale || locale === "en") return locale

  const available = await listLocales()
  return matchLocale(
    locale,
    available?.map((l) => l.code)
  )
}

/**
 * Sets the locale cookie
 */
export const setLocaleCookie = async (locale: string) => {
  const cookies = await nextCookies()
  cookies.set(LOCALE_COOKIE_NAME, locale, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: false, // Allow client-side access
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

/**
 * Updates the locale preference via SDK and stores in cookie.
 * Also updates the cart with the new locale if one exists.
 */
export const updateLocale = async (localeCode: string): Promise<string> => {
  await setLocaleCookie(localeCode)

  // Update cart with the new locale if a cart exists
  const cartId = await getCartId()
  if (cartId) {
    const headers = {
      ...(await getAuthHeaders()),
    }

    await sdk.store.cart.update(cartId, { locale: localeCode }, {}, headers)

    revalidateTag(CACHE_TAGS.products, "max")
  }

  // Revalidate relevant caches so content appears in the new locale
  revalidateTag(CACHE_TAGS.products, "max")
  revalidateTag(CACHE_TAGS.categories, "max")
  revalidateTag(CACHE_TAGS.collections, "max")
  revalidateTag(CACHE_TAGS.locales, "max")

  return localeCode
}