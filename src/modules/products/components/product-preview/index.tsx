import { Text } from "@medusajs/ui"
import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import { getLocale } from "@lib/data/locale-actions"
import { translate } from "@/lib/i18n"

export default async function ProductPreview({
  product,
  isFeatured,
  region,
  eager,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
  /** Above the fold — load the thumbnail immediately instead of lazily. */
  eager?: boolean
}) {
  // const pricedProduct = await listProducts({
  //   regionId: region.id,
  //   queryParams: { id: [product.id!] },
  // }).then(({ response }) => response.products[0])

  // if (!pricedProduct) {
  //   return null
  // }

  const { cheapestPrice } = getProductPrice({
    product,
  })

  const locale = await getLocale()
  const netPriceLabel = await translate("product.netPrice", locale)

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group">
      <div data-testid="product-wrapper" className="relative">
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          size="full"
          isFeatured={isFeatured}
          eager={eager}
        />
        {product.categories && product.categories.length > 0 && (
          <span className="absolute top-3 left-3 z-10 text-xs px-2.5 py-1 rounded-full bg-primary text-white uppercase tracking-wider border border-primary">
            {product.categories[0].name}
          </span>
        )}
        <div className="flex mt-4 justify-between flex-wrap gap-3">
          <Text className=" text-lg md:text-xl" data-testid="product-title">
            {product.title}
          </Text>
          <div className="flex items-center gap-x-2">
            {cheapestPrice && <PreviewPrice price={cheapestPrice} netPriceLabel={netPriceLabel} />}
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
