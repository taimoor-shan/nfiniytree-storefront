import { HttpTypes } from "@medusajs/types"

export type CountryOption = {
  country: string // iso_2
  region: string // region id
  label: string // display_name
}

/**
 * Flattens multiple regions' countries into a single sorted list of
 * { country, region, label } options. Used by both the nav country
 * selector and the first-visit country popup.
 */
export const getCountryOptions = (
  regions?: HttpTypes.StoreRegion[] | null
): CountryOption[] =>
  (regions ?? [])
    .flatMap((r) =>
      (r.countries ?? []).map((c) => ({
        country: c.iso_2!,
        region: r.id,
        label: c.display_name!,
      }))
    )
    .sort((a, b) => (a.label ?? "").localeCompare(b.label ?? ""))
