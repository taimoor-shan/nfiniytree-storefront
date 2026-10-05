import { getPortalClientOrders } from "@lib/data/sales-portal"
import { getLocale } from "@lib/data/locale-actions"
import { translate } from "@lib/i18n"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import OrdersTable from "@modules/sales-portal/components/orders-table"
import Pager from "@modules/sales-portal/components/pager"
import SessionMessage from "@modules/sales-portal/components/session-message"
import { getPortalTranslator } from "@modules/sales-portal/lib/translator"
import { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return {
    title: await translate("salesPortal.orders.title", locale),
    description: await translate("metadata.salesPortalDescription", locale),
  }
}

/** An offset from the URL, or 0 for anything that isn't a whole number. */
const parseOffset = (value?: string | string[]) => {
  const offset = typeof value === "string" ? Number(value) : 0

  return Number.isSafeInteger(offset) && offset > 0 ? offset : 0
}

export default async function SalesPortalClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ countryCode: string; customerId: string }>
  searchParams: Promise<{ offset?: string | string[] }>
}) {
  const { countryCode, customerId } = await params
  const { offset } = await searchParams
  const { t, locale } = await getPortalTranslator()

  const orders = await getPortalClientOrders(customerId, parseOffset(offset))

  if (!orders.ok) {
    return <SessionMessage reason={orders.reason} countryCode={countryCode} t={t} />
  }

  return (
    <div>
      <LocalizedClientLink
        href="/sales-portal"
        className="text-small-regular text-link hover:underline"
      >
        {t("salesPortal.orders.back")}
      </LocalizedClientLink>
      <h2 className="text-xl-semi mt-4 mb-1" data-testid="portal-client-name">
        {orders.data.client_name}
      </h2>
      <p className="text-small-regular text-muted mb-6">
        {t("salesPortal.orders.title")}
      </p>
      <OrdersTable
        orders={orders.data.orders}
        countryCode={countryCode}
        locale={locale}
        t={t}
      />
      <Pager
        href={`/sales-portal/clients/${encodeURIComponent(customerId)}`}
        offset={orders.data.offset}
        limit={orders.data.limit}
        count={orders.data.count}
        t={t}
      />
    </div>
  )
}
