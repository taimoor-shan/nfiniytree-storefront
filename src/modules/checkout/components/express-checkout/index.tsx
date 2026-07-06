"use client"

import { placeOrder } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { PaymentRequestButtonElement, useStripe } from "@stripe/react-stripe-js"
import { PaymentRequest } from "@stripe/stripe-js"
import { useTranslation } from "@/lib/i18n"
import React, { useEffect, useState } from "react"
import ErrorMessage from "../error-message"

type ExpressCheckoutProps = {
  cart: HttpTypes.StoreCart
}

const ExpressCheckout: React.FC<ExpressCheckoutProps> = ({ cart }) => {
  const { t } = useTranslation()
  const stripe = useStripe()
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!stripe || !cart) {
      return
    }

    const session = cart.payment_collection?.payment_sessions?.find(
      (s) => s.status === "pending" && s.provider_id.includes("stripe")
    )

    if (!session || !session.data?.client_secret) {
      return
    }

    const pr = stripe.paymentRequest({
      country: cart.shipping_address?.country_code?.toUpperCase() || "US",
      currency: cart.currency_code.toLowerCase(),
      total: {
        label: t("cart.total"),
        amount: cart.total || 0,
      },
      requestPayerName: true,
      requestPayerEmail: true,
      requestPayerPhone: true,
      requestShipping: false, // We've already collected shipping at this stage
    })

    // Check the availability of the Payment Request API
    pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequest(pr)
      }
    })

    pr.on("paymentmethod", async (ev) => {
      // Confirm the PaymentIntent without handling next actions
      const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(
        session.data.client_secret as string,
        { payment_method: ev.paymentMethod.id },
        { handleActions: false }
      )

      if (confirmError) {
        // Report to the browser that the payment failed, prompting it to
        // re-show the payment interface, or show an error message and close
        // the payment interface.
        ev.complete("fail")
        setErrorMessage(confirmError.message || t("checkout.paymentFailed"))
      } else {
        // Report to the browser that the confirmation was successful, prompting
        // it to close the browser payment method collection interface.
        ev.complete("success")

        // Let Stripe.js handle the rest of the payment flow
        if (paymentIntent.status === "requires_action") {
          const { error } = await stripe.confirmCardPayment(session.data.client_secret as string)
          if (error) {
            setErrorMessage(error.message || t("checkout.paymentFailed"))
            return
          }
        }

        // Place the order via Medusa
        await placeOrder().catch((err) => {
          setErrorMessage(err.message)
        })
      }
    })
  }, [stripe, cart])

  if (!paymentRequest) {
    return null
  }

  return (
    <div className="mb-6">
      <div className="mb-4">
        <PaymentRequestButtonElement 
          options={{ paymentRequest }} 
          className="w-full"
        />
      </div>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-hairline"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-canvas px-2 text-muted">{t("checkout.orPayWithCard")}</span>
        </div>
      </div>
      <ErrorMessage error={errorMessage} data-testid="express-checkout-error-message" />
    </div>
  )
}

export default ExpressCheckout
