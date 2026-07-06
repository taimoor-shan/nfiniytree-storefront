import { Metadata } from "next"

import AllProducts from "@modules/home/components/all-products"
import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import About from "@modules/home/components/about"
import Features from "@modules/home/components/features"
import { listCollections } from "@lib/data/collections"
import { retrievePageBySlug } from "@lib/data/pages"
import { getRegion } from "@lib/data/regions"
import { retrieveStore } from "@lib/data/store"
import { getLocale } from "@lib/data/locale-actions"
import { translate } from "@lib/i18n"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

export async function generateMetadata(): Promise<Metadata> {
  const store = await retrieveStore()
  const storeName = store?.name || "Infinytree"
  const locale = await getLocale()

  return {
    title: storeName,
    description: await translate("metadata.homeDescription", locale),
  }
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
}) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { sortBy, page } = searchParams
  const { countryCode } = params

  const region = await getRegion(countryCode)
  const locale = (await getLocale()) || "en"

  const { collections } = await listCollections({
    fields: "id, handle, title",
  })
  const store = await retrieveStore()
  const storeName = store?.name || "Infinytree"
  const homePage = await retrievePageBySlug("home", locale)

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <Hero page={homePage} />
      {/* <About content={homePage?.content} /> */}
      <Features />
          <FeaturedProducts collections={collections} region={region} />

      <div className="py-12">
          <AllProducts sortBy={sortBy} page={page} countryCode={countryCode} />
     
      </div>
    </>
  )
}
