/** What `/store/blog/*` returns. Mirrors the backend's blog module. */

export type BlogCategory = {
  id: string
  name: string
  handle: string
  locale: string
  description?: string | null
  seo_title?: string | null
  seo_description?: string | null
  /** Only on `GET /store/blog/categories` and `/categories/:handle`. */
  post_count?: number
}

export type BlogPost = {
  id: string
  title: string
  handle: string
  locale: string
  excerpt?: string | null
  /** Only on a single post, not on listing cards. */
  content?: string | null
  featured_image?: string | null
  featured_image_alt?: string | null
  author_name?: string | null
  /** Which layout renders the post. Unknown keys use the default. */
  template?: string | null
  published_at?: string | null
  updated_at?: string | null
  reading_time?: number | null
  seo_title?: string | null
  seo_description?: string | null
  categories?: BlogCategory[]
}

export type BlogPostsResponse = {
  posts: BlogPost[]
  count: number
  limit: number
  offset: number
}

/** `GET /store/blog/posts/:handle`. `post` is null when there is no such post. */
export type BlogPostResponse = {
  post: BlogPost | null
  /** Every language version that exists for this post. */
  locales: string[]
}

/** A post that exists, with the languages it exists in. */
export type FoundBlogPost = {
  post: BlogPost
  locales: string[]
}

export type BlogSitemapResponse = {
  posts: { handle: string; updated_at: string | null }[]
  categories: { handle: string }[]
}
