"use client"

import { Heading, Text, clx } from "@medusajs/ui"
import { useState } from "react"

import PaymentButton from "../payment-button"
import { useSearchParams } from "next/navigation"
import { CardBrandLogos } from "@modules/checkout/components/card-brand-logos"
import CheckboxWithLabel from "@modules/common/components/checkbox"
import { useTranslation } from "@/lib/i18n"

const hasConfiguredItems = (cart: any): boolean => {
  return (
    cart?.items?.some(
      (item: any) => (item.variant?.options?.length || 0) > 1
    ) ?? false
  )
}

const Review = ({ cart }: { cart: any }) => {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const [acknowledged, setAcknowledged] = useState(false)

  const isOpen = searchParams.get("step") === "review"

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const previousStepsCompleted =
    cart.shipping_address &&
    cart.shipping_methods.length > 0 &&
    (cart.payment_collection || paidByGiftcard)

  const showWithdrawalCheckbox = hasConfiguredItems(cart)
  const canPlaceOrder = !showWithdrawalCheckbox || acknowledged

  return (
    <div className="bg-canvas">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none": !isOpen,
            }
          )}
        >
          {t("checkout.review")}
        </Heading>
      </div>
      {isOpen && previousStepsCompleted && (
        <>
          <div className="flex items-start gap-x-1 w-full mb-6">
            <div className="w-full">
              <Text className="txt-medium-plus text-ink mb-1">
                {t("checkout.byClicking")}{" "}
                <a className="text-link" href="/policies/terms">
                  {t("footer.termsAndConditions")}
                </a>
                ,{" "}
                <a className="text-link" href="/policies/returns">
                  {t("footer.returnsRefunds")}
                </a>{" "}
                {t("checkout.andAcknowledge")}{" "}
                <a className="text-link" href="/policies/privacy">
                  {t("footer.privacyPolicy")}
                </a>
                .
              </Text>
            </div>
          </div>

          {showWithdrawalCheckbox && (
            <div className="mb-6">
              <CheckboxWithLabel
                checked={acknowledged}
                onChange={() => setAcknowledged(!acknowledged)}
                label={
                  "I acknowledge that my order includes individually assembled/configured artificial tree compositions. I understand that for these configured products, the 14-day statutory right of withdrawal does not apply under Section 29(1)(c) of Hungarian Government Decree 45/2014 (II. 26.)."
                }
                name="withdrawal-acknowledgement"
                data-testid="withdrawal-acknowledgement-checkbox"
              />
            </div>
          )}

          <div
            className={clx("flex flex-col gap-y-4", {
              "opacity-50 pointer-events-none": !canPlaceOrder,
            })}
          >
            <PaymentButton cart={cart} data-testid="submit-order-button" />
            {/* <div className="flex flex-col items-center justify-center gap-y-3 mt-2">
              <CardBrandLogos showStripe />
            </div> */}
          </div>
        </>
      )}
    </div>
  )
}

export default Review
