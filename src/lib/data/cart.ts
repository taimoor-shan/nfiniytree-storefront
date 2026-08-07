"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidatePath, revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
  getCartId,
  removeCartId,
  setCartId,
} from "./cookies"
import { CACHE_TAGS } from "./cache"
import { getRegion } from "./regions"
import { getLocale } from "@lib/data/locale-actions"
import { listCartShippingMethods } from "./fulfillment"
import { validateVatNumber } from "@lib/util/vat"
import { validatePhoneNumber } from "@lib/util/phone"
import { verifyVatWithTaxID } from "@lib/util/taxid"
import { translate } from "@/lib/i18n"

/**
 * Retrieves a cart by its ID. If no ID is provided, it will use the cart ID from the cookies.
 * @param cartId - optional - The ID of the cart to retrieve.
 * @returns The cart object if found, or null if not found.
 */
export async function retrieveCart(cartId?: string, fields?: string) {
  const id = cartId || (await getCartId())
  fields ??=
    "*items, *items.tax_lines, *region, *items.product, *items.variant, *items.variant.options, *items.variant.images, *items.thumbnail, *items.metadata, +items.total, *promotions, *shipping_methods, *shipping_methods.tax_lines, *shipping_address"

  if (!id) {
    return null
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return await sdk.client
    .fetch<HttpTypes.StoreCartResponse>(`/store/carts/${id}`, {
      method: "GET",
      query: {
        fields,
      },
      headers,
      cache: "no-store",
    })
    .then(({ cart }: { cart: HttpTypes.StoreCart }) => {
      return cart
    })
    .catch((e) => {
      return null
    })
}

/**
 * Ensures the cart has a shipping address with the correct country code,
 * then fetches available shipping options and auto-selects if there is
 * exactly one. This triggers Medusa's server-side totals recalculation
 * so shipping cost and tax appear before checkout.
 */
async function ensureCartShippingCountry(
  cartId: string,
  countryCode: string,
  currentShippingAddress?: HttpTypes.StoreCartAddress | null,
  currentShippingMethods?: HttpTypes.StoreCartShippingMethod[] | null
) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  if (!currentShippingAddress?.country_code) {
    await sdk.store.cart.update(
      cartId,
      { shipping_address: { country_code: countryCode } },
      {},
      headers
    )
  }

  if (currentShippingMethods?.length) {
    return
  }

  const shippingOptions = await listCartShippingMethods(cartId)

  if (shippingOptions && shippingOptions.length === 1) {
    await sdk.store.cart.addShippingMethod(
      cartId,
      { option_id: shippingOptions[0].id },
      {},
      headers
    )
    revalidateTag(CACHE_TAGS.products, "max")
  }
}

export async function getOrSetCart(countryCode: string) {
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  let cart = await retrieveCart(undefined, "id,region_id,shipping_address,shipping_methods")

  const headers = {
    ...(await getAuthHeaders()),
  }

  if (!cart) {
    const locale = await getLocale()
    const cartResp = await sdk.store.cart.create(
      { region_id: region.id, locale: locale || undefined },
      {},
      headers
    )
    cart = cartResp.cart

    await setCartId(cart.id)

    await ensureCartShippingCountry(cart.id, countryCode)
    revalidateTag(CACHE_TAGS.products, "max")
  }

  if (cart && cart?.region_id !== region.id) {
    await sdk.store.cart.update(cart.id, { region_id: region.id }, {}, headers)
    await ensureCartShippingCountry(
      cart.id,
      countryCode,
      cart.shipping_address,
      cart.shipping_methods
    )
    revalidateTag(CACHE_TAGS.products, "max")
  }

  return cart
}

export async function updateCart(data: HttpTypes.StoreUpdateCart) {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found, please create one before updating")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .update(cartId, data, {}, headers)
    .then(async ({ cart }: { cart: HttpTypes.StoreCart }) => {
      revalidateTag(CACHE_TAGS.products, "max")
      revalidatePath("/", "layout")
      return cart
    })
    .catch((err) => {
      return medusaError(err)
    })
}

export async function addToCart({
  variantId,
  quantity,
  countryCode,
}: {
  variantId: string
  quantity: number
  countryCode: string
}) {
  if (!variantId) {
    throw new Error("Missing variant ID when adding to cart")
  }

  const cart = await getOrSetCart(countryCode)

  if (!cart) {
    throw new Error("Error retrieving or creating cart")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .createLineItem(
      cart.id,
      {
        variant_id: variantId,
        quantity,
      },
      {},
      headers
    )
    .then(async () => {
      revalidateTag(CACHE_TAGS.products, "max")
      revalidatePath("/", "layout")
    })
    .catch(medusaError)
}

export async function updateLineItem({
  lineId,
  quantity,
}: {
  lineId: string
  quantity: number
}) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when updating line item")
  }

  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("Missing cart ID when updating line item")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .updateLineItem(cartId, lineId, { quantity }, {}, headers)
    .then(async () => {
      revalidateTag(CACHE_TAGS.products, "max")
      revalidatePath("/", "layout")
    })
    .catch(medusaError)
}

