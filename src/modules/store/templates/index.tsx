import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = ({
  sortBy,
  page,
  countryCode,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "price_desc"

  return (
    <div
      className="flex flex-col py-10 content-container"
      data-testid="category-container"
    >
      {/* Top bar: title on left, filters on right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-hairline gap-4">
        <h1
          className="text-2xl sm:text-3xl font-display text-ink"
          data-testid="store-page-title"
        >
          All Products
        </h1>
        <RefinementList sortBy={sort} />
      </div>

      {/* Full-width product grid */}
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

export default StoreTemplate
