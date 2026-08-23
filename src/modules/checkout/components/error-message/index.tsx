const ErrorMessage = ({
  error,
  id,
  "data-testid": dataTestid,
}: {
  error?: string | null
  /** Pass the id referenced by the related field's `aria-describedby`. */
  id?: string
  "data-testid"?: string
}) => {
  if (!error) {
    return null
  }

  return (
    <div
      id={id}
      // `role="alert"` gives the message an implicit assertive live region so
      // it is announced when it appears, rather than being silently painted.
      role="alert"
      className="pt-2 text-error text-small-regular"
      data-testid={dataTestid}
    >
      <span>{error}</span>
    </div>
  )
}

export default ErrorMessage
