"use server"

import { sdk } from "@lib/config"
import type { CmsPage } from "@/types/cms"
import { getCacheOptions, CACHE_TAGS } from "./cache"

type PagesResponse = {
  pages: CmsPage[]
  count: number
  limit: number
  offset: number
}

type PageResponse = {
  /** Null when there is no such page: the backend answers 200, not 404. */
  page: CmsPage | null
}

export const listPages = async ({
  limit = 20,
  offset = 0,
  q,
}: {
  limit?: number
  offset?: number
  q?: string
}) => {
  const next = getCacheOptions(CACHE_TAGS.pages)

  return sdk.client.fetch<PagesResponse>("/store/pages", {
    method: "GET",
    query: {
      limit,
      offset,
      q,
    },
    next,
    cache: "force-cache",
  })
}

export const retrievePageBySlug = async (slug: string, locale?: string | null) => {
  const next = getCacheOptions(CACHE_TAGS.pages)

  return sdk.client
    // Encoded because a slug may contain slashes (`guides/plant-care`), which
    // the backend takes as one path segment.
    .fetch<PageResponse>(`/store/pages/${encodeURIComponent(slug)}`, {
      method: "GET",
      query: locale ? { locale } : undefined,
      next,
      cache: "force-cache",
    })
    .then(({ page }) => page)
    .catch(() => null)
}