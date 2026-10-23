import { Metadata } from "next"
import { notFound } from "next/navigation"

import { listRelatedPosts, retrieveBlogPost } from "@lib/data/blog"
import { getLocale } from "@lib/data/locale-actions"
import { getMarketPrefix } from "@lib/data/market"
import { getDictionary } from "@lib/i18n"
import { normalizeImageUrl } from "@lib/util/image-url"
import { getSeoAlternates, resolveDescription } from "@lib/util/page-metadata"
import { NOINDEX_METADATA, SITE_NAME } from "@lib/util/seo"
import PostJsonLd from "@modules/blog/components/post-jsonld"
import PostTemplate from "@modules/blog/templates/post"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode, handle } = await props.params
  const locale = (await getLocale()) || "en"
  const found = await retrieveBlogPost(handle, locale)

  // A missing post renders a 404 below. Without this it would inherit the root
  // layout's title and canonical and look like an indexable page.
  if (!found) {
    return NOINDEX_METADATA
  }

  const { post } = found

  // An SEO title is the whole <title>, as the editor's preview shows it. Without
  // one the post title gets the shop's name after it, like product pages.
  const title = post.seo_title || `${post.title} | ${SITE_NAME}`
  const description = resolveDescription(
    [post.seo_description, post.excerpt],
    post.content
  )
  const image = post.featured_image
    ? normalizeImageUrl(post.featured_image)
    : null
  const alt = post.featured_image_alt || post.title

  return {
    title,
    description,
    alternates: await getSeoAlternates(countryCode, `/blog/${handle}`),
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      title,
      ...(description ? { description } : {}),
      url: `/${await getMarketPrefix(countryCode)}/blog/${handle}`,
      ...(post.published_at ? { publishedTime: post.published_at } : {}),
      ...(post.updated_at ? { modifiedTime: post.updated_at } : {}),
      ...(post.author_name ? { authors: [post.author_name] } : {}),
      // Relative `/static/...`, resolved against `metadataBase` in the root
      // layout, so social crawlers stay on the public storefront origin.
      images: image ? [{ url: image, alt }] : [],
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      ...(description ? { description } : {}),
      images: image ? [image] : [],
    },
  }
}

export default async function BlogPostPage(props: Props) {
  const { countryCode, handle } = await props.params
  const locale = (await getLocale()) || "en"

  const found = await retrieveBlogPost(handle, locale)

  if (!found) {
    notFound()
  }

  const { post } = found
  const [dict, related, market] = await Promise.all([
    getDictionary(locale),
    listRelatedPosts(post, locale),
    getMarketPrefix(countryCode),
  ])

  return (
    <>
      <PostJsonLd post={post} market={market} dict={dict} />
      <PostTemplate
        template={post.template}
        post={post}
        dict={dict}
        locale={locale}
        related={related}
      />
    </>
  )
}
