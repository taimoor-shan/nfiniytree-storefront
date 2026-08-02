"use server"

import { sdk } from "@lib/config"
import { getCacheOptions, CACHE_TAGS } from "./cache"

type StoreResponse = {
  store: {
    id: string
    name?: string | null
  }
}

export const retrieveStore = async () => {
  const next = getCacheOptions(CACHE_TAGS.store)

  return sdk.client
    .fetch<StoreResponse>("/store/site", {
      next,
      cache: "force-cache",
    })
    .then(({ store }) => store)
    .catch(() => null)
}