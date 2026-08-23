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

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group">
      <div data-testid="product-wrapper" className="relative">
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          size="full"
          isFeatured={isFeatured}
          eager={eager}
          // Decorative here, deliberately. The image, the category badge, the
          // product name and the price all sit inside this one link, so the
          // link already announces the product by name — repeating it in `alt`
          // would make every card in the grid say the product name twice. The
          // descriptive alt for image search lives on the PDP gallery, which is
          // the canonical page for the product's images.
          alt=""
        />
        {product.categories && product.categories.length > 0 && (
          // 12px white text on coral. `bg-primary` gives 3.28:1 there, below the
          // 4.5:1 AA floor, so the fill uses `primary-strong` (4.53:1). The
          // border stays `primary` — it is non-text and only needs 3:1.
          <span className="absolute top-3 left-3 z-10 text-xs px-2.5 py-1 rounded-full bg-primary-strong text-white uppercase tracking-wider border border-primary">
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