export async function deleteLineItem(lineId: string) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when deleting line item")
  }

  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("Missing cart ID when deleting line item")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .deleteLineItem(cartId, lineId, {}, headers)
    .then(async () => {
      revalidateTag(CACHE_TAGS.products, "max")
      revalidatePath("/", "layout")
    })
    .catch(medusaError)
}

export async function setShippingMethod({
  cartId,
  shippingMethodId,
}: {
  cartId: string
  shippingMethodId: string
}) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .addShippingMethod(cartId, { option_id: shippingMethodId }, {}, headers)
    .then(async () => {
      revalidateTag(CACHE_TAGS.products, "max")
    })
    .catch(medusaError)
}

export async function initiatePaymentSession(
  cart: HttpTypes.StoreCart,
  data: HttpTypes.StoreInitializePaymentSession
) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.payment
    .initiatePaymentSession(cart, data, {}, headers)
    .then(async (resp) => {
      revalidateTag(CACHE_TAGS.products, "max")
      return resp
    })
    .catch(medusaError)
}

export async function applyPromotions(codes: string[]) {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .update(cartId, { promo_codes: codes }, {}, headers)
    .then(async () => {
      revalidateTag(CACHE_TAGS.products, "max")
    })
    .catch(medusaError)
}

export async function applyGiftCard(code: string) {
  //   const cartId = getCartId()
  //   if (!cartId) return "No cartId cookie found"
  //   try {
  //     await updateCart(cartId, { gift_cards: [{ code }] }).then(() => {
  //       revalidateTag("cart")
  //     })
  //   } catch (error: any) {
  //     throw error
  //   }
}

export async function removeDiscount(code: string) {
  // const cartId = getCartId()
  // if (!cartId) return "No cartId cookie found"
  // try {
  //   await deleteDiscount(cartId, code)
  //   revalidateTag("cart")
  // } catch (error: any) {
  //   throw error
  // }
}

export async function removeGiftCard(
  codeToRemove: string,
  giftCards: any[]
  // giftCards: GiftCard[]
) {
  //   const cartId = getCartId()
  //   if (!cartId) return "No cartId cookie found"
  //   try {
  //     await updateCart(cartId, {
  //       gift_cards: [...giftCards]
  //         .filter((gc) => gc.code !== codeToRemove)
  //         .map((gc) => ({ code: gc.code })),
  //     }).then(() => {
  //       revalidateTag("cart")
  //     })
  //   } catch (error: any) {
  //     throw error
  //   }
}

export async function submitPromotionForm(
  currentState: unknown,
  formData: FormData
) {
  const code = formData.get("code") as string
  try {
    await applyPromotions([code])
  } catch (e: any) {
    return e.message
  }
}

