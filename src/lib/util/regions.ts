import { HttpTypes } from "@medusajs/types"

import { intlLocale } from "./blog"
import { getCountryName } from "./country-name"

export type CountryOption = {
  country: string // iso_2
  region: string // region id
  label: string // display_name, or the name in `locale` when one is given
}

/**
 * Flattens multiple regions' countries into a single sorted list of
 * { country, region, label } options. Used by both the nav country
 * selector and the first-visit country popup.
 *
 * Medusa's `display_name` is English. With a `locale`, the labels are the
 * country names in that language and the list is sorted by them.
 */
export const getCountryOptions = (
  regions?: HttpTypes.StoreRegion[] | null,
  locale?: string | null
): CountryOption[] =>
  (regions ?? [])
    .flatMap((r) =>
      (r.countries ?? []).map((c) => ({
        country: c.iso_2!,
        region: r.id,
        label: getCountryName(c.iso_2, locale, c.display_name!),
      }))
    )
    .sort((a, b) =>
      (a.label ?? "").localeCompare(
        b.label ?? "",
        locale ? intlLocale(locale) : undefined
      )
    )
