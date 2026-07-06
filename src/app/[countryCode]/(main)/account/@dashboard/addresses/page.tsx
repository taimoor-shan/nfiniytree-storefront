import { translate } from "@/lib/i18n"
import { getLocale } from "@lib/data/locale-actions"
import { notFound } from "next/navigation"

import AddressBook from "@modules/account/components/address-book"

import { getRegion } from "@lib/data/regions"
import { retrieveCustomer } from "@lib/data/customer"

export async function generateMetadata() {
  const locale = await getLocale()

  return {
    title: await translate("metadata.addressesTitle", locale),
    description: await translate("metadata.addressesDescription", locale),
  }
}

export default async function Addresses(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const { countryCode } = params
  const locale = await getLocale()
  const customer = await retrieveCustomer()
  const region = await getRegion(countryCode)

  if (!customer || !region) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="addresses-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl-semi">{await translate("addresses.shippingAddresses", locale)}</h1>
        <p className="text-base-regular">
          {await translate("account.addressesDescription", locale)}
        </p>
      </div>
      <AddressBook customer={customer} region={region} />
    </div>
  )
}
