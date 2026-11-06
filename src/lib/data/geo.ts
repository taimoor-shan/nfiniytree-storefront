import "server-only"
import { headers as nextHeaders } from "next/headers"
import { countryFromHeaders } from "@lib/geo/client-country"

/**
 * The visitor's country as Cloudflare reports it (lowercase ISO-2), or null.
 * A guess for the visitor to confirm, never a choice made for them: the
 * country popup starts on it when it is a country on request.
 */
export const getVisitorCountry = async (): Promise<string | null> => {
  try {
    return countryFromHeaders(await nextHeaders())
  } catch {
    return null
  }
}
