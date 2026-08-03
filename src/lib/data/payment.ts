"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { getAuthHeaders } from "./cookies"
import { getCacheOptions, CACHE_TAGS, TTL } from "./cache"

export const listCartPaymentMethods = async (cartId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = getCacheOptions(CACHE_TAGS.paymentProviders, TTL.static)

  const result = await sdk.client.fetch<HttpTypes.StorePaymentProviderListResponse>(
    `/store/payment-providers`,
    {
      method: "GET",
      query: { region_id: cartId },
      headers,
      next,
      cache: "force-cache",
    }
  )

  // Extract the providers array from the paginated response
  return (result as any)?.payment_providers ?? []
}