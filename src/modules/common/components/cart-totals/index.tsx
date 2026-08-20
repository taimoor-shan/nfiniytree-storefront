"use client"

import { convertToLocale } from "@lib/util/money"
import { getCartCountryCode } from "@lib/util/country-locale"
import { useTranslation } from "@/lib/i18n"
import React from "react"

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    currency_code: string
    item_subtotal?: number | null
    shipping_subtotal?: number | null
    discount_subtotal?: number | null
    shipping_address?: { country_code?: string | null } | null
  }
  taxRate?: number | null
  countryCode?: string
}

const CartTotals: React.FC<CartTotalsProps> = ({
  totals,
  taxRate,
  countryCode,
}) => {
  const {
    currency_code,
    total,
    tax_total,
    item_subtotal,
    shipping_subtotal,
    discount_subtotal,
  } = totals

  const { t } = useTranslation()

  // Commercial context wins: format cart/order totals per the shipping
  // country that Medusa priced them for, not per the URL country.
  const cc = countryCode ?? getCartCountryCode(totals)

  return (
    <div>
      <div className="flex flex-col gap-y-2 txt-medium text-body ">
        <div className="flex justify-between">
          <span className="flex flex-col gap-1">
            <span>{t("cart.subtotal")}</span>
            <span className="text-muted text-xs">
              {t("cart.excludingShippingAndTaxes")}
            </span>
          </span>
          <span data-testid="cart-subtotal" data-value={item_subtotal || 0}>
            {convertToLocale({
              amount: item_subtotal ?? 0,
              currency_code,
              countryCode: cc,
            })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>{t("cart.shipping")}</span>
          <span data-testid="cart-shipping" data-value={shipping_subtotal || 0}>
            {convertToLocale({
              amount: shipping_subtotal ?? 0,
              currency_code,
              countryCode: cc,
            })}
          </span>
        </div>
        {!!discount_subtotal && (
          <div className="flex items-center justify-between">
            <span>{t("cart.discount")}</span>
            <span
              className="text-primary"
              data-testid="cart-discount"
              data-value={discount_subtotal || 0}
            >
              -{" "}
              {convertToLocale({
                amount: discount_subtotal ?? 0,
                currency_code,
                countryCode: cc,
              })}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="flex gap-x-1 items-center">
            {t("cart.tax")}
            {taxRate != null && (
              <span className="text-muted text-xs">({taxRate}%)</span>
            )}
          </span>
          <span data-testid="cart-taxes" data-value={tax_total || 0}>
            {convertToLocale({
              amount: tax_total ?? 0,
              currency_code,
              countryCode: cc,
            })}
          </span>
        </div>
      </div>
      <div className="h-px w-full border-b border-hairline my-4" />
      <div className="flex items-center justify-between text-ink mb-2 txt-medium ">
        <span>{t("cart.total")}</span>
        <span
          className="txt-xlarge-plus"
          data-testid="cart-total"
          data-value={total || 0}
        >
          {convertToLocale({
            amount: total ?? 0,
            currency_code,
            countryCode: cc,
          })}
        </span>
      </div>
      <div className="h-px w-full border-b border-hairline mt-4" />
    </div>
  )
}

export default CartTotals
