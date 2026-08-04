"use client"

import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { useTranslation } from "@/lib/i18n"

type OrderSummaryProps = {
  order: HttpTypes.StoreOrder
}

const OrderSummary = ({ order }: OrderSummaryProps) => {
  const { t } = useTranslation()
  const getAmount = (amount?: number | null) => {
    if (!amount) {
      return
    }

    return convertToLocale({
      amount,
      currency_code: order.currency_code,
    })
  }

  return (
    <div>
      <h2 className="text-base-semi">{t("order.summary")}</h2>
      <div className="text-small-regular text-ink my-2">
        <div className="flex items-center justify-between text-base-regular text-ink mb-2">
          <span>{t("cart.subtotal")}</span>
          <span>{getAmount((order as any).item_subtotal ?? order.subtotal)}</span>
        </div>
        <div className="flex flex-col gap-y-1">
          {order.discount_total > 0 && (
            <div className="flex items-center justify-between">
              <span>{t("order.discount")}</span>
              <span>- {getAmount(order.discount_total)}</span>
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
