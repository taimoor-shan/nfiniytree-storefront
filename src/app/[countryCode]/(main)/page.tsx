import { Metadata } from "next"
import { Suspense } from "react"

import AllProducts from "@modules/home/components/all-products"
import FeaturedProducts from "@modules/home/components/featured-products"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
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

  // These ran one after another, so the homepage produced no HTML until all of
  // them had resolved. `getLocale()` is only a cookie read, so it costs nothing
  // to await first; the two network calls then go out together.
  // `retrieveStore()` used to be awaited here too, but its `storeName` result
  // was never referenced in the markup — `generateMetadata` fetches the store
  // separately — so it was a roundtrip the page paid for and discarded.
  const locale = (await getLocale()) || "en"

  const [region, collectionsResult, homePage] = await Promise.all([
    getRegion(countryCode),
    listCollections({ fields: "id, handle, title" }),
    retrievePageBySlug("home", locale),
  ])

  const { collections } = collectionsResult

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <Hero page={homePage} />
      {/* <About content={homePage?.content} /> */}
      <Features />
          {/* Each rail issues its own `listProducts` call. Awaited inline, that
              held back the entire homepage HTML — including the hero, which is
              the LCP element. Streaming it behind Suspense lets the hero ship
              immediately and the rails fill in. */}
          <Suspense fallback={<SkeletonProductGrid />}>
            <FeaturedProducts
              collections={collections}
              region={region}
              countryCode={countryCode}
            />
          </Suspense>

      <div className="">
          <AllProducts sortBy={sortBy} page={page} countryCode={countryCode} />
     
      </div>
    </>
  )
}
