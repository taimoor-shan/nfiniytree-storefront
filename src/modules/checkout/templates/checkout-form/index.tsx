import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"
import Shipping from "@modules/checkout/components/shipping"

export default async function CheckoutForm({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  if (!cart) {
    return null
  }

  const shippingMethods = await listCartShippingMethods(cart.id)
  const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")

  console.log("[DEBUG CheckoutForm] cart.region?.id:", cart.region?.id)
  console.log("[DEBUG CheckoutForm] shippingMethods:", shippingMethods?.length, "| isArray:", Array.isArray(shippingMethods))
  console.log("[DEBUG CheckoutForm] paymentMethods TYPE:", typeof paymentMethods, "| isArray:", Array.isArray(paymentMethods))
  console.log("[DEBUG CheckoutForm] paymentMethods RAW:", JSON.stringify(paymentMethods)?.slice(0, 200))

  if (!shippingMethods || !paymentMethods) {
    console.error("[DEBUG CheckoutForm] BAILING — shippingMethods:", !!shippingMethods, "paymentMethods:", !!paymentMethods)
    return null
  }

  return (
    <div className="w-full grid grid-cols-1 gap-y-8">
      <Addresses cart={cart} customer={customer} />

      <Shipping cart={cart} availableShippingMethods={shippingMethods} />

      <Payment cart={cart} availablePaymentMethods={paymentMethods} />

      <Review cart={cart} />
    </div>
  )
}
