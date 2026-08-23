import { retrieveCustomer } from "@lib/data/customer"
import { Toaster } from "@medusajs/ui"
import AccountLayout from "@modules/account/templates/account-layout"
import { Metadata } from "next"
import { NOINDEX_METADATA } from "@lib/util/seo"

// Applies to every route under /account — dashboard, orders, addresses, profile
// and the login/register views. Metadata merges down the tree, so declaring it
// once on the layout covers the whole section including future child routes.
export const metadata: Metadata = NOINDEX_METADATA

export default async function AccountPageLayout({
  dashboard,
  login,
  children,
}: {
  dashboard?: React.ReactNode
  login?: React.ReactNode
  children?: React.ReactNode
}) {
  const customer = await retrieveCustomer().catch(() => null)

  return (
    <AccountLayout customer={customer}>
      {customer ? dashboard : (login || children)}
      <Toaster />
    </AccountLayout>
  )
}
