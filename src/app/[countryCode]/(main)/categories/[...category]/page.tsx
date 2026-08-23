import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle, listCategories } from "@lib/data/categories"
import { listRegions } from "@lib/data/regions"
import { getLocale } from "@lib/data/locale-actions"
import { translate } from "@lib/i18n"
import { getSeoAlternates } from "@lib/util/page-metadata"
import { SITE_NAME } from "@lib/util/seo"
import { StoreRegion } from "@medusajs/types"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type Props = {
  params: Promise<{ category: string[]; countryCode: string }>
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
}

export async function generateStaticParams() {
  const product_categories = await listCategories()

  if (!product_categories) {
    return []
  }

  const countryCodes = await listRegions().then((regions: StoreRegion[]) =>
    regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
  )

  const categoryHandles = product_categories.map(
    (category: any) => category.handle
  )

  const staticParams = countryCodes
    ?.map((countryCode: string | undefined) =>
      categoryHandles.map((handle: any) => ({
        countryCode,
        category: [handle],
      }))
    )
    .flat()

  return staticParams
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { countryCode } = params

  try {
    const productCategory = await getCategoryByHandle(params.category)

    // `title` used to be built as `name + " | Infinytree"` and then interpolated
    // again into `` `${title} | Infinytree` ``, so every category page shipped a
    // doubled suffix ("Palms | Infinytree | Infinytree").
    const title = `${productCategory.name} | ${SITE_NAME}`

    const locale = await getLocale()
    const description =
      productCategory.description?.trim() ||
      (await translate("metadata.categoryDescription", locale)).replace(
        "{category}",
        productCategory.name
      )

    const path = `/categories/${params.category.join("/")}`

    return {
      title,
      description,
      // The canonical was previously the bare relative handle
      // (`"plants/palms"`), which Next resolves against `metadataBase` — so it
      // pointed at `https://infinytree.com/plants/palms`, a URL that does not
      // exist. It now carries the country prefix and the `/categories` segment,
      // and drops `?sortBy=`/`?page=` so the sorted and paginated views
      // consolidate onto the base category URL.
      alternates: await getSeoAlternates(countryCode, path),
      openGraph: {
        type: "website",
        siteName: SITE_NAME,
        title,
        description,
        url: `/${countryCode}${path}`,
      },
    }
  } catch (error) {
    notFound()
  }
}

export default async function CategoryPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page } = searchParams

  let productCategory: Awaited<ReturnType<typeof getCategoryByHandle>>

  try {
    productCategory = await getCategoryByHandle(params.category)
  } catch (error) {
    notFound()
  }

  if (!productCategory) {
    notFound()
  }

  return (
    <CategoryTemplate
      category={productCategory}
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
    />
  )
}
