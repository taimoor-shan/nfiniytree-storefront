/**
 * Placeholder for the PDP buy box while the customer lookup resolves.
 *
 * The previous fallback rendered a real `<ProductActions disabled>` — a
 * fully-styled Add to Cart button that looked live but ignored clicks, which is
 * what shoppers reported as "the button took several seconds to become active".
 * A skeleton is honest: it reads as not-yet-loaded, so there is no live control
 * to impersonate and no click to silently swallow.
 */
const SkeletonProductActions = () => {
  return (
    <div className="flex flex-col gap-y-2 animate-pulse" aria-hidden>
      {/* Option selects + divider */}
      <div className="flex flex-col gap-y-4">
        <div className="w-20 h-4 bg-ui-bg-subtle rounded" />
        <div className="flex gap-2">
          <div className="w-24 h-10 bg-ui-bg-subtle rounded-md" />
          <div className="w-24 h-10 bg-ui-bg-subtle rounded-md" />
        </div>
        <div className="w-full h-px bg-hairline" />
      </div>

      {/* Price */}
      <div className="w-28 h-7 bg-ui-bg-subtle rounded" />

      {/* Quantity stepper + Add to cart */}
      <div className="flex gap-x-3">
        <div className="w-[120px] h-10 bg-ui-bg-subtle rounded-md" />
        <div className="flex-1 h-10 bg-ui-bg-subtle rounded-md" />
      </div>
    </div>
  )
}

export default SkeletonProductActions
