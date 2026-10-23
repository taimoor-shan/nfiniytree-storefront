import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getLocale } from "@lib/data/locale-actions"
import { getMarketPrefix } from "@lib/data/market"
import { retrievePageBySlug } from "@lib/data/pages"
import { cmsSlugFromSegments } from "@lib/util/cms-path"
import { getSeoAlternates, resolveDescription } from "@lib/util/page-metadata"
import { NOINDEX_METADATA, SITE_NAME } from "@lib/util/seo"
import PageTemplate from "@modules/cms/page-templates"

/**
 * Any CMS page, at `/<slug>`.
 *
 * This is what makes a new page need no code: publish it in the admin, pick a
 * template, and it is live at its slug (`guides/plant-care` for a nested
 * address). Routes that exist as files (`/about`, `/contact`, `/store`, the
 * policies, ...) always win over this one, so those keep working as they are;
 * everything else under a market that matches no route lands here and is
 * looked up in the CMS.
 */

type Props = {
  params: Promise<{ countryCode: string; slug: string[] }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode, slug: segments } = await props.params
  const slug = cmsSlugFromSegments(segments)

  // Not an address a page can have, or no such page: a 404 follows, which must
  // not inherit the root layout's title and canonical.
  if (!slug) {
    return NOINDEX_METADATA
  }

  const locale = (await getLocale()) || "en"
  const page = await retrievePageBySlug(slug, locale)

  if (!page) {
    return NOINDEX_METADATA
  }

  const title = page.seo_title || page.title
  // A field holding only whitespace is truthy; `resolveDescription` skips it and,
  // as a last resort, derives a description from the page text.
  const description = resolveDescription(
    [page.seo_description, page.excerpt],
    page.content
  )
  const path = `/${slug}`

  return {
    title,
    description,
    alternates: await getSeoAlternates(countryCode, path),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      ...(description ? { description } : {}),
      url: `/${await getMarketPrefix(countryCode)}${path}`,
      ...(page.featured_image ? { images: [{ url: page.featured_image }] } : {}),
    },
  }
}

export default async function CmsPage(props: Props) {
  const { slug: segments } = await props.params
  const slug = cmsSlugFromSegments(segments)

  if (!slug) {
    notFound()
  }

  const locale = (await getLocale()) || "en"
  const page = await retrievePageBySlug(slug, locale)

  if (!page) {
    notFound()
  }

  return <PageTemplate template={page.template} page={page} locale={locale} />
}
