import type { BlogPost } from "@/types/blog"
import type { Dictionary } from "@lib/i18n"

/** What every post layout receives. */
export type PostTemplateProps = {
  post: BlogPost
  dict: Dictionary
  locale: string
  /** The page's market prefix, e.g. `de-at`, for links inside the text. */
  market: string
  /** Other posts to read next. */
  related: BlogPost[]
}
