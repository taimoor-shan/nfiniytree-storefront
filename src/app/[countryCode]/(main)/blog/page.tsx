import { Metadata } from "next"

import { getLocale } from "@lib/data/locale-actions"
import { getMarketPrefix } from "@lib/data/market"
import { getDictionary, translate } from "@lib/i18n"
import { parsePageNumber } from "@lib/util/blog"
import { getSeoAlternates } from "@lib/util/page-metadata"
import { DEFAULT_OG_IMAGE, SITE_NAME } from "@lib/util/seo"
import BlogListTemplate from "@modules/blog/templates"

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params
  const locale = (await getLocale()) || "en"
  const title = await translate("metadata.blogTitle", locale)
  const description = await translate("metadata.blogDescription", locale)

  return {
    title,
    description,
    // The canonical drops `?page=`, so the paginated views consolidate onto
    // `/blog` instead of competing with it, as on `/store`.
    alternates: await getSeoAlternates(countryCode, "/blog"),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: `/${await getMarketPrefix(countryCode)}/blog`,
      images: [DEFAULT_OG_IMAGE],
    },
  }
}

export default async function BlogPage(props: Props) {
  const { page } = await props.searchParams
  const locale = (await getLocale()) || "en"
  const dict = await getDictionary(locale)

  return (
    <BlogListTemplate
      dict={dict}
      locale={locale}
      page={parsePageNumber(page)}
    />
  )
}
