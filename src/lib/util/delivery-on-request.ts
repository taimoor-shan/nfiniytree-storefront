/**
 * Countries the checkout lists under "Delivery on request". Pure, so it runs
 * under `npx tsx src/lib/util/delivery-on-request.test.ts`.
 *
 * The shop delivers (and prices delivery and tax) only in the countries of its
 * Medusa regions. Every other European country is offered too, so nobody gets
 * the impression the shop only serves three countries, but choosing one turns
 * the checkout into a "Request a delivery quote" form: the cart and address go
 * to the backend (Admin → Delivery requests) and a representative answers with
 * a price by hand. Once a country gets a region it is a normal checkout
 * country and drops out of this list by itself.
 */
import { HttpTypes } from "@medusajs/types"
import { intlLocale } from "./blog"
import { getAddressCountryName } from "./country-name"

/** The EU, the EEA, Switzerland and the United Kingdom (ISO 3166-1 alpha-2). */
export const EUROPEAN_COUNTRIES = [
  "at",
  "be",
  "bg",
  "hr",
  "cy",
  "cz",
  "dk",
  "ee",
  "fi",
  "fr",
  "de",
  "gr",
  "hu",
  "ie",
  "it",
  "lv",
  "lt",
  "lu",
  "mt",
  "nl",
  "pl",
  "pt",
  "ro",
  "sk",
  "si",
  "es",
  "se",
  "is",
  "li",
  "no",
  "ch",
  "gb",
] as const

/** Every country of every region: the countries the checkout delivers to. */
export const deliverableCountries = (
  regions?: HttpTypes.StoreRegion[] | null
): Set<string> =>
  new Set(
    (regions ?? []).flatMap((r) =>
      (r.countries ?? [])
        .map((c) => c.iso_2?.toLowerCase())
        .filter((c): c is string => !!c)
    )
  )

/** The European countries no region covers, sorted by name in `locale`. */
export const onRequestCountryOptions = (
  regions: HttpTypes.StoreRegion[] | null | undefined,
  locale?: string | null
): { value: string; label: string }[] => {
  const deliverable = deliverableCountries(regions)

  return EUROPEAN_COUNTRIES.filter((code) => !deliverable.has(code))
    .map((code) => ({
      value: code,
      label: getAddressCountryName(code, locale ?? "en"),
    }))
    .sort((a, b) =>
      a.label.localeCompare(b.label, locale ? intlLocale(locale) : undefined)
    )
}

/** True for a country the checkout only takes delivery requests for. */
export const isDeliveryOnRequest = (
  countryCode: string | null | undefined,
  regions: HttpTypes.StoreRegion[] | null | undefined
): boolean => {
  const code = (countryCode ?? "").toLowerCase()
  return (
    !!code &&
    (EUROPEAN_COUNTRIES as readonly string[]).includes(code) &&
    !deliverableCountries(regions).has(code)
  )
}

/**
 * Remembers a country on request the visitor chose in the country popup or
 * the header, so the header names it and the checkout opens as a quote
 * request for it. A country on request has no region, so no market URL of its
 * own: the visitor browses a euro market (`onRequestMarket`) meanwhile.
 */
export const DELIVERY_COUNTRY_COOKIE = "delivery-country"

// The euro markets shown to a visitor from a country on request, in order
const ON_REQUEST_MARKETS = ["at", "de"]

/**
 * The market to show a visitor whose delivery country is on request: the one
 * they are in when it sells in euro, else Austria, then Germany, then any
 * euro country. Their own market when the shop sells in no euro region.
 */
export const onRequestMarket = (
  regions: HttpTypes.StoreRegion[] | null | undefined,
  current?: string | null
): string | null => {
  const euro = (regions ?? [])
    .filter((r) => r.currency_code?.toLowerCase() === "eur")
    .flatMap((r) => (r.countries ?? []).map((c) => c.iso_2?.toLowerCase()))
    .filter((c): c is string => !!c)
  const here = current?.toLowerCase() || null

  if (here && euro.includes(here)) {
    return here
  }
  return ON_REQUEST_MARKETS.find((c) => euro.includes(c)) ?? euro[0] ?? here
}

/**
 * The country a country chooser (the first-visit popup, the header) starts
 * on: a country on request the visitor chose, else the one they are in when it
 * is on request (Cloudflare's guess, which they confirm), else their market.
 */
export const chooserStartCountry = ({
  market,
  chosen,
  geo,
  regions,
}: {
  market: string | null | undefined
  chosen: string | null | undefined
  geo: string | null | undefined
  regions: HttpTypes.StoreRegion[] | null | undefined
}): string | null =>
  [chosen, geo]
    .map((code) => code?.toLowerCase())
    .find((code) => isDeliveryOnRequest(code, regions)) ??
  market ??
  null

/**
 * The country on request the checkout opens with, as a quote request: the one
 * the visitor chose, until the cart holds an address they typed (then the
 * form shows that address, and its country, as it always did).
 */
export const checkoutStartCountry = ({
  chosen,
  cartAddress,
  regions,
}: {
  chosen: string | null | undefined
  cartAddress:
    | {
        first_name?: string | null
        address_1?: string | null
        country_code?: string | null
      }
    | null
    | undefined
  regions: HttpTypes.StoreRegion[] | null | undefined
}): string | null => {
  const typed = !!(cartAddress?.first_name || cartAddress?.address_1)
  const code = chosen?.toLowerCase() ?? null
  return !typed && isDeliveryOnRequest(code, regions) ? code : null
}
