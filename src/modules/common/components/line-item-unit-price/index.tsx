"use client"

import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import { useTranslation } from "@lib/i18n/client"

type LineItemUnitPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  style?: "default" | "tight"
  currencyCode: string
  countryCode?: string
}

const LineItemUnitPrice = ({
  item,
  style = "default",
  currencyCode,
  countryCode,
}: LineItemUnitPriceProps) => {
  const { t } = useTranslation()
  const { subtotal, original_subtotal } = item
  const hasReducedPrice = subtotal < (original_subtotal ?? subtotal)

  const percentage_diff = Math.round(
    (((original_subtotal ?? subtotal) - subtotal) / (original_subtotal ?? subtotal)) * 100
  )

  return (
    <div className="flex flex-col text-muted justify-center h-full">
      {hasReducedPrice && (
        <>
          <p>
            {style === "default" && (
              <span className="text-muted">{t("cart.originalPrice")}</span>
            )}
            <span
              className="line-through"
              data-testid="product-unit-original-price"
            >
              {convertToLocale({
                amount: (original_subtotal ?? subtotal) / item.quantity,
                currency_code: currencyCode,
                countryCode,
              })}
            </span>
          </p>
          {style === "default" && (
            <span className="text-primary">-{percentage_diff}%</span>
          )}
        </>
      )}
      <span
        className={clx("text-base-regular", {
          "text-primary": hasReducedPrice,
        })}
        data-testid="product-unit-price"
      >
        {convertToLocale({
          amount: subtotal / item.quantity,
          currency_code: currencyCode,
          countryCode,
        })}
      </span>
    </div>
  )
}

export default LineItemUnitPrice
