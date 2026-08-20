"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
  getCartId,
  removeAuthToken,
  removeCartId,
  setAuthToken,
} from "./cookies"
import { CACHE_TAGS } from "./cache"
import { getLocale } from "./locale-actions"
import { translate } from "@lib/i18n/dictionaries"

/**
 * Known backend error messages → translation keys.  Raw Medusa/SDK error
 * text is English and technical; these are the messages users can actually
 * encounter, localized before they reach the UI.
 */
const KNOWN_ERROR_KEYS: Record<string, string> = {
  "invalid email or password": "account.invalidCredentials",
}

/**
 * Localize a caught error for the UI.  Known messages are mapped to their
 * translation keys; everything else falls back to a generic message so raw
 * SDK errors never surface untranslated.
 */
const localizeError = async (error: any): Promise<string> => {
  const locale = await getLocale()
  const raw = String(error?.message ?? error ?? "").toLowerCase()
  const entry = Object.entries(KNOWN_ERROR_KEYS).find(([known]) =>
    raw.includes(known)
  )
  return translate(entry?.[1] || "account.errorOccurred", locale)
}

export const retrieveCustomer =
  async (): Promise<HttpTypes.StoreCustomer | null> => {
    const authHeaders = await getAuthHeaders()

    if (!authHeaders) return null

    const headers = {
      ...authHeaders,
    }

    return await sdk.client
      .fetch<{ customer: HttpTypes.StoreCustomer }>(`/store/customers/me`, {
        method: "GET",
        query: {
          // `*orders` pulled the customer's entire order history — with all its
          // relations — on every request, including the store layout that runs
          // on every page. Nothing reads `customer.orders`; the account
          // dashboard fetches orders separately via `listOrders()`.
          // `customer.addresses` *is* read (account overview, addresses and
          // profile pages, checkout), so that is the relation to expand.
          // A `*`-prefixed field is additive to Medusa's default selection.
          fields: "*addresses",
        },
        headers,
        cache: "no-store",
      })
      .then(({ customer }) => customer)
      .catch(() => null)
  }

export const updateCustomer = async (body: HttpTypes.StoreUpdateCustomer) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const updateRes = await sdk.store.customer
    .update(body, {}, headers)
    .then(({ customer }) => customer)
    .catch(medusaError)

  revalidateTag(CACHE_TAGS.products, "max")

  return updateRes
}

export async function signup(_currentState: unknown, formData: FormData) {
  const password = formData.get("password") as string
  const customerForm = {
    email: formData.get("email") as string,
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    phone: formData.get("phone") as string,
  }

  try {
    const token = await sdk.auth.register("customer", "emailpass", {
      email: customerForm.email,
      password: password,
    })

    await setAuthToken(token as string)

    const headers = {
      ...(await getAuthHeaders()),
    }

    const { customer: createdCustomer } = await sdk.store.customer.create(
      customerForm,
      {},
      headers
    )

    const loginToken = await sdk.auth.login("customer", "emailpass", {
      email: customerForm.email,
      password,
    })

    await setAuthToken(loginToken as string)

    revalidateTag(CACHE_TAGS.products, "max")

    await transferCart()

    return createdCustomer
  } catch (error: any) {
    return await localizeError(error)
  }
}

export async function login(_currentState: unknown, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    await sdk.auth
      .login("customer", "emailpass", { email, password })
      .then(async (token) => {
        await setAuthToken(token as string)
        revalidateTag(CACHE_TAGS.products, "max")
      })
  } catch (error: any) {
    return await localizeError(error)
  }

  try {
    await transferCart()
  } catch (error: any) {
    return await localizeError(error)
  }
}

export async function signout(countryCode: string) {
  await sdk.auth.logout()

  await removeAuthToken()

  revalidateTag(CACHE_TAGS.products, "max")

  await removeCartId()

  revalidateTag(CACHE_TAGS.products, "max")

  redirect(`/${countryCode}/account`)
}

export async function transferCart() {
  const cartId = await getCartId()

  if (!cartId) {
    return
  }

  const headers = await getAuthHeaders()

  await sdk.store.cart.transferCart(cartId, {}, headers)

  revalidateTag(CACHE_TAGS.products, "max")
}

export const addCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const isDefaultBilling = (currentState.isDefaultBilling as boolean) || false
  const isDefaultShipping = (currentState.isDefaultShipping as boolean) || false

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
    is_default_billing: isDefaultBilling,
    is_default_shipping: isDefaultShipping,
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .createAddress(address, {}, headers)
    .then(async ({ customer }) => {
      revalidateTag(CACHE_TAGS.products, "max")
      return { success: true, error: null }
    })
    .catch(async (err) => {
      return { success: false, error: await localizeError(err) }
    })
}

export const deleteCustomerAddress = async (
  addressId: string
): Promise<void> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.customer
    .deleteAddress(addressId, headers)
    .then(async () => {
      revalidateTag(CACHE_TAGS.products, "max")
      return { success: true, error: null }
    })
    .catch(async (err) => {
      return { success: false, error: await localizeError(err) }
    })
}

export async function requestPasswordReset(
  _currentState: unknown,
  formData: FormData
) {
  const email = formData.get("email") as string

  if (!email) {
    return await translate("account.emailRequired", await getLocale())
  }

  try {
    await sdk.auth.resetPassword("customer", "emailpass", {
      identifier: email,
    })
    return null
  } catch (error: any) {
    return await localizeError(error)
  }
}

export async function resetPassword(
  email: string,
  token: string,
  password: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    await sdk.auth.updateProvider(
      "customer",
      "emailpass",
      { password },
      token
    )
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: await localizeError(error) }
  }
}

export async function updateCustomerPassword(
  email: string,
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Re-authenticate with the old password to get a fresh identity token.
    // The JWT from the cookie can't be used with updateProvider — that
    // endpoint expects a login token or reset token, not a session JWT.
    const loginResult = await sdk.auth.login("customer", "emailpass", {
      email,
      password: oldPassword,
    })

    const token = typeof loginResult === "string" ? loginResult : null
    if (!token) {
      return {
        success: false,
        error: await translate("account.currentPasswordIncorrect", await getLocale()),
      }
    }

    await sdk.auth.updateProvider(
      "customer",
      "emailpass",
      { password: newPassword },
      token
    )

    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: await localizeError(error) }
  }
}

export const updateCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const addressId =
    (currentState.addressId as string) || (formData.get("addressId") as string)

  if (!addressId) {
    return {
      success: false,
      error: await translate("account.addressIdRequired", await getLocale()),
    }
  }

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
  } as HttpTypes.StoreUpdateCustomerAddress

  const phone = formData.get("phone") as string

  if (phone) {
    address.phone = phone
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .updateAddress(addressId, address, {}, headers)
    .then(async () => {
      revalidateTag(CACHE_TAGS.products, "max")
      return { success: true, error: null }
    })
    .catch(async (err) => {
      return { success: false, error: await localizeError(err) }
    })
}