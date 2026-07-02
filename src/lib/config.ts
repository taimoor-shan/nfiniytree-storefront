import { getLocaleHeader } from "@lib/util/get-locale-header"
import Medusa, { FetchArgs, FetchInput } from "@medusajs/js-sdk"

const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  publishableKey: PUBLISHABLE_KEY,
})

const originalFetch = sdk.client.fetch.bind(sdk.client)

sdk.client.fetch = async <T>(
  input: FetchInput,
  init?: FetchArgs
): Promise<T> => {
  const headers: Record<string, string | null> = {
    ...(init?.headers as Record<string, string | null>),
  }

  try {
    const localeHeader = await getLocaleHeader()
    if (localeHeader?.["x-medusa-locale"] && !headers["x-medusa-locale"]) {
      headers["x-medusa-locale"] = localeHeader["x-medusa-locale"]
    }
  } catch {
    // Ignore locale resolution errors
  }

  const nextInit: FetchArgs = {
    ...init,
    headers,
  }

  return originalFetch<T>(input, nextInit)
}