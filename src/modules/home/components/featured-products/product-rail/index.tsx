import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

import InteractiveLink from "@modules/common/components/interactive-link"
import ProductPreview from "@modules/products/components/product-preview"
import { translate } from "@/lib/i18n"
import { getLocale } from "@lib/data/locale-actions"

export default async function ProductRail({
  collection,
  region,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
}) {
  const locale = await getLocale()
  const {
    response: { products: pricedProducts },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      collection_id: collection.id,
      fields: "*variants.calculated_price,*variants.prices",
    },
  })

  if (!pricedProducts) {
    return null
  }

  return (
    <div className="content-container py-12 small:py-24">
      <div className="flex justify-center mb-8">
        <Text className="text-2xl sm:text-3xl font-display text-ink">
          {(await translate("home.ourCollection", locale)).replace("{title}", collection.title)}
        </Text>
        {/* <InteractiveLink href={`/collections/${collection.handle}`}>
          View all
        </InteractiveLink> */}
      </div>
      <ul className="grid grid-cols-1 small:grid-cols-3 gap-x-6 gap-y-8">
        {pricedProducts &&
          pricedProducts.map((product) => (
            <li key={product.id}>
              <ProductPreview product={product} region={region} isFeatured />
            </li>
          ))}
      </ul>
    </div>
  )
}
