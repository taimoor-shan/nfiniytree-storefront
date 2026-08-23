"use client"

import { IconBadge, clx } from "@medusajs/ui"
import {
  SelectHTMLAttributes,
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react"

import ChevronDown from "@modules/common/icons/chevron-down"
import { useTranslation } from "@lib/i18n/client"

type NativeSelectProps = {
  placeholder?: string
  /** Accessible name, rendered visually hidden. */
  label?: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "size">

const CartItemSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ placeholder, label, className, children, ...props }, ref) => {
    const { t } = useTranslation()
    const resolvedPlaceholder = placeholder ?? t("common.select")
    const innerRef = useRef<HTMLSelectElement>(null)
    const [isPlaceholder, setIsPlaceholder] = useState(false)

    const reactId = useId()
    const selectId = props.id ?? reactId

    useImperativeHandle<HTMLSelectElement | null, HTMLSelectElement | null>(
      ref,
      () => innerRef.current
    )

    useEffect(() => {
      if (innerRef.current && innerRef.current.value === "") {
        setIsPlaceholder(true)
      } else {
        setIsPlaceholder(false)
      }
    }, [innerRef.current?.value])

    return (
      <div>
        <label htmlFor={selectId} className="sr-only">
          {label ?? t("cart.quantity")}
        </label>
        <IconBadge
          onFocus={() => innerRef.current?.focus()}
          onBlur={() => innerRef.current?.blur()}
          className={clx(
            "relative flex items-center txt-compact-small border text-ink group focus-within:ring-2 focus-within:ring-primary",
            className,
            {
              "text-body": isPlaceholder,
            }
          )}
        >
          <select
            ref={innerRef}
            id={selectId}
            {...props}
            className="appearance-none bg-transparent border-none px-4 transition-colors duration-150 focus:border-gray-700 outline-none w-16 h-16 items-center justify-center"
          >
            <option disabled value="">
              {resolvedPlaceholder}
            </option>
            {children}
          </select>
          <span className="absolute flex pointer-events-none justify-end w-8 group-hover:animate-pulse">
            <ChevronDown />
          </span>
        </IconBadge>
      </div>
    )
  }
)

CartItemSelect.displayName = "CartItemSelect"

export default CartItemSelect
