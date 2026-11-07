"use client"

import { clx } from "@medusajs/ui"

import { getProductPrice, hasPriceRange } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import { useTranslation } from "@/lib/i18n"

export default function ProductPrice({
  product,
  variant,
  countryCode,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
  /** URL country — determines price formatting locale. */
  countryCode?: string
}) {
  const { t } = useTranslation()
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
    countryCode,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  // Variants priced differently: until one is picked the page says "From
  // <lowest price>"; picking a variant drops the prefix and shows its own price.
  const showFrom = !variant && hasPriceRange(product)

  // No price is set yet (a piece whose price is still to be agreed): say so,
  // never a skeleton that never resolves and never a zero.
  if (!selectedPrice) {
    return (
      <div className="flex items-center mt-4 mb-2">
        <span
          className="text-lg font-bold text-primary-text"
          data-testid="product-price-on-request"
        >
          {t("product.priceOnRequest")}
        </span>
      </div>
    )
  }

  const isDiscounted =
    selectedPrice.calculated_price_number < selectedPrice.original_price_number

  return (
    <div className="flex gap-2 items-center mt-4 mb-2">
      <div className="flex items-center gap-x-2 text-ink">
        <span
          className={clx("text-lg font-bold text-primary-text whitespace-nowrap", {
            "text-primary-text": isDiscounted,
          })}
        >
          {showFrom && (
            <span data-testid="product-price-from">
              {t("product.from")}{" "}
            </span>
          )}
          <span
            data-testid="product-price"
            data-value={selectedPrice.calculated_price_number}
          >
            {selectedPrice.calculated_price}
          </span>
        </span>
        {isDiscounted && (
          <>
            <p>
              <span className="text-body">{t("product.original")}: </span>
              <span
                className="original-price"
                data-testid="original-product-price"
                data-value={selectedPrice.original_price_number}
              >
                {selectedPrice.original_price}
              </span>
            </p>
            <span className="text-primary-text">
              -{selectedPrice.percentage_diff}%
            </span>
          </>
        )}
      </div>
      <span className="text-xs text-muted-foreground">
        {t("product.netPrice")}
      </span>
    </div>
  )
}
