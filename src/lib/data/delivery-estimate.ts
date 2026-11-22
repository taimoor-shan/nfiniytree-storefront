"use server"

import { sdk } from "@lib/config"
import { CACHE_TAGS, getCacheOptions } from "./cache"

export type DeliveryEstimate = {
  shipping_class: string
  country_code: string
  currency_code: string
  /** Net of VAT, in `currency_code`: the cheapest and dearest postcode zone. */
  min: number
  max: number
  tax_inclusive: boolean
}

/**
 * What delivering one unit of a product to the market's country costs before
 * the postcode is known (the backend's Shipping rates). Null when there is
 * nothing to say or the backend cannot be reached: the product page then
 * leaves the line out instead of failing.
 */
export const getDeliveryEstimate = async ({
  productId,
  countryCode,
  currencyCode,
}: {
  productId: string
  countryCode: string
  currencyCode: string
}): Promise<DeliveryEstimate | null> => {
  try {
    const { estimate } = await sdk.client.fetch<{ estimate: DeliveryEstimate | null }>(
      "/store/delivery-estimate",
      {
        method: "GET",
        query: {
          product_id: productId,
          country_code: countryCode,
          currency_code: currencyCode,
        },
        // Rates change rarely; an hour is soon enough after an edit.
        next: getCacheOptions(CACHE_TAGS.products, 3600),
        cache: "force-cache",
      }
    )
    return estimate ?? null
  } catch {
    return null
  }
}
