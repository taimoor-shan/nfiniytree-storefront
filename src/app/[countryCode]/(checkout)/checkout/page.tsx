import { beginCheckoutParams } from "@lib/analytics/ga4"
import { retrieveCartForCheckout } from "@lib/data/cart"
import { getDeliveryCountry } from "@lib/data/cookies"
import { retrieveCustomer } from "@lib/data/customer"
import { listRegions } from "@lib/data/regions"
import { checkoutStartCountry } from "@lib/util/delivery-on-request"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import GaEvent from "@modules/common/components/ga-event"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { NOINDEX_METADATA } from "@lib/util/seo"

export const metadata: Metadata = {
  title: "Checkout",
  ...NOINDEX_METADATA,
}

export default async function Checkout() {
  const cart = await retrieveCartForCheckout()

  if (!cart) {
    return notFound()
  }

  const [customer, regions, chosenCountry] = await Promise.all([
    retrieveCustomer(),
    listRegions(),
    getDeliveryCountry(),
  ])

  // A country on request chosen in the popup or the header: the address step
  // opens as a quote request for it, until the cart holds a typed address
  const startCountry = checkoutStartCountry({
    chosen: chosenCountry,
    cartAddress: cart.shipping_address,
    regions,
  })

  return (
    <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] content-container gap-x-20 xl:gap-x-40 py-12">
      <PaymentWrapper cart={cart}>
        <CheckoutForm
          cart={cart}
          customer={customer}
          regions={regions ?? []}
          startCountry={startCountry}
        />
      </PaymentWrapper>
      <CheckoutSummary cart={cart} />
      {/* Once per cart and session: the steps and a payment redirect reload this page. */}
      <GaEvent
        name="begin_checkout"
        params={beginCheckoutParams(cart)}
        once={{ key: `begin_checkout:${cart.id}`, per: "session" }}
      />
    </div>
  )
}
