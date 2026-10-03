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
  countryCode,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
  /** Above the fold — load the thumbnail immediately instead of lazily. */
  eager?: boolean
  /** URL country — determines price formatting locale. */
  countryCode: string
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
    countryCode,
  })

  const locale = await getLocale()
  const netPriceLabel = await translate("product.netPrice", locale)
  const preOrderOfferLabel = await translate("product.preOrderOffer", locale)

  const isDiscounted =
    !!cheapestPrice &&
    cheapestPrice.calculated_price_number < cheapestPrice.original_price_number

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group">
      <div data-testid="product-wrapper" className="relative">
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          size="full"
          isFeatured={isFeatured}
          eager={eager}
          // Named, not decorative: every product image carries real alt text for
          // image search and SEO audits, not just the PDP gallery. The card is a
          // single link, so a screen reader reads the product name here and
          // again in the title below — a repeat we accept on purpose.
          alt={product.title}
        />
        {product.subtitle && (
          <span className="absolute top-3 left-3 z-10 text-xs px-2.5 py-1 rounded-full bg-primary-strong text-white uppercase tracking-wider border border-primary">
            {product.subtitle}
          </span>
        )}
        <div className="flex mt-4 justify-between flex-wrap gap-3">
          <div className="something">
            <Text className=" text-[20px] md:text-xl" data-testid="product-title">
              {product.title}
            </Text>
            {isDiscounted && (
              <Text className="text-xs uppercase tracking-wider text-primary-text mt-2">
                {preOrderOfferLabel}
              </Text>
            )}
          </div>

          <div className="flex items-center gap-x-2">
            {cheapestPrice && (
              <PreviewPrice
                price={cheapestPrice}
                netPriceLabel={netPriceLabel}
              />
            )}
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
