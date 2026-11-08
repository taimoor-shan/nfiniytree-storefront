"use client"

import { convertToLocale } from "@lib/util/money"
import { getOrderCountryCode } from "@lib/util/country-locale"
import {
  discountLabel,
  getDiscountCodes,
  getNetDiscount,
} from "@lib/util/discount"
import { HttpTypes } from "@medusajs/types"
import { useTranslation } from "@/lib/i18n"

type OrderSummaryProps = {
  order: HttpTypes.StoreOrder
}

const OrderSummary = ({ order }: OrderSummaryProps) => {
  const { t } = useTranslation()
  // Historical orders format per their own shipping country, not the
  // customer's current country.
  const cc = getOrderCountryCode(order)
  // The discount without VAT: the rows are net and the VAT has its own row, so
  // only this figure makes them add up to the total.
  const discount = getNetDiscount(order)
  const getAmount = (amount?: number | null) => {
    if (!amount) {
      return
    }

    return convertToLocale({
      amount,
      currency_code: order.currency_code,
      countryCode: cc,
    })
  }

  return (
    <div>
      <h2 className="text-base-semi">{t("order.summary")}</h2>
      <div className="text-small-regular text-ink my-2">
        <div className="flex flex-wrap items-center justify-between text-base-regular text-ink mb-2">
          <span>{t("cart.subtotal")}</span>
          <span>{getAmount((order as any).item_subtotal ?? order.subtotal)}</span>
        </div>
        <div className="flex flex-col gap-y-1">
          {discount > 0 && (
            <div className="flex items-center justify-between gap-x-4">
              <span className="min-w-0 break-words">
                {discountLabel(t("order.discount"), getDiscountCodes(order))}
              </span>
              <span className="shrink-0 whitespace-nowrap">
                - {getAmount(discount)}
              </span>
            </div>
          )}
          {order.gift_card_total > 0 && (
            <div className="flex items-center justify-between">
              <span>{t("order.discount")}</span>
              <span>- {getAmount(order.gift_card_total)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span>{t("cart.shipping")}</span>
            <span>{getAmount((order as any).shipping_subtotal ?? order.shipping_total)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>{t("order.taxes")}</span>
            <span>{getAmount(order.tax_total)}</span>
          </div>
        </div>
        <div className="h-px w-full border-b border-hairline border-dashed my-4" />
        <div className="flex items-center justify-between text-base-regular text-ink mb-2">
          <span>{t("cart.total")}</span>
          <span>{getAmount(order.total)}</span>
        </div>
      </div>
    </div>
  )
}

export default OrderSummary
