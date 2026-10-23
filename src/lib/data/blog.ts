"use server"

import { sdk } from "@lib/config"
import type {
  BlogCategory,
  BlogPost,
  BlogPostResponse,
  BlogPostsResponse,
  BlogSitemapResponse,
  FoundBlogPost,
} from "@/types/blog"
import { getCacheOptions, CACHE_TAGS } from "./cache"

/**
 * Blog content from the backend's blog module (`/store/blog/*`).
 *
 * Every call names its locale. The backend falls back to the store's default
 * locale when it gets none, which is not what an English visitor expects, so
 * English is sent as "en" rather than left out.
 *
 * Responses are cached under the `blog` tag; the backend revalidates it
 * whenever a post or category changes, and the TTL is the safety net (it is
 * also what makes a scheduled post appear on time).
 */

const isNotFound = (error: unknown) =>
  (error as { status?: number } | null)?.status === 404

export const listBlogPosts = async ({
  locale,
  category,
  limit = 12,
  offset = 0,
}: {
  locale?: string | null
  category?: string | null
  limit?: number
  offset?: number
}): Promise<BlogPostsResponse> => {
  const next = getCacheOptions(CACHE_TAGS.blog)

  return sdk.client
    .fetch<BlogPostsResponse>("/store/blog/posts", {
      method: "GET",
      query: {
        locale: locale || "en",
        category: category || undefined,
        limit,
        offset,
      },
      next,
      cache: "force-cache",
    })
    .catch((error) => {
      // A blog that cannot load should leave the rest of the site working.
      console.error(
        `[blog] Failed to load posts: ${
          error instanceof Error ? error.message : "unknown error"
        }`
      )
      return { posts: [], count: 0, limit, offset }
    })
}

/**
 * One post in the best available language, or null when there is none.
 *
 * The backend answers 200 with `post: null` for a missing post rather than 404
 * (see the route): Next.js's data cache stores only 200 responses, so a 404
 * would never replace the cached copy of a post that was just unpublished.
 *
 * Anything other than "not found" is thrown, so an outage shows an error page
 * instead of a 404 that search engines would take as the post being gone.
 */
export const retrieveBlogPost = async (
  handle: string,
  locale?: string | null
): Promise<FoundBlogPost | null> => {
  const next = getCacheOptions(CACHE_TAGS.blog)

  return sdk.client
    .fetch<BlogPostResponse>(
      `/store/blog/posts/${encodeURIComponent(handle)}`,
      {
        method: "GET",
        query: { locale: locale || "en" },
        next,
        cache: "force-cache",
      }
    )
    .then(({ post, locales }) => (post ? { post, locales } : null))
    .catch((error) => {
      if (isNotFound(error)) {
        return null
      }
      throw error
    })
}

/** Categories that have at least one published post. */
export const listBlogCategories = async (
  locale?: string | null
): Promise<BlogCategory[]> => {
  const next = getCacheOptions(CACHE_TAGS.blog)

  return sdk.client
    .fetch<{ categories: BlogCategory[] }>("/store/blog/categories", {
      method: "GET",
      query: { locale: locale || "en" },
      next,
      cache: "force-cache",
    })
    .then(({ categories }) => categories)
    .catch((error) => {
      console.error(
        `[blog] Failed to load categories: ${
          error instanceof Error ? error.message : "unknown error"
        }`
      )
      return []
    })
}

export const retrieveBlogCategory = async (
  handle: string,
  locale?: string | null
): Promise<BlogCategory | null> => {
  const next = getCacheOptions(CACHE_TAGS.blog)

  return sdk.client
    .fetch<{ category: BlogCategory | null }>(
      `/store/blog/categories/${encodeURIComponent(handle)}`,
      {
        method: "GET",
        query: { locale: locale || "en" },
        next,
        cache: "force-cache",
      }
    )
    .then(({ category }) => category ?? null)
    .catch((error) => {
      if (isNotFound(error)) {
        return null
      }
      throw error
    })
}

/**
 * Up to `count` other posts to read next: the same category first, topped up
 * with the newest posts.
 */
export const listRelatedPosts = async (
  post: BlogPost,
  locale?: string | null,
  count = 3
): Promise<BlogPost[]> => {
  const primary = post.categories?.[0]?.handle
  const related: BlogPost[] = []

  const take = (posts: BlogPost[]) => {
    for (const candidate of posts) {
      if (
        related.length < count &&
        candidate.handle !== post.handle &&
        !related.some((existing) => existing.handle === candidate.handle)
      ) {
        related.push(candidate)
      }
    }
  }

  // One extra, in case the post itself is among the results.
  if (primary) {
    take(
      (await listBlogPosts({ locale, category: primary, limit: count + 1 }))
        .posts
    )
  }

  if (related.length < count) {
    take((await listBlogPosts({ locale, limit: count + 1 })).posts)
  }

  return related
}

/** Every published post and category handle, for the sitemap. */
export const listBlogSitemap = async (): Promise<BlogSitemapResponse> => {
  const next = getCacheOptions(CACHE_TAGS.blog)

  return sdk.client.fetch<BlogSitemapResponse>("/store/blog/sitemap", {
    method: "GET",
    next,
    cache: "force-cache",
  })
}
