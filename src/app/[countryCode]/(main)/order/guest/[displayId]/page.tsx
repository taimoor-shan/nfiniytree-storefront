/**
 * Public guest order details page — accessible via the "View Order" link
 * in confirmation emails. Authenticated by a one-time access token stored
 * in the order's metadata, so the link works from any browser.
 */

import { HttpTypes } from "@medusajs/types"
import OrderDetailsTemplate from "@modules/order/templates/order-details-template"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { translate } from "@lib/i18n"
import { getLocale } from "@lib/data/locale-actions"
import { NOINDEX_METADATA } from "@lib/util/seo"

type Props = {
  params: Promise<{ countryCode: string; displayId: string }>
  searchParams: Promise<{ token?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return {
    title: await translate("metadata.orderDetailsTitle", locale),
    description: await translate("metadata.viewOrderDetailsDescription", locale),
    // Token-authenticated but publicly reachable, and it renders the customer's
    // name, delivery address and line items. `noindex` keeps a leaked link out
    // of the index even if the token ends up in a referrer or a shared URL.
    ...NOINDEX_METADATA,
  }
}

async function fetchGuestOrder(displayId: string, token: string) {
  const backendUrl =
    process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

  const res = await fetch(
    `${backendUrl}/store/orders/guest/${displayId}?token=${encodeURIComponent(
      token
    )}&fields=*shipping_address,*shipping_methods`,
    { cache: "no-store" }
  )

  if (!res.ok) return null

  const data = await res.json()
  return data.order as HttpTypes.StoreOrder
}

export default async function GuestOrderPage(props: Props) {
  const params = await props.params
  const searchParams = await props.searchParams
  const token = searchParams.token

  if (!token) {
    return notFound()
  }

  const order = await fetchGuestOrder(params.displayId, token).catch(
    () => null
  )

  if (!order) {
    return notFound()
  }

  return (
    <div className="py-6 min-h-[calc(100vh-64px)]">
      <div className="content-container flex flex-col justify-center items-center gap-y-10 max-w-4xl h-full w-full">
        <OrderDetailsTemplate
          order={order}
          showBackLink={false}
          isGuest={true}
        />
      </div>
    </div>
  )
}
