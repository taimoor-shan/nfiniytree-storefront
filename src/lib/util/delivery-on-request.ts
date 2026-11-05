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
