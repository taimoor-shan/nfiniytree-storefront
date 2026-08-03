import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Checkout",
}

export default async function Checkout() {
  const cart = await retrieveCart()

  console.log("[DEBUG Checkout page] cart exists:", !!cart)
  if (cart) {
    console.log("[DEBUG Checkout page] cart.id:", cart.id?.slice(-8),
      "| region_id:", cart.region_id,
      "| region:", cart.region?.id,
      "| shipping_address:", !!cart.shipping_address,
      "| shipping_methods:", cart.shipping_methods?.length,
      "| payment_collection:", !!cart.payment_collection)
  }

  if (!cart) {
    return notFound()
  }

  const customer = await retrieveCustomer()

  return (
    <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] content-container gap-x-40 py-12">
      <PaymentWrapper cart={cart}>
        <CheckoutForm cart={cart} customer={customer} />
      </PaymentWrapper>
      <CheckoutSummary cart={cart} />
    </div>
  )
}
