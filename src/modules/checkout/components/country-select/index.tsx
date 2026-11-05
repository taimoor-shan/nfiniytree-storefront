"use client"

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react"

import NativeSelect, {
  NativeSelectProps,
} from "@modules/common/components/native-select"
import { HttpTypes } from "@medusajs/types"
import { getCountryName } from "@lib/util/country-name"
import { getCountryOptions } from "@lib/util/regions"
import { useTranslation } from "@lib/i18n/client"

const CountrySelect = forwardRef<
  HTMLSelectElement,
  NativeSelectProps & {
    region?: HttpTypes.StoreRegion
    regions?: HttpTypes.StoreRegion[]
    /**
     * Countries listed under "Delivery on request": European countries no
     * region covers, for which the checkout takes a quote request instead of
     * an order (`@lib/util/delivery-on-request`).
     */
    onRequestOptions?: { value: string; label: string }[]
  }
>(({ placeholder, region, regions, defaultValue, ...rest }, ref) => {
  const { onRequestOptions, ...props } = rest
  const { t, locale } = useTranslation()
  const resolvedPlaceholder = placeholder ?? t("common.country")
  const innerRef = useRef<HTMLSelectElement>(null)

  useImperativeHandle<HTMLSelectElement | null, HTMLSelectElement | null>(
    ref,
    () => innerRef.current
  )

  const countryOptions = useMemo(() => {
    // Multi-region: show all countries from all regions (checkout use case)
    if (regions?.length) {
      return getCountryOptions(regions, locale).map((o) => ({
        value: o.country,
        label: o.label,
      }))
    }

    // Single region: existing behavior (account forms)
    if (region) {
      return (
        region.countries?.map((country) => ({
          value: country.iso_2,
          label: getCountryName(
            country.iso_2,
            locale,
            country.display_name ?? ""
          ),
        })) ?? []
      )
    }

    return []
  }, [region, regions, locale])

  return (
    <NativeSelect
      ref={innerRef}
      placeholder={resolvedPlaceholder}
      defaultValue={defaultValue}
      {...props}
    >
      {countryOptions?.map(({ value, label }, index) => (
        <option key={index} value={value}>
          {label}
        </option>
      ))}
      {!!onRequestOptions?.length && (
        <optgroup label={t("checkout.deliveryOnRequest")}>
          {onRequestOptions.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </optgroup>
      )}
    </NativeSelect>
  )
})

CountrySelect.displayName = "CountrySelect"

export default CountrySelect
