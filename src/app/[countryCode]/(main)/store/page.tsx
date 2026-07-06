import { Metadata } from "next"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"
import { translate } from "@lib/i18n"
import { getLocale } from "@lib/data/locale-actions"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return {
    title: await translate("metadata.storeTitle", locale),
    description: await translate("metadata.storeDescription", locale),
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
