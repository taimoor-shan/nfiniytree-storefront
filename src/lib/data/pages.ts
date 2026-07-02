"use server"

import { sdk } from "@lib/config"
import { getCacheOptions } from "./cookies"

type Page = {
  id: string
  title: string
  slug: string
  content?: string | null
  excerpt?: string | null
  featured_image?: string | null
  seo_title?: string | null
  seo_description?: string | null
  status: "draft" | "published"
  is_public: boolean
  metadata?: Record<string, unknown> | null
}

type PagesResponse = {
  pages: Page[]
  count: number
  limit: number
  offset: number
}

type PageResponse = {
  page: Page
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
  return sdk.client.fetch<PagesResponse>("/store/pages", {
    method: "GET",
    query: {
      limit,
      offset,
      q,
    },
    cache: "no-store",
  })
}

export const retrievePageBySlug = async (slug: string) => {
  return sdk.client
    .fetch<PageResponse>(`/store/pages/${slug}`, {
      method: "GET",
      cache: "no-store",
    })
    .then(({ page }) => page)
    .catch(() => null)
}
