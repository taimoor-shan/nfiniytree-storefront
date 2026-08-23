import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import CartTemplate from "@modules/cart/templates"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { translate } from "@lib/i18n"
import { getLocale } from "@lib/data/locale-actions"
import { NOINDEX_METADATA } from "@lib/util/seo"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return {
    title: await translate("metadata.cartTitle", locale),
    description: await translate("metadata.cartDescription", locale),
    // Per-visitor content with nothing to rank for. `follow` stays on so the
    // links out of the cart still pass crawl signal.
    ...NOINDEX_METADATA,
  }
}

export default async function Cart(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params

  const cart = await retrieveCart().catch((error) => {
    console.error(error)
    return notFound()
  })

  const customer = await retrieveCustomer()

  return <CartTemplate cart={cart} customer={customer} countryCode={countryCode} />
}

