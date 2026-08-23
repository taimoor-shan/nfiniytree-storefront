import { Checkbox, Label } from "@medusajs/ui"
import React from "react"

type CheckboxProps = {
  checked?: boolean
  onChange?: () => void
  label: string
  name?: string
  'data-testid'?: string
}

const CheckboxWithLabel: React.FC<CheckboxProps> = ({
  checked = true,
  onChange,
  label,
  name,
  'data-testid': dataTestId
}) => {
  // Each checkbox needs a unique id/label pair. A hardcoded id made every
  // checkbox on a page share one id, so clicking any label toggled the first.
  const reactId = React.useId()
  const inputId = name ? `checkbox-${name}` : reactId

  return (
    <div className="flex space-x-2 ">
      <Checkbox
        className="text-base-regular flex items-center gap-x-2 shadow-md"
        id={inputId}
        role="checkbox"
        type="button"
        checked={checked}
        aria-checked={checked}
        onClick={onChange}
        name={name}
        data-testid={dataTestId}
      />
      <Label
        htmlFor={inputId}
        className="!transform-none !text-[14px] !leading-[1.5]"
      >
        {label}
      </Label>
    </div>
  )
}

export default CheckboxWithLabel
