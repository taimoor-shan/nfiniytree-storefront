import React, { useId } from "react"

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  /** Validation message. Announced on appearance and linked via aria-describedby. */
  error?: string | null
  /** Non-error hint text, also linked via aria-describedby. */
  helperText?: string
  name: string
}

/**
 * Storefront textarea with the same visual language and accessibility wiring
 * as the common `Input` (see src/modules/common/components/input): the same
 * border / focus-ring / hover classes, `required` + `aria-required`, and an
 * error state that only paints the red border through the `error` prop —
 * never via the eager `:invalid` CSS pseudo-class. Error and helper text are
 * linked with `aria-describedby`. The label sits above the field because a
 * multi-line control has no room for the `Input`'s inset floating label.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ name, label, error, helperText, required, ...props }, ref) => {
    // `name` can contain dots (e.g. "shipping_address.first_name"). That is
    // legal in an id attribute but awkward in CSS selectors, so slugify it.
    const reactId = useId()
    const textareaId =
      props.id ?? `${name.replace(/[^a-zA-Z0-9_-]/g, "-")}${reactId}`
    const errorId = `${textareaId}-error`
    const helperId = `${textareaId}-helper`

    const describedBy =
      [error ? errorId : null, helperText ? helperId : null]
        .filter(Boolean)
        .join(" ") || undefined

    return (
      <div className="flex flex-col w-full">
        <div className="flex flex-col gap-y-2 w-full">
          <label htmlFor={textareaId} className="text-sm font-medium text-ink">
            {label}
            {required && (
              <span className="text-error" aria-hidden="true">
                {" "}
                *
              </span>
            )}
          </label>
          <textarea
            ref={ref}
            id={textareaId}
            name={name}
            required={required}
            aria-required={required ? true : undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            rows={6}
            className={`pt-2 pb-1 block w-full px-4 mt-0 bg-canvas border rounded-md appearance-none focus:border-none hover:bg-surface-soft ${
              error ? "border-error" : "border-hairline"
            }`}
            {...props}
          />
        </div>
        {helperText && (
          <span id={helperId} className="text-xs text-ui-fg-subtle mt-1">
            {helperText}
          </span>
        )}
        {error && (
          <span id={errorId} role="alert" className="text-xs text-error mt-1">
            {error}
          </span>
        )}
      </div>
    )
  }
)

Textarea.displayName = "Textarea"

export default Textarea