import { purchaseParams } from "@lib/analytics/ga4"
import { retrieveOrder } from "@lib/data/orders"
import GaEvent from "@modules/common/components/ga-event"
import OrderCompletedTemplate from "@modules/order/templates/order-completed-template"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { translate } from "@lib/i18n"
import { getLocale } from "@lib/data/locale-actions"
import { NOINDEX_METADATA } from "@lib/util/seo"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return {
    title: await translate("metadata.orderConfirmedTitle", locale),
    description: await translate("metadata.orderConfirmedDescription", locale),
    // Order pages contain a customer's name, address and purchase history.
    // They must never appear in a search index.
    ...NOINDEX_METADATA,
  }
}

export default async function OrderConfirmedPage(props: Props) {
  const params = await props.params
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    return notFound()
  }

  return (
    <>
      {/* Once per order in this browser, so revisiting the page is not a second sale. */}
      <GaEvent
        name="purchase"
        params={purchaseParams(order)}
        once={{ key: `purchase:${order.id}`, per: "browser" }}
      />
      <OrderCompletedTemplate order={order} />
    </>
  )
}
