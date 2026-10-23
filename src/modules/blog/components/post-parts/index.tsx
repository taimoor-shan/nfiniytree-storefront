import { clx } from "@medusajs/ui"

import type { BlogPost } from "@/types/blog"
import type { Dictionary } from "@lib/i18n"
import { fillTemplate, formatPostDate } from "@lib/util/blog"
import { normalizeBodyHeadings } from "@lib/util/cms-html"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

import PostCard from "../post-card"

/**
 * The pieces every post template is built from, so a new layout only decides
 * how they are arranged.
 */

type WithDict = { dict: Dictionary }

export function Breadcrumbs({ post, dict }: { post: BlogPost } & WithDict) {
  const category = post.categories?.[0]

  return (
    <nav aria-label={dict["blog.breadcrumb"]} className="mb-6 text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <li>
          <LocalizedClientLink href="/" className="hover:text-ink">
            {dict["nav.home"]}
          </LocalizedClientLink>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <LocalizedClientLink href="/blog" className="hover:text-ink">
            {dict["blog.title"]}
          </LocalizedClientLink>
        </li>
        {category && (
          <>
            <li aria-hidden="true">/</li>
            <li>
              <LocalizedClientLink
                href={`/blog/category/${category.handle}`}
                className="hover:text-ink"
              >
                {category.name}
              </LocalizedClientLink>
            </li>
          </>
        )}
      </ol>
    </nav>
  )
}

export function CategoryChips({ post }: { post: BlogPost }) {
  if (!post.categories?.length) {
    return null
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {post.categories.map((category) => (
        <li key={category.id}>
          <LocalizedClientLink
            href={`/blog/category/${category.handle}`}
            className="inline-block rounded-full bg-surface-card px-3 py-1 text-xs uppercase tracking-[0.15em] text-primary-text transition-colors hover:bg-surface-cream-strong"
          >
            {category.name}
          </LocalizedClientLink>
        </li>
      ))}
    </ul>
  )
}

/** Author, date and reading time, with "updated" when it changed after publishing. */
export function PostMeta({
  post,
  dict,
  locale,
  onDark,
}: { post: BlogPost; locale: string; onDark?: boolean } & WithDict) {
  const published = formatPostDate(post.published_at, locale)
  const updated = formatPostDate(post.updated_at, locale)

  const parts = [
    post.author_name
      ? fillTemplate(dict["blog.by"], { author: post.author_name })
      : null,
    published ? (
      <time key="published" dateTime={post.published_at ?? undefined}>
        {published}
      </time>
    ) : null,
    post.reading_time
      ? fillTemplate(dict["blog.minRead"], { minutes: post.reading_time })
      : null,
    updated && published && updated !== published
      ? fillTemplate(dict["blog.updatedOn"], { date: updated })
      : null,
  ].filter(Boolean)

  if (!parts.length) {
    return null
  }

  return (
    <p
      className={clx(
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-sm",
        onDark ? "text-on-dark/80" : "text-muted"
      )}
      data-testid="blog-post-meta"
    >
      {parts.map((part, index) => (
        <span key={index} className="flex items-center gap-x-3">
          {index > 0 && <span aria-hidden="true">·</span>}
          {part}
        </span>
      ))}
    </p>
  )
}

/** The article text from the rich-text editor. */
export function PostBody({ post }: { post: BlogPost }) {
  if (!post.content) {
    return null
  }

  return (
    <div
      className="prose max-w-none text-lg leading-relaxed [&_a]:text-primary-text [&_h2]:font-display [&_h3]:font-display"
      data-testid="blog-post-content"
      dangerouslySetInnerHTML={{
        __html: normalizeBodyHeadings(post.content, post.title),
      }}
    />
  )
}

/** A nudge from the article to the shop. */
export function ShopCta({ dict }: WithDict) {
  return (
    <aside className="mt-16 rounded-lg bg-surface-card p-8 text-center">
      <h2 className="font-display text-2xl text-ink">
        {dict["blog.shopCtaTitle"]}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-body">
        {dict["blog.shopCtaText"]}
      </p>
      <LocalizedClientLink
        href="/store"
        className="mt-6 inline-flex rounded-md bg-primary-strong px-6 py-3 text-on-primary transition-colors hover:bg-primary-hover"
      >
        {dict["blog.shopCtaButton"]}
      </LocalizedClientLink>
    </aside>
  )
}

export function BackToBlog({ dict }: WithDict) {
  return (
    <LocalizedClientLink
      href="/blog"
      className="mt-10 inline-block text-sm text-primary-text underline-offset-4 hover:underline"
    >
      ← {dict["blog.backToBlog"]}
    </LocalizedClientLink>
  )
}

export function RelatedPosts({
  posts,
  dict,
  locale,
}: { posts: BlogPost[]; locale: string } & WithDict) {
  if (!posts.length) {
    return null
  }

  return (
    <section
      aria-labelledby="related-posts-heading"
      className="border-t border-hairline bg-surface-soft"
    >
      <div className="content-container py-12 lg:py-16">
        <h2
          id="related-posts-heading"
          className="mb-8 font-display text-2xl text-ink lg:text-3xl"
        >
          {dict["blog.relatedPosts"]}
        </h2>
        <ul className="grid grid-cols-1 gap-x-6 gap-y-10 xsmall:grid-cols-2 small:grid-cols-3">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} dict={dict} locale={locale} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
