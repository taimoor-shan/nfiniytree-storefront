import { translate } from "@/lib/i18n"
import { getLocale } from "@lib/data/locale-actions"

import OrderOverview from "@modules/account/components/order-overview"
import { notFound } from "next/navigation"
import { listOrders } from "@lib/data/orders"
import Divider from "@modules/common/components/divider"
import TransferRequestForm from "@modules/account/components/transfer-request-form"

export async function generateMetadata() {
  const locale = await getLocale()

  return {
    title: await translate("metadata.ordersTitle", locale),
    description: await translate("metadata.ordersDescription", locale),
  }
}

export default async function Orders() {
  const locale = await getLocale()
  const orders = await listOrders()

  if (!orders) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="orders-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl-semi">{await translate("account.orders", locale)}</h1>
        <p className="text-base-regular">
          {await translate("account.ordersDescription", locale)}
        </p>
      </div>
      <div>
        <OrderOverview orders={orders} />
        <Divider className="my-16" />
        <TransferRequestForm />
      </div>
    </div>
  )
}
