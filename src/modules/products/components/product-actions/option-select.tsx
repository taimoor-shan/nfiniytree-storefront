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
                "btn-secondary h-10 py-2 px-4 text-xs",
                {
                  "border-primary": value.value === current && !isUnavailable,
                  "line-through opacity-60": isUnavailable,
                  "hover:shadow-elevation-card-rest transition-shadow ease-in-out duration-150":
                    value.value !== current && !isUnavailable,
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
