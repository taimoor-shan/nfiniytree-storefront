import { Suspense } from "react"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"

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

  return (
    <div className="content-container pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-hairline gap-4">
        <h2 className="text-2xl sm:text-3xl font-display text-ink">All Products</h2>
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
