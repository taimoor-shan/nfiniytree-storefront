"use client"

import { ChevronUpDown } from "@medusajs/icons"
import { clx } from "@medusajs/ui"
import {
  SelectHTMLAttributes,
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import { useTranslation } from "@lib/i18n/client"

export type NativeSelectProps = {
  placeholder?: string
  /**
   * Accessible name for the select. Defaults to `placeholder`, which is what
   * the visible (disabled) first option shows. Rendered visually hidden so the
   * existing design is untouched but the control is never unnamed.
   */
  label?: string
  error?: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
} & SelectHTMLAttributes<HTMLSelectElement>

const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  (
    { placeholder, label, error, errors, touched, defaultValue, className, children, ...props },
    ref
  ) => {
    const { t } = useTranslation()
    const resolvedPlaceholder = placeholder ?? t("common.select")
    const innerRef = useRef<HTMLSelectElement>(null)
    const [isPlaceholder, setIsPlaceholder] = useState(false)

    const reactId = useId()
    const selectId = props.id ?? (props.name ? `select-${props.name}` : reactId)
    const errorId = `${selectId}-error`

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
          {label ?? resolvedPlaceholder}
        </label>
        <div
          onFocus={() => innerRef.current?.focus()}
          onBlur={() => innerRef.current?.blur()}
          className={clx(
            "relative flex items-center text-base-regular border border-hairline bg-surface-card rounded-md hover:bg-surface-soft focus-within:ring-2 focus-within:ring-primary",
            className,
            {
              "text-muted": isPlaceholder,
              "border-error": !!error,
            }
          )}
        >
          <select
            ref={innerRef}
            id={selectId}
            defaultValue={defaultValue}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            {...props}
            className="appearance-none flex-1 bg-transparent border-none px-4 py-2.5 transition-colors duration-150 outline-none "
          >
            <option disabled value="">
              {resolvedPlaceholder}
            </option>
            {children}
          </select>
          <span className="absolute right-4 inset-y-0 flex items-center pointer-events-none ">
            <ChevronUpDown />
          </span>
        </div>
        {error && (
          <p id={errorId} role="alert" className="pt-1 text-xs text-error">
            {error}
          </p>
        )}
      </div>
    )
  }
)

NativeSelect.displayName = "NativeSelect"

export default NativeSelect
