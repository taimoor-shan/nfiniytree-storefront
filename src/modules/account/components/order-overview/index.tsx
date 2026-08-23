"use client"

import { useTranslation } from "@/lib/i18n"
import { Button } from "@medusajs/ui"

import OrderCard from "../order-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

const OrderOverview = ({ orders }: { orders: HttpTypes.StoreOrder[] }) => {
  const { t } = useTranslation()

  if (orders?.length) {
    return (
      <div className="flex flex-col gap-y-8 w-full">
        {orders.map((o) => (
          <div
            key={o.id}
            className="border-b border-hairline pb-6 last:pb-0 last:border-none"
          >
            <OrderCard order={o} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className="w-full flex flex-col items-center gap-y-4"
      data-testid="no-orders-container"
    >
      <h2 className="text-large-semi">{t("account.nothingToSee")}</h2>
      <p className="text-base-regular">
        {t("account.noOrdersYet")}
      </p>
      <div className="mt-4">
        {/* `asChild` — see the hero CTA: a <Button> nested inside the link is
            invalid HTML and produces two overlapping targets. */}
        <Button data-testid="continue-shopping-button" asChild>
          <LocalizedClientLink href="/">
            {t("cart.continueShopping")}
          </LocalizedClientLink>
        </Button>
      </div>
    </div>
  )
}

export default OrderOverview
