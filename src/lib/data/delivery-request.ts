"use server"

import { sdk } from "@lib/config"
import { translate } from "@/lib/i18n"
import { getCartId } from "./cookies"
import { getLocale } from "./locale-actions"
import { validatePhoneNumber } from "@lib/util/phone"

export type DeliveryRequestState =
  | { status: "idle" }
  | { status: "sent"; email: string; country: string }
  | { status: "error"; message: string }

const field = (formData: FormData, name: string) =>
  String(formData.get(name) ?? "").trim()

/**
 * "Request a delivery quote": the checkout's address form, sent for a European
 * country the shop does not deliver to yet (`@lib/util/delivery-on-request`).
 * The backend reads the products from the cart and saves them with the address
 * and contact details for a representative, who answers with a price. Nothing
 * is ordered and the cart is left as it is.
 */
export async function requestDeliveryQuote(
  _state: DeliveryRequestState,
  formData: FormData
): Promise<DeliveryRequestState> {
  const locale = await getLocale()
  const fail = async (
    key: string,
    suffix = ""
  ): Promise<DeliveryRequestState> => ({
    status: "error",
    message: `${await translate(key, locale)}${suffix}`,
  })

  const cartId = await getCartId()
  if (!cartId) {
    return fail("checkout.deliveryRequest.error")
  }

  const country = field(formData, "shipping_address.country_code").toLowerCase()
  const email = field(formData, "email")
  const phone = field(formData, "shipping_address.phone")

  const required = [
    email,
    field(formData, "shipping_address.first_name"),
    field(formData, "shipping_address.last_name"),
    field(formData, "shipping_address.address_1"),
    field(formData, "shipping_address.postal_code"),
    field(formData, "shipping_address.city"),
    country,
  ]
  if (required.some((v) => !v)) {
    return fail("checkout.deliveryRequest.missingFields")
  }

  const phoneResult = validatePhoneNumber(country, phone)
  if (!phoneResult.valid) {
    return {
      status: "error",
      message: `${await translate(
        "checkout.phoneInvalid",
        locale
      )} ${await translate("checkout.phoneFormatHint", locale)} ${
        phoneResult.example
      }`,
    }
  }

  const isBusiness = field(formData, "customer_type") === "b2b"
  const optional = (name: string) => field(formData, name) || undefined

  try {
    await sdk.client.fetch("/store/delivery-requests", {
      method: "POST",
      body: {
        cart_id: cartId,
        email,
        first_name: field(formData, "shipping_address.first_name"),
        last_name: field(formData, "shipping_address.last_name"),
        company: optional("shipping_address.company"),
        vat_number: isBusiness ? optional("vat_number") : undefined,
        phone: phone || undefined,
        address_1: field(formData, "shipping_address.address_1"),
        address_2: optional("shipping_address.address_2"),
        postal_code: field(formData, "shipping_address.postal_code"),
        city: field(formData, "shipping_address.city"),
        province: optional("shipping_address.province"),
        country_code: country,
        message:
          field(formData, "delivery_request_message").slice(0, 2000) ||
          undefined,
        locale: locale ?? undefined,
      },
    })
  } catch (err) {
    // The backend's wording (an invalid email, an empty cart) is not meant
    // for customers: log it and show our own sentence.
    console.error(
      `[delivery-request] could not send: ${
        err instanceof Error ? err.message : String(err)
      }`
    )
    return fail("checkout.deliveryRequest.error")
  }

  return { status: "sent", email, country }
}
