"use client"

import { clx } from "@medusajs/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import { useTranslation } from "@/lib/i18n"

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { t } = useTranslation()
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block w-32 h-9 bg-gray-100 animate-pulse" />
  }

  const isDiscounted =
    selectedPrice.calculated_price_number < selectedPrice.original_price_number

  return (
    <div className="flex items-center gap-x-2 text-ink">
      <span
        className={clx("text-lg", {
          "text-primary": isDiscounted,
        })}
      >
        {!variant && t("product.from") + " "}
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
              className="line-through"
              data-testid="original-product-price"
              data-value={selectedPrice.original_price_number}
            >
              {selectedPrice.original_price}
            </span>
          </p>
          <span className="text-primary">
            -{selectedPrice.percentage_diff}%
          </span>
        </>
      )}
    </div>
  )
}
