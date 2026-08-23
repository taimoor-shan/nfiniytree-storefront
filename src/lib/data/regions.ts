"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions, CACHE_TAGS, TTL } from "./cache"

export const listRegions = async () => {
  const next = getCacheOptions(CACHE_TAGS.regions, TTL.static)

  return sdk.client
    .fetch<{ regions: HttpTypes.StoreRegion[] }>(`/store/regions`, {
      method: "GET",
      next,
      cache: "force-cache",
    })
    .then(({ regions }) => regions)
    .catch(medusaError)
}

export const retrieveRegion = async (id: string) => {
  const next = getCacheOptions(CACHE_TAGS.regions, TTL.static)

  return sdk.client
    .fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`, {
      method: "GET",
      next,
      cache: "force-cache",
    })
    .then(({ region }) => region)
    .catch(medusaError)
}

/**
 * Every ISO-2 country code the store actually serves, lowercased and sorted.
 *
 * Used to build hreflang clusters and the sitemap. Both must only ever contain
 * URLs that resolve, so this reads the live region list rather than a hardcoded
 * array. Returns an empty list if the backend is unreachable — callers fall
 * back to the default region rather than emitting alternates for markets that
 * may not exist.
 */
export const listCountryCodes = async (): Promise<string[]> => {
  try {
    const regions = await listRegions()

    if (!regions?.length) {
      return []
    }

    const codes = new Set<string>()
    regions.forEach((region) => {
      region.countries?.forEach((c) => {
        if (c?.iso_2) codes.add(c.iso_2.toLowerCase())
      })
    })

    return Array.from(codes).sort()
  } catch {
    return []
  }
}

const regionMap = new Map<string, HttpTypes.StoreRegion>()

export const getRegion = async (countryCode: string) => {
  try {
    if (regionMap.has(countryCode)) {
      return regionMap.get(countryCode)
    }

    const regions = await listRegions()

    if (!regions) {
      return null
    }

    regions.forEach((region) => {
      region.countries?.forEach((c) => {
        regionMap.set(c?.iso_2 ?? "", region)
      })
    })

    const region = countryCode
      ? regionMap.get(countryCode)
      : regionMap.get("us")

    return region
  } catch (e: any) {
    return null
  }
}