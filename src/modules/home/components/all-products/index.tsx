import { Suspense } from "react"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import { translate } from "@/lib/i18n"
import { getLocale } from "@lib/data/locale-actions"

export default async function AllProducts({
  sortBy,
  page,
  countryCode,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "price_desc"
  const locale = await getLocale()

  return (
    <div className="content-container pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-hairline gap-4">
        <h2 className="text-2xl sm:text-3xl font-display text-ink">
          {await translate("store.allProducts", locale)}
        </h2>
        <RefinementList sortBy={sort} />
      </div>

      <div className="w-full">
        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            countryCode={countryCode}
          />
        </Suspense>
      </div>
    </div>
  )
}
