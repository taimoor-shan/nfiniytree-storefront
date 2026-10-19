"use server"

import { sdk } from "@lib/config"
import { getCacheOptions, CACHE_TAGS } from "./cache"
import { URL_LANGUAGES, languageOf } from "@lib/i18n/market"

export type Locale = {
  code: string
  name: string
}

/**
 * Fetches available locales from the backend, keeping only the languages a
 * URL can carry (`URL_LANGUAGES`): a language the storefront cannot put in
 * the address could be picked but never shown.
 * Returns null if the endpoint returns 404 (locales not configured).
 */
export const listLocales = async (): Promise<Locale[] | null> => {
  const next = getCacheOptions(CACHE_TAGS.locales)

  return sdk.client
    .fetch<{ locales: Locale[] }>(`/store/locales`, {
      method: "GET",
      // Suppress the x-medusa-locale header (auto-injected by config.ts)
      // so the backend returns all configured locales, not a filtered list.
      headers: { "x-medusa-locale": "" },
      next,
      cache: "force-cache",
    })
    .then(({ locales }) =>
      locales.filter((locale) =>
        (URL_LANGUAGES as readonly string[]).includes(languageOf(locale.code))
      )
    )
    .catch(() => null)
}
