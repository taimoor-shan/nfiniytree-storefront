import { Metadata } from "next"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"
import { translate } from "@lib/i18n"
import { getLocale } from "@lib/data/locale-actions"
import { getSeoAlternates } from "@lib/util/page-metadata"
import { SITE_NAME } from "@lib/util/seo"

export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params
  const locale = await getLocale()
  const title = await translate("metadata.storeTitle", locale)
  const description = await translate("metadata.storeDescription", locale)

  return {
    title,
    description,
    // The canonical drops `?sortBy=` and `?page=`, so the sorted and paginated
    // variants of the listing consolidate onto `/store` instead of competing
    // with it. robots.txt disallows those parameters as a second line of
    // defence against crawl-budget waste.
    alternates: await getSeoAlternates(countryCode, "/store"),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: `/${countryCode}/store`,
    },
  }
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage(props: Params) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { sortBy, page } = searchParams
  const locale = await getLocale()
  const title = await translate("store.allProducts", locale)
  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
      title={title}
    />
  )
}
