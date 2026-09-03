import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { getCartId } from "@lib/data/cookies"
import { retrieveCustomer } from "@lib/data/customer"
import { listRegions } from "@lib/data/regions"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { StoreCartShippingOption } from "@medusajs/types"
import CountryPopup from "@modules/common/components/country-popup"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import FreeShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"

// `metadataBase` used to be re-declared here, duplicating the root layout for no
// effect — metadata merges down the tree, so the root value already applied to
// every page in this group.

export default async function PageLayout(props: { children: React.ReactNode }) {
  // These four ran sequentially, so every page in the group paid the sum of
  // four Medusa roundtrips before rendering anything — measured at ~110ms of
  // added TTFB once a cart cookie exists. They are independent: `listCartOptions`
  // reads the cart id from the cookie rather than from the `cart` object, so it
  // only needs the cheap cookie check to know whether it is worth issuing.
  const cartId = await getCartId()

  const [customer, cart, regions, cartOptions, locales, currentLocale] =
    await Promise.all([
      retrieveCustomer(),
      retrieveCart(),
      listRegions(),
      cartId
        ? listCartOptions()
        : Promise.resolve(null as { shipping_options: StoreCartShippingOption[] } | null),
      listLocales(),
      getLocale(),
    ])

  const shippingOptions: StoreCartShippingOption[] =
    cart && cartOptions ? cartOptions.shipping_options : []

  return (
    <>
      <CountryPopup regions={regions ?? []} locales={locales} currentLocale={currentLocale} />
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
      {/* The page content is the only thing inside <main>; the nav, banners and
          footer stay outside it so each landmark is discoverable on its own.
          The id is the skip link's target. */}
      <main id="main-content">{props.children}</main>
      <Footer />
    </>
  )
}
