import type { BlogPost } from "@/types/blog"
import type { Dictionary } from "@lib/i18n"
import { fillTemplate, formatPostDate } from "@lib/util/blog"
import FillImage from "@modules/common/components/fill-image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PlaceholderImage from "@modules/common/icons/placeholder-image"

type PostCardProps = {
  post: BlogPost
  dict: Dictionary
  locale: string
  /** Above the fold: load the image at once. */
  eager?: boolean
}

/** One post in a listing. The whole card is a single link, like a product's. */
export default function PostCard({ post, dict, locale, eager }: PostCardProps) {
  const date = formatPostDate(post.published_at, locale)
  const category = post.categories?.[0]
  const readingTime = post.reading_time
    ? fillTemplate(dict["blog.minRead"], { minutes: post.reading_time })
    : ""

  return (
    <article>
      <LocalizedClientLink
        href={`/blog/${post.handle}`}
        className="group flex flex-col"
        data-testid="blog-post-link"
      >
        <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-surface-card">
          {post.featured_image ? (
            <FillImage
              src={post.featured_image}
              alt={post.featured_image_alt || post.title}
              sizes="(max-width: 511px) 100vw, (max-width: 1023px) 50vw, 33vw"
              eager={eager}
              className="transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-soft">
              <PlaceholderImage size="32" />
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-col gap-y-2">
          {category && (
            <p className="text-xs uppercase tracking-[0.15em] text-primary-text">
              {category.name}
            </p>
          )}
          <h2 className="font-display text-2xl leading-snug text-ink group-hover:text-primary-text">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="line-clamp-3 text-body">{post.excerpt}</p>
          )}
          {(date || readingTime) && (
            <p className="text-sm text-muted">
              {[date, readingTime].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </LocalizedClientLink>
    </article>
  )
}
