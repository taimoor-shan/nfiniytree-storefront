import { getMarketPrefix } from "@lib/data/market"
import { normalizeImageUrl } from "@lib/util/image-url"
import { Metadata } from "next"
import { Suspense } from "react"

import AllProducts from "@modules/home/components/all-products"
import FeaturedProducts from "@modules/home/components/featured-products"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import Hero from "@modules/home/components/hero"
import About from "@modules/home/components/about"
import Features from "@modules/home/components/features"
import HomeVideoBanner from "@modules/home/components/home-video-banner"
import { listCollections } from "@lib/data/collections"
import { retrievePageBySlug } from "@lib/data/pages"
import { getRegion } from "@lib/data/regions"
import { retrieveStore } from "@lib/data/store"
import { getLocale } from "@lib/data/locale-actions"
import { translate } from "@lib/i18n"
import { getHomeBanner } from "@lib/util/home-banner"
import { getSeoAlternates } from "@lib/util/page-metadata"
import { DEFAULT_OG_IMAGE, SITE_NAME } from "@lib/util/seo"
import OrganizationJsonLd from "@modules/common/components/organization-jsonld"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params
  const store = await retrieveStore()
  const storeName = store?.name || SITE_NAME
  const locale = await getLocale()
  // The store name alone ("InfinYtree") told searchers nothing about the shop.
  const title = await translate("metadata.homeTitle", locale)
  const description = await translate("metadata.homeDescription", locale)
  // The hero picture from the CMS home page, so a shared link shows the shop's
  // own image; the default one only when the page has none.
  const homePage = await retrievePageBySlug("home", locale || "en")
  const heroImage = normalizeImageUrl(homePage?.featured_image)

  return {
    title,
    description,
    // Self-referencing canonical plus the country cluster. Without this the
    // homepage had no canonical at all, so `/hu`, `/at` and `/de` competed with
    // each other as duplicates of the same content.
    alternates: await getSeoAlternates(countryCode),
    openGraph: {
      type: "website",
      siteName: storeName,
      title,
      description,
      url: `/${await getMarketPrefix(countryCode)}`,
      images: heroImage
        ? [{ url: heroImage, alt: await translate("hero.imageAlt", locale) }]
        : [DEFAULT_OG_IMAGE],
    },
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
  // to await first; the network calls then go out together.
  // `retrieveStore()` is awaited here again, now that the markup uses it: the
  // video banner's settings live in the store's metadata. It is the same cached
  // fetch (tag `store`) that `generateMetadata` makes, so it is no extra roundtrip.
  const locale = (await getLocale()) || "en"

  const [region, collectionsResult, homePage, description, store] =
    await Promise.all([
      getRegion(countryCode),
      listCollections({ fields: "id, handle, title" }),
      retrievePageBySlug("home", locale),
      translate("metadata.homeDescription", locale),
      retrieveStore(),
    ])

  const { collections } = collectionsResult
  // Null until the admin sets a video (Settings → Store), so the page is
  // unchanged for a shop without one.
  const banner = getHomeBanner(store?.metadata)

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <OrganizationJsonLd
        description={description}
        inLanguage={locale.split("-")[0]}
      />
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

      {/* Directly under the Best Sellers rail, above the full catalogue. It is a
          full-bleed band (outside any content-container), and its own bottom
          margin replaces the gap the rail used to leave above "All products". */}
      {banner && <HomeVideoBanner banner={banner} />}

      <div className="">
          <AllProducts
            sortBy={sortBy}
            page={page}
            countryCode={countryCode}
            excludeCollectionIds={collections.map((c) => c.id)}
          />
     
      </div>
    </>
  )
}
