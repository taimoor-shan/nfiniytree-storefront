"use client"

import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import React from "react"
import { useTranslation } from "@/lib/i18n"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  disabled: boolean
  "data-testid"?: string
  /** IDs of option values where ALL matching variants are out of stock */
  unavailableValueIds?: Set<string>
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
  unavailableValueIds,
}) => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-y-3">
      <span className="text-sm">{t("product.selectOption").replace("{title}", title)}</span>
      <div
        className="flex flex-wrap gap-2"
        data-testid={dataTestId}
      >
        {(option.values ?? []).map((value) => {
          const isUnavailable = unavailableValueIds?.has(value.id) ?? false

          return (
            <button
              onClick={() => updateOption(option.id, value.value)}
              key={value.id}
              className={clx(
                "h-9 py-2 px-6 text-xs",
                {
                  // `hover:!bg-primary` was forcing the lighter brand coral back
                  // under `.btn-primary`'s white label on hover, which is 3.28:1.
                  // The selected state already has the correct fill from
                  // `.btn-primary`, so the override only needs to stop the class's
                  // own hover from changing it — `primary-strong` is that fill.
                  "btn-primary border border-primary hover:!bg-primary-strong": value.value === current && !isUnavailable,
                  "btn-primary-outlined": value.value !== current && !isUnavailable,
                  "btn-grey": isUnavailable,
                }
              )}
              disabled={disabled}
              data-testid="option-button"
            >
              {value.value}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default OptionSelect
