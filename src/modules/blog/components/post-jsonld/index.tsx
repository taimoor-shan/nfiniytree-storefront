import type { BlogPost } from "@/types/blog"
import type { Dictionary } from "@lib/i18n"
import { resolveDescription } from "@lib/util/page-metadata"
import { getSiteUrl, SITE_NAME } from "@lib/util/seo"
import { toAbsoluteUrl } from "@lib/util/structured-data"

type PostJsonLdProps = {
  post: BlogPost
  /** The URL prefix the page is shown under (`hu`, `en-hu`). */
  market: string
  dict: Dictionary
}

/**
 * Article and breadcrumb structured data (JSON-LD) for a blog post.
 *
 * Only what the post record holds is emitted. The author is the named author
 * when there is one, else the shop; the publisher is always the shop.
 */
export default function PostJsonLd({ post, market, dict }: PostJsonLdProps) {
  const site = getSiteUrl()
  const prefix = `${site}/${market.toLowerCase()}`
  const url = `${prefix}/blog/${post.handle}`
  const image = toAbsoluteUrl(post.featured_image)
  const description = resolveDescription(
    [post.seo_description, post.excerpt],
    post.content
  )
  const category = post.categories?.[0]

  const article = {
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    // Google reads at most 110 characters of a headline.
    headline: post.title.slice(0, 110),
    ...(description ? { description } : {}),
    ...(image ? { image: [image] } : {}),
    ...(post.published_at ? { datePublished: post.published_at } : {}),
    dateModified: post.updated_at || post.published_at || undefined,
    inLanguage: post.locale,
    ...(category ? { articleSection: category.name } : {}),
    author:
      post.author_name && post.author_name !== SITE_NAME
        ? { "@type": "Person", name: post.author_name }
        : { "@type": "Organization", name: SITE_NAME, url: site },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: site,
      logo: { "@type": "ImageObject", url: `${site}/logo-full.png` },
    },
  }

  const crumbs = [
    { name: dict["nav.home"], url: prefix },
    { name: dict["blog.title"], url: `${prefix}/blog` },
    ...(category
      ? [{ name: category.name, url: `${prefix}/blog/category/${category.handle}` }]
      : []),
    { name: post.title, url },
  ]

  const breadcrumbs = {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      // `<` is escaped so a stray `</script>` in editor-entered copy cannot
      // break out of the script element.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [article, breadcrumbs],
        }).replace(/</g, "\\u003c"),
      }}
    />
  )
}
