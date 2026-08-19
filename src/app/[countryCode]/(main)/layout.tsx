import { Metadata } from "next"

import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { getCartId } from "@lib/data/cookies"
import { retrieveCustomer } from "@lib/data/customer"
import { listRegions } from "@lib/data/regions"
import { getBaseURL } from "@lib/util/env"
import { StoreCartShippingOption } from "@medusajs/types"
import CountryPopup from "@modules/common/components/country-popup"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import FreeShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  // These four ran sequentially, so every page in the group paid the sum of
  // four Medusa roundtrips before rendering anything — measured at ~110ms of
  // added TTFB once a cart cookie exists. They are independent: `listCartOptions`
  // reads the cart id from the cookie rather than from the `cart` object, so it
  // only needs the cheap cookie check to know whether it is worth issuing.
  const cartId = await getCartId()

  const [customer, cart, regions, cartOptions] = await Promise.all([
    retrieveCustomer(),
    retrieveCart(),
    listRegions(),
    cartId
      ? listCartOptions()
      : Promise.resolve(null as { shipping_options: StoreCartShippingOption[] } | null),
  ])

  const shippingOptions: StoreCartShippingOption[] =
    cart && cartOptions ? cartOptions.shipping_options : []

  return (
    <>
      <CountryPopup regions={regions ?? []} />
      <Nav />
      {customer && cart && (
        <CartMismatchBanner customer={customer} cart={cart} />
      )}

      {cart && (
        <FreeShippingPriceNudge
          variant="popup"
          cart={cart}
          shippingOptions={shippingOptions}
        />
      )}
      {props.children}
      <Footer />
    </>
  )
}
