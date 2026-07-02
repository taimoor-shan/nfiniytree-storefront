"use client"

import { Select } from "@medusajs/ui"

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

const sortOptions = [
  {
    value: "created_at",
    label: "Latest Arrivals",
  },
  {
    value: "price_asc",
    label: "Price: Low → High",
  },
  {
    value: "price_desc",
    label: "Price: High → Low",
  },
]

const SortProducts = ({
  "data-testid": dataTestId,
  sortBy,
  setQueryParams,
}: SortProductsProps) => {
  return (
    <div
      className="w-full sm:w-[180px]"
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
        <Select.Trigger className="h-11 w-full px-4 border border-black ring-1">
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