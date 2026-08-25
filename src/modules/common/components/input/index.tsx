import { Label } from "@medusajs/ui"
import React, { useEffect, useImperativeHandle, useId, useState } from "react"

import Eye from "@modules/common/icons/eye"
import EyeOff from "@modules/common/icons/eye-off"
import { useTranslation } from "@lib/i18n/client"

type InputProps = Omit<
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
  "placeholder"
> & {
  label: string
  /** Validation message. Announced on appearance and linked via aria-describedby. */
  error?: string | null
  /** Non-error hint text, also linked via aria-describedby. */
  helperText?: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
  name: string
  topLabel?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type,
      name,
      label,
      error,
      helperText,
      errors,
      touched,
      required,
      topLabel,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [inputType, setInputType] = useState(type)
    const { t } = useTranslation()

    // `name` can contain dots (e.g. "shipping_address.first_name"). That is
    // legal in an id attribute but awkward in CSS selectors, so slugify it.
    const reactId = useId()
    const inputId = props.id ?? `${name.replace(/[^a-zA-Z0-9_-]/g, "-")}${reactId}`
    const errorId = `${inputId}-error`
    const helperId = `${inputId}-helper`

    const describedBy =
      [error ? errorId : null, helperText ? helperId : null]
        .filter(Boolean)
        .join(" ") || undefined

    useEffect(() => {
      if (type === "password" && showPassword) {
        setInputType("text")
      }

      if (type === "password" && !showPassword) {
        setInputType("password")
      }
    }, [type, showPassword])

    useImperativeHandle(ref, () => inputRef.current!)

    return (
      <div className="flex flex-col w-full">
        {topLabel && (
          <Label className="mb-2 txt-compact-medium-plus">{topLabel}</Label>
        )}
        <div className="flex relative z-0 w-full txt-compact-medium">
          <input
            type={inputType}
            name={name}
            id={inputId}
            placeholder=" "
            required={required}
            aria-required={required ? true : undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={`pt-4 pb-1 block w-full h-11 px-4 mt-0 bg-canvas border rounded-md appearance-none focus:border-none hover:bg-surface-soft ${
              error ? "border-error" : "border-hairline"
            }`}
            {...props}
            ref={inputRef}
          />
          <label
            htmlFor={inputId}
            onClick={() => inputRef.current?.focus()}
            className="flex items-center justify-center mx-3 px-1 transition-all absolute duration-300 top-3 -z-1 origin-0 text-body"
          >
            {label}
            {required && (
              <span className="text-error" aria-hidden="true">
                *
              </span>
            )}
          </label>
          {type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="btn-text-link px-4 absolute right-0 top-3"
              aria-label={
                showPassword
                  ? t("a11y.hidePassword").replace("{label}", label)
                  : t("a11y.showPassword").replace("{label}", label)
              }
              aria-pressed={showPassword}
            >
              {showPassword ? <Eye /> : <EyeOff />}
            </button>
          )}
        </div>
        {helperText && (
          <span id={helperId} className="text-xs text-ui-fg-subtle mt-1">
            {helperText}
          </span>
        )}
        {error && (
          <span
            id={errorId}
            role="alert"
            className="text-xs text-error mt-1"
          >
            {error}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

export default Input
