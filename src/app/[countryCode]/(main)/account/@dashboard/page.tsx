import { translate } from "@/lib/i18n"
import { getLocale } from "@lib/data/locale-actions"
import Overview from "@modules/account/components/overview"
import { notFound } from "next/navigation"
import { retrieveCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"

export async function generateMetadata() {
  const locale = await getLocale()

  return {
    title: await translate("metadata.accountTitle", locale),
    description: await translate("metadata.accountDescription", locale),
  }
}

export default async function OverviewTemplate() {
  const customer = await retrieveCustomer().catch(() => null)
  const orders = (await listOrders().catch(() => null)) || null

  if (!customer) {
    notFound()
  }

  return <Overview customer={customer} orders={orders} />
}
