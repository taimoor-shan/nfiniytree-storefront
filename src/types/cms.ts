/** A page from the backend's Page module (`/store/pages`). */
export type CmsPage = {
  id: string
  title: string
  slug: string
  locale?: string
  content?: string | null
  excerpt?: string | null
  featured_image?: string | null
  hero_video_url?: string | null
  /** Which layout renders the page. Unknown keys use the default. */
  template?: string | null
  seo_title?: string | null
  seo_description?: string | null
  status: "draft" | "published"
  is_public: boolean
  metadata?: Record<string, unknown> | null
}
