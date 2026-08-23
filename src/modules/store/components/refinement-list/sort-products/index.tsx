"use client"

import { Select } from "@medusajs/ui"
import { useTranslation } from "@/lib/i18n"

export type SortOptions =
  | "price_asc"
  | "price_desc"
  | "created_at"

type SortProductsProps = {
  sortBy: SortOptions
  setQueryParams: (
    name: string,
    value: SortOptions
  ) => void
  "data-testid"?: string
}

const SortProducts = ({
  "data-testid": dataTestId,
  sortBy,
  setQueryParams,
}: SortProductsProps) => {
  const { t } = useTranslation()

  const sortOptions = [
    { value: "created_at", label: t("store.latestArrivals") },
    { value: "price_asc", label: t("store.priceLowToHigh") },
    { value: "price_desc", label: t("store.priceHighToLow") },
  ]
  return (
    <div
      className="w-full sm:w-auto"
      data-testid={dataTestId}
    >
      <Select
        value={sortBy}
        onValueChange={(value) =>
          setQueryParams(
            "sortBy",
            value as SortOptions
          )
        }
      >
        {/* `Select.Value` renders only the *current* option ("Latest
            Arrivals"), so the trigger's whole accessible name was that value —
            it never said what the control changes. Screen readers announced
            "Latest Arrivals, combobox" with no indication it sorts the product
            grid. `aria-label` supplies the missing name; the visible trigger is
            unchanged. This component is shared by the home, store, category and
            collection grids, so all four are covered. */}
        <Select.Trigger
          aria-label={t("store.sortBy")}
          className="h-11 w-full px-4 border border-black ring-1"
        >
          <Select.Value />
        </Select.Trigger>

        <Select.Content
          position="popper"
          className="rounded"
        >
          {sortOptions.map((option) => (
            <Select.Item
              key={option.value}
              value={option.value}
              className="text-sm"
            >
              {option.label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
    </div>
  )
}

export default SortProducts