// TODO: Pass a POJO instead of a form entity here
export async function setAddresses(currentState: unknown, formData: FormData) {
  try {
    if (!formData) {
      throw new Error("No form data found when setting addresses")
    }
    const cartId = getCartId()
    if (!cartId) {
      throw new Error("No existing cart found when setting addresses")
    }

    const vatNumber = String(formData.get("vat_number") ?? "").trim()
    if (!vatNumber) {
      throw new Error("VAT number is required")
    }

    const countryCode = String(
      formData.get("shipping_address.country_code") ?? ""
    ).toLowerCase()
    const vatError = validateVatNumber(countryCode, vatNumber)
    if (vatError) {
      throw new Error(vatError)
    }

    // VIES verification via TaxID.dev (shared cache — typically a cache hit
    // when the client-side blur already verified this VAT before submit)
    const verification = await verifyVatWithTaxID(countryCode, vatNumber)
    if (verification.status === "invalid") {
      throw new Error(
        `VAT number is not registered in VIES for ${countryCode.toUpperCase()}`
      )
    }
    // service_unavailable: fail-open — allow checkout, no rejection

    const locale = await getLocale()

    // Company is required
    const company = String(formData.get("shipping_address.company") ?? "").trim()
    if (!company) {
      throw new Error(await translate("checkout.companyRequired", locale))
    }

    const sameAsBilling = formData.get("same_as_billing")
    if (sameAsBilling !== "on") {
      const billingCompany = String(
        formData.get("billing_address.company") ?? ""
      ).trim()
      if (!billingCompany) {
        throw new Error(await translate("checkout.companyRequired", locale))
      }
    }

    // Phone format validation (optional field, but validated when filled)
    const phoneResult = validatePhoneNumber(
      countryCode,
      String(formData.get("shipping_address.phone") ?? "")
    )
    if (!phoneResult.valid) {
      throw new Error(
        `${await translate("checkout.phoneInvalid", locale)} ${await translate("checkout.phoneFormatHint", locale)} ${phoneResult.example}`
      )
    }

    if (sameAsBilling !== "on") {
      const billingPhoneResult = validatePhoneNumber(
        countryCode,
        String(formData.get("billing_address.phone") ?? "")
      )
      if (!billingPhoneResult.valid) {
        throw new Error(
          `${await translate("checkout.phoneInvalid", locale)} ${await translate("checkout.phoneFormatHint", locale)} ${billingPhoneResult.example}`
        )
      }
    }

    const data = {
      shipping_address: {
        first_name: formData.get("shipping_address.first_name"),
        last_name: formData.get("shipping_address.last_name"),
        address_1: formData.get("shipping_address.address_1"),
        address_2: "",
        company: formData.get("shipping_address.company"),
        postal_code: formData.get("shipping_address.postal_code"),
        city: formData.get("shipping_address.city"),
        country_code: formData.get("shipping_address.country_code"),
        province: formData.get("shipping_address.province"),
        phone: formData.get("shipping_address.phone"),
        metadata: {
          vat_number: vatNumber,
          vat_company_name: verification.company_name || "",
          vat_validation_request_id: verification.request_id || "",
          vat_validation_timestamp: new Date().toISOString(),
        },
      },
      email: formData.get("email"),
    } as any

    if (sameAsBilling === "on") data.billing_address = data.shipping_address

    if (sameAsBilling !== "on")
      data.billing_address = {
        first_name: formData.get("billing_address.first_name"),
        last_name: formData.get("billing_address.last_name"),
        address_1: formData.get("billing_address.address_1"),
        address_2: "",
        company: formData.get("billing_address.company"),
        postal_code: formData.get("billing_address.postal_code"),
        city: formData.get("billing_address.city"),
        country_code: formData.get("billing_address.country_code"),
        province: formData.get("billing_address.province"),
        phone: formData.get("billing_address.phone"),
      }
    await updateCart(data)
  } catch (e: any) {
    return e.message
  }

  redirect(
    `/${formData.get("shipping_address.country_code")}/checkout?step=delivery`
  )
}

/**
 * Places an order for a cart. If no cart ID is provided, it will use the cart ID from the cookies.
 * @param cartId - optional - The ID of the cart to place an order for.
 * @returns The cart object if the order was successful, or null if not.
 */
export async function placeOrder(cartId?: string) {
  const id = cartId || (await getCartId())

  if (!id) {
    throw new Error("No existing cart found when placing an order")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const cartRes = await sdk.store.cart
    .complete(id, {}, headers)
    .then(async (cartRes) => {
      revalidateTag(CACHE_TAGS.products, "max")
      return cartRes
    })
    .catch(medusaError)

  if (cartRes?.type === "order") {
    const countryCode =
      cartRes.order.shipping_address?.country_code?.toLowerCase()

    removeCartId()
    redirect(`/${countryCode}/order/${cartRes?.order.id}/confirmed`)
  }

  return cartRes.cart
}

/**
 * Updates the country code param and revalidates the regions/products caches
 * @param regionId
 * @param countryCode
 */
export async function updateRegion(countryCode: string, currentPath: string) {
  const cartId = await getCartId()
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  if (cartId) {
    try {
      await updateCart({ region_id: region.id })
      await ensureCartShippingCountry(cartId, countryCode, null, null)
      revalidateTag(CACHE_TAGS.products, "max")
    } catch (error: any) {
      const message = String(error?.message || "")
      if (message.includes("already completed")) {
        await removeCartId()
        await getOrSetCart(countryCode)
      } else {
        throw error
      }
    }
  }

  revalidateTag(CACHE_TAGS.regions, "max")
  revalidateTag(CACHE_TAGS.products, "max")

  redirect(`/${countryCode}${currentPath}`)
}

export async function listCartOptions() {
  const cartId = await getCartId()
  const headers = {
    ...(await getAuthHeaders()),
  }

  return await sdk.client.fetch<{
    shipping_options: HttpTypes.StoreCartShippingOption[]
  }>("/store/shipping-options", {
    query: { cart_id: cartId },
    headers,
    cache: "no-store",
  })
}