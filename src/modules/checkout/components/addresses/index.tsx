"use client"

import { useTranslation } from "@/lib/i18n"
import { setAddresses } from "@lib/data/cart"
import {
  requestDeliveryQuote,
  type DeliveryRequestState,
} from "@lib/data/delivery-request"
import compareAddresses from "@lib/util/compare-addresses"
import { getAddressCountryName } from "@lib/util/country-name"
import { CheckCircleSolid } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text, useToggleState } from "@medusajs/ui"
import Divider from "@modules/common/components/divider"
import Textarea from "@modules/common/components/textarea"
import Spinner from "@modules/common/icons/spinner"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useActionState, useState } from "react"
import BillingAddress from "../billing_address"
import CheckoutSignIn from "../checkout-sign-in"
import ErrorMessage from "../error-message"
import ShippingAddress from "../shipping-address"
import { SubmitButton } from "../submit-button"

const Addresses = ({
  cart,
  customer,
  regions,
  startCountry = null,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  regions: HttpTypes.StoreRegion[]
  /**
   * The country on request the visitor chose in the popup or the header
   * (`checkoutStartCountry`): the step opens as a quote request for it.
   */
  startCountry?: string | null
}) => {
  const { t, locale } = useTranslation()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "address"

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )

  const handleEdit = () => {
    router.push(pathname + "?step=address")
  }

  const [message, formAction] = useActionState(setAddresses, null)

  // A "Delivery on request" country (a European country no region covers):
  // the form sends a delivery quote request instead of going on to delivery
  // and payment. See `@lib/util/delivery-on-request`.
  const [onRequestCountry, setOnRequestCountry] = useState<string | null>(
    startCountry
  )
  // The sign-in box above the form, opened by its own button or by the
  // "this email has an account" note under the email field
  const [signIn, setSignIn] = useState<{ open: boolean; email: string }>({
    open: false,
    email: "",
  })
  const [requestState, requestAction] = useActionState<
    DeliveryRequestState,
    FormData
  >(requestDeliveryQuote, { status: "idle" })
  // The confirmation is shown until the customer chooses to change the address.
  const [dismissedRequest, setDismissedRequest] =
    useState<DeliveryRequestState | null>(null)
  const requestSent =
    requestState.status === "sent" && requestState !== dismissedRequest

  return (
    <div className="bg-canvas">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className="flex flex-row text-3xl-regular gap-x-2 items-baseline"
        >
          {t("checkout.shippingAddress")}
          {!isOpen && <CheckCircleSolid />}
        </Heading>
        {!isOpen && cart?.shipping_address && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-link"
              aria-label={`${t("account.edit")} — ${t(
                "checkout.shippingAddress"
              )}`}
              data-testid="edit-address-button"
            >
              {t("account.edit")}
            </button>
          </Text>
        )}
      </div>
      {isOpen && requestSent && requestState.status === "sent" && (
        <div
          className="mb-8 flex flex-col gap-y-3 rounded-lg border border-hairline bg-surface-card p-6"
          role="status"
          data-testid="delivery-request-sent"
        >
          <Heading level="h3" className="text-xl-semi">
            {t("checkout.deliveryRequest.sentTitle")}
          </Heading>
          <Text className="txt-medium text-body">
            {/* By email when they gave one, else by phone */}
            {(requestState.email
              ? t("checkout.deliveryRequest.sent")
              : t("checkout.deliveryRequest.sentPhone")
            )
              .replace(
                "{country}",
                getAddressCountryName(requestState.country, locale)
              )
              .replace("{email}", requestState.email)
              .replace("{phone}", requestState.phone)}
          </Text>
          <Text>
            <button
              type="button"
              className="text-link"
              onClick={() => setDismissedRequest(requestState)}
              data-testid="delivery-request-edit"
            >
              {t("checkout.deliveryRequest.edit")}
            </button>
          </Text>
        </div>
      )}
      {isOpen && !customer && !requestSent && (
        // Apart from the address form and above it (a form can't hold another)
        <CheckoutSignIn
          open={signIn.open}
          email={signIn.email}
          onOpenChange={(open) => setSignIn((current) => ({ ...current, open }))}
        />
      )}
      {isOpen ? (
        // Hidden, not unmounted, while the confirmation shows, so the address
        // the customer typed is still there when they change it.
        <form
          action={onRequestCountry ? requestAction : formAction}
          className={requestSent ? "hidden" : undefined}
        >
          <div className="pb-8">
            <ShippingAddress
              customer={customer}
              checked={sameAsBilling}
              onChange={toggleSameAsBilling}
              cart={cart}
              regions={regions}
              deliveryOnRequest={!!onRequestCountry}
              onDeliveryOnRequestChange={setOnRequestCountry}
              startCountry={startCountry}
              onSignInRequest={(email) => {
                setSignIn({ open: true, email })
                window.scrollTo({ top: 0, behavior: "smooth" })
              }}
            />

            {onRequestCountry ? (
              // The "on request" note sits under the country, at the top
              <div
                className="mt-6 flex flex-col gap-y-4"
                data-testid="delivery-request"
              >
                <Textarea
                  label={t("checkout.deliveryRequest.message")}
                  name="delivery_request_message"
                  placeholder={t("checkout.deliveryRequest.messagePlaceholder")}
                  maxLength={2000}
                  rows={3}
                  data-testid="delivery-request-message"
                />
                <SubmitButton data-testid="submit-delivery-request-button">
                  {t("checkout.deliveryRequest.submit")}
                </SubmitButton>
                <ErrorMessage
                  error={
                    requestState.status === "error"
                      ? requestState.message
                      : null
                  }
                  data-testid="delivery-request-error-message"
                />
              </div>
            ) : (
              <>
                {!sameAsBilling && (
                  <div>
                    <Heading
                      level="h2"
                      className="text-3xl-regular gap-x-4 pb-6 pt-8"
                    >
                      {t("checkout.billingAddress")}
                    </Heading>

                    <BillingAddress
                      cart={cart}
                      customer={customer}
                      regions={regions}
                    />
                  </div>
                )}
                <SubmitButton
                  className="mt-6"
                  data-testid="submit-address-button"
                >
                  {t("checkout.continueToDelivery")}
                </SubmitButton>
                <ErrorMessage
                  error={message}
                  data-testid="address-error-message"
                />
              </>
            )}
          </div>
        </form>
      ) : (
        <div>
          <div className="text-small-regular">
            {cart && cart.shipping_address ? (
              <div className="flex items-start gap-x-8">
                <div className="flex items-start flex-wrap gap-2 w-full">
                  <div
                    className="flex flex-col"
                    data-testid="shipping-address-summary"
                  >
                    <Text className="txt-medium-plus text-primary mb-1">
                      {t("checkout.shippingAddress")}
                    </Text>
                    <Text className="txt-medium text-body">
                      {cart.shipping_address.first_name}{" "}
                      {cart.shipping_address.last_name}
                    </Text>
                    <Text className="txt-medium text-body">
                      {cart.shipping_address.address_1}{" "}
                      {cart.shipping_address.address_2}
                    </Text>
                    <Text className="txt-medium text-body">
                      {cart.shipping_address.postal_code},{" "}
                      {cart.shipping_address.city}
                    </Text>
                    <Text className="txt-medium text-body">
                      {getAddressCountryName(
                        cart.shipping_address.country_code,
                        locale
                      )}
                    </Text>
                    {cart.shipping_address.company && (
                      <Text className="txt-medium text-body">
                        {cart.shipping_address.company}
                      </Text>
                    )}
                    {(cart.shipping_address?.metadata as any)?.vat_number && (
                      <Text className="txt-medium text-body">
                        {t("addresses.vatNumber")}:{" "}
                        {(cart.shipping_address?.metadata as any).vat_number}
                      </Text>
                    )}
                  </div>

                  <div
                    className="flex flex-col"
                    data-testid="shipping-contact-summary"
                  >
                    <Text className="txt-medium-plus text-primary mb-1">
                      {t("checkout.contact")}
                    </Text>
                    <Text className="txt-medium text-body">
                      {cart.shipping_address.phone}
                    </Text>
                    <Text className="txt-medium text-body">{cart.email}</Text>
                  </div>

                  <div
                    className="flex flex-col"
                    data-testid="billing-address-summary"
                  >
                    <Text className="txt-medium-plus text-primary mb-1">
                      {t("checkout.billingAddress")}
                    </Text>

                    {sameAsBilling ? (
                      <Text className="txt-medium text-body">
                        {t("checkout.billingSameAsDelivery")}
                      </Text>
                    ) : (
                      <>
                        <Text className="txt-medium text-body">
                          {cart.billing_address?.first_name}{" "}
                          {cart.billing_address?.last_name}
                        </Text>
                        <Text className="txt-medium text-body">
                          {cart.billing_address?.address_1}{" "}
                          {cart.billing_address?.address_2}
                        </Text>
                        <Text className="txt-medium text-body">
                          {cart.billing_address?.postal_code},{" "}
                          {cart.billing_address?.city}
                        </Text>
                        <Text className="txt-medium text-body">
                          {getAddressCountryName(
                            cart.billing_address?.country_code,
                            locale
                          )}
                        </Text>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <Spinner />
              </div>
            )}
          </div>
        </div>
      )}
      <Divider className="mt-8" />
    </div>
  )
}

export default Addresses
