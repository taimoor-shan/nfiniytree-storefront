import { Metadata } from "next"
import { notFound } from "next/navigation"

import { retrieveBlogCategory } from "@lib/data/blog"
import { getLocale } from "@lib/data/locale-actions"
import { getMarketPrefix } from "@lib/data/market"
import { getDictionary, translate } from "@lib/i18n"
import { parsePageNumber } from "@lib/util/blog"
import { getSeoAlternates, resolveDescription } from "@lib/util/page-metadata"
import { NOINDEX_METADATA, SITE_NAME } from "@lib/util/seo"
import BlogListTemplate from "@modules/blog/templates"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode, handle } = await props.params
  const locale = (await getLocale()) || "en"
  const category = await retrieveBlogCategory(handle, locale)

  // A missing category renders a 404 below. Without this it would inherit the
  // root layout's title and canonical and look like an indexable page.
  if (!category) {
    return NOINDEX_METADATA
  }

  const dict = await getDictionary(locale)
  const title =
    category.seo_title ||
    `${category.name} | ${dict["blog.title"]} | ${SITE_NAME}`
  const description =
    resolveDescription([category.seo_description, category.description]) ||
    (await translate("metadata.blogCategoryDescription", locale)).replace(
      "{category}",
      category.name
    )
  const path = `/blog/category/${handle}`

  return {
    title,
    description,
    alternates: await getSeoAlternates(countryCode, path),
    // A category with no published post is thin content: keep it out of the index.
    ...(category.post_count === 0 ? NOINDEX_METADATA : {}),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: `/${await getMarketPrefix(countryCode)}${path}`,
    },
  }
}

export default async function BlogCategoryPage(props: Props) {
  const { handle } = await props.params
  const { page } = await props.searchParams
  const locale = (await getLocale()) || "en"

  const category = await retrieveBlogCategory(handle, locale)

  if (!category) {
    notFound()
  }

  const dict = await getDictionary(locale)

  return (
    <BlogListTemplate
      dict={dict}
      locale={locale}
      page={parsePageNumber(page)}
      category={category}
    />
  )
}
