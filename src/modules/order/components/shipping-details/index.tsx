"use client"

import { convertToLocale } from "@lib/util/money"
import { getOrderCountryCode } from "@lib/util/country-locale"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"

import Divider from "@modules/common/components/divider"
import { useTranslation } from "@/lib/i18n"

type ShippingDetailsProps = {
  order: HttpTypes.StoreOrder
  isGuest?: boolean
}

const ShippingDetails = ({ order, isGuest }: ShippingDetailsProps) => {
  const { t } = useTranslation()
  const cc = getOrderCountryCode(order)
  return (
    <div>
      <Heading level="h2" className="flex flex-row text-3xl-regular my-6">
        {t("checkout.delivery")}
      </Heading>
      <div className="flex items-start gap-x-8">
        <div
          className="flex flex-col w-1/3"
          data-testid="shipping-address-summary"
        >
          <Text className="txt-medium-plus text-ink mb-1">
            {t("order.shippingAddress")}
          </Text>
          {isGuest ? (
            <>
              <Text className="txt-medium text-body">
                {order.shipping_address?.city}
              </Text>
              <Text className="txt-medium text-body">
                {order.shipping_address?.country_code?.toUpperCase()}
              </Text>
            </>
          ) : (
            <>
              <Text className="txt-medium text-body">
                {order.shipping_address?.first_name}{" "}
                {order.shipping_address?.last_name}
              </Text>
              <Text className="txt-medium text-body">
                {order.shipping_address?.address_1}{" "}
                {order.shipping_address?.address_2}
              </Text>
              <Text className="txt-medium text-body">
                {order.shipping_address?.postal_code},{" "}
                {order.shipping_address?.city}
              </Text>
              <Text className="txt-medium text-body">
                {order.shipping_address?.country_code?.toUpperCase()}
              </Text>
              {order.shipping_address?.company && (
                <Text className="txt-medium text-body">
                  {order.shipping_address.company}
                </Text>
              )}
              {(order.shipping_address?.metadata as any)?.vat_number && (
                <Text className="txt-medium text-body">
                  {t("addresses.vatNumber")}:{" "}
                  {(order.shipping_address?.metadata as any).vat_number}
                </Text>
              )}
            </>
          )}
        </div>

        <div
          className="flex flex-col w-1/3 "
          data-testid="shipping-contact-summary"
        >
          <Text className="txt-medium-plus text-ink mb-1">{t("order.contact")}</Text>
          {!isGuest && (
            <Text className="txt-medium text-body">
              {order.shipping_address?.phone}
            </Text>
          )}
          <Text className="txt-medium text-body">{order.email}</Text>
        </div>

        <div
          className="flex flex-col w-1/3"
          data-testid="shipping-method-summary"
        >
          <Text className="txt-medium-plus text-ink mb-1">{t("order.method")}</Text>
          <Text className="txt-medium text-body">
            {(order as any).shipping_methods[0]?.name} (
            {convertToLocale({
              amount: (order.shipping_methods?.[0] as any)?.subtotal
                ?? order.shipping_methods?.[0].total
                ?? 0,
              currency_code: order.currency_code,
              countryCode: cc,
            })}
            )
          </Text>
        </div>
      </div>
      <Divider className="mt-8" />
    </div>
  )
}

export default ShippingDetails